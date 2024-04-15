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
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { AlertController, NavController } from '@ionic/angular';
import { AppComponent } from 'src/app/app.component';
import { PopoverController } from '@ionic/angular';

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
  idUserRole: number;
  showPreview: boolean = false;
  showMdlAcceptance: boolean = false;

  constructor(
    private auth: AuthService,
    private alertController: AlertController,
    private projectService: ProjectsService,
    private popoverController: PopoverController,
    private router: Router,
    private route: ActivatedRoute,
    private modalController: ModalController,
    private store: Store<AppState>,
    private menu: MenuController,
    private routerOutlet: IonRouterOutlet,
    private synProjects: SyncProjectsService,
    private modalService: AppComponent
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

      let shingle_lines = this.project.versions[0].shingle_lines.length ? true : false;

      this.auth.getAuthUser().then(user => {
        this.idUserRole = parseInt(user.role.id_role);

        this.showMdlAcceptance = ((this.project.id_project_status >= 3 ||  this.idUserRole > 2) && shingle_lines) ? true : false;
      });
      this.showPreview = this.project.id_project_status >= 3 ? true : false;
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

    modal.onDidDismiss().then((data) => {
      if (data?.data?.saveDb) {
        setTimeout(() => { this.synProjects.syncOffline(); }, 500);
      }
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
      if (data?.data?.saveDb) {
        setTimeout(() => { this.synProjects.syncOffline(); }, 500);
      }
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

    if (this.project.id_project_status === 5) {
      const alert = await this.alertController.create({
        header: 'Are you sure you want accept this proposal?',
        message: 'This proposal was marked as locker',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
            }
          }, {
            text: 'Accept',
            handler: () => {
              this.acceptContinue();
            }
          }
        ]
      });

      await alert.present();
    }

    else {
      this.acceptContinue()
    }

  }

  async acceptContinue() {
    const modal = await this.modalController.create({
      component: ModalAcceptanceComponent,
      cssClass: 'fullscreen',
    });
    // Escuchar el evento cuando se cierra la modal
    modal.onDidDismiss().then((data) => {
      if (data?.data?.saveDb) {
        setTimeout(() => { this.synProjects.syncOffline(); }, 500);
      }
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

  /**
   * Click menu item
   */
  clickOption() {
    this.modalService.clickOption({
      id: 4,
      name: 'Proposal Preview',
      url: '/pdf-viewer-page',
      //
      active: false,
    });
  }
  createVersion() {
    this.popoverController.dismiss({ createNew: true });
  }
}
