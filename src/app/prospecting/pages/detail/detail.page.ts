import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonRouterOutlet, MenuController, ModalController } from '@ionic/angular';
import { Project } from 'src/app/models/project.model';
import { ModalNotesComponent } from '../../../shared/modals/modal-notes/modal-notes.component';
import { ProjectsService } from '../../../services/projects.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import * as prospectingActions from '../../prospecting.actions';
import { Building } from 'src/app/models/building.model';
import { ModalNewContactDateComponent } from 'src/app/shared/modals/modal-new-contact-date/modal-new-contact-date.component';
import { ModalRejectProposalComponent } from 'src/app/shared/modals/modal-reject-proposal/modal-reject-proposal.component';
import { ModalAcceptanceComponent } from 'src/app/shared/modals/modal-acceptance/modal-acceptance.component';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss']
})
/**
 * @author: Carlos Rodríguez
 */
export class DetailPage implements OnInit, OnDestroy {
  id: number;
  project: Project;
  building: Building;
  showBuilding: boolean = true;

  showMdlAcceptance:boolean = false;

  constructor(
    private projectService: ProjectsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalController: ModalController,
    private store: Store<AppState>,
    private menu: MenuController,
    private routerOutlet: IonRouterOutlet
  ) {
    this.id = parseInt(this.route.snapshot.paramMap.get('id'));
    localStorage.setItem('idProject', this.id + '');

    this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project || this.project.versions.length == 0) {
        return;
      }

      const version = this.project.versions.find(x => x.active);
      if (!version) {
        return;
      }

      const { buildings } = this.project.versions.find(x => x.active);
      this.building = buildings.find(x => x.active);

      this.showMdlAcceptance = (this.project.id_project_status>=3)?true:false;
    });
  }

  ngOnInit() {
    this.menu.enable(true);
    this.getProject();
    this.routerOutlet.swipeGesture = false;
  }

  ngOnDestroy() {
    this.menu.enable(false);
    this.routerOutlet.swipeGesture = true;
  }

  ionViewWillLeave() {
    this.store.dispatch(prospectingActions.unSetProject());
  }

  /**
   * Get project info
   */
  getProject() {
    this.projectService.get(this.id).then(
      result => {
        result.data.versions.map(x => {
          x.active = x.is_current_version;

          x.buildings.map(x => {
            x.active = false;
          });
        });

        this.store.dispatch(prospectingActions.setProject({ project: result.data }));
      },
      error => {
        console.log(error);
      }
    );
  }

  /**
   * Show notes modal
   */
  async openNotesModal() {
    const modal = await this.modalController.create({
      component: ModalNotesComponent,
      cssClass: 'fullscreen'
    });
    await modal.present();
  }
  /**
   * Show New Contact Date Modal
   * @return void
   */
   async openNewContactDateModal() {
    const modal = await this.modalController.create({
      component: ModalNewContactDateComponent,
      cssClass: 'small-screen',
    });
    await modal.present();
  }
  /**
   * Show Reject Proposal Modal
   * @return void
   */
   async openRejectProposalModal() {
    const modal = await this.modalController.create({
      component: ModalRejectProposalComponent,
      cssClass: 'medium-screen',
    });
    // Escuchar el evento cuando se cierra la modal
    modal.onDidDismiss().then((data) => {
        if (data?.data?.redirect) {
          this.router.navigate(['/home/prospecting']);
        }
    });

    await modal.present();
  }

    /**
   * Show notes modal
   */
     async openAcceptanceModal() {
      const modal = await this.modalController.create({
        component: ModalAcceptanceComponent,
        cssClass: 'fullscreen',
      });
      // Escuchar el evento cuando se cierra la modal
    modal.onDidDismiss().then((data) => {
        if (data?.data?.redirect) {
          this.router.navigate(['/home/prospecting']);
        }
    });
      await modal.present();
    }
  onBuildingSelected(event) {
    const { building } = event;
    const version = this.project.versions.find(x => x.active);
    const { buildings } = this.project.versions.find(x => x.active);

    localStorage.setItem('idBuilding', building.id + '');

    const buildings2 = buildings.map(x => {
      if (building.id == x.id) {
        return { ...x, active: true, isModified: true };
      } else {
        return { ...x, active: false, isModified: true };
      }
    });

    const versions = this.project.versions.map(x => {
      if (x.id === version.id) {
        return { ...x, buildings: buildings2 };
      } else {
        return { ...x };
      }
    });

    const projectUpdated = { ...this.project, versions: versions };
    this.projectService.update(this.project.id, projectUpdated);

    this.showBuilding = event.option;
  }

  /**
   * Hide tabs and show building list
   */
  showBuildings() {
    const building: Building = {
      ...this.building,
      active: false
    };

    this.projectService.saveProjectBuilding(building);

    this.showBuilding = true;
  }
}
