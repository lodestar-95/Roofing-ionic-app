import { Component, OnDestroy, OnInit,EventEmitter,Output } from '@angular/core';
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
import { AlertController } from '@ionic/angular';
import { AppComponent } from 'src/app/app.component';
import { PopoverController } from '@ionic/angular';

// create new version
import { Version } from 'src/app/models/version.model';
import { v4 as uuidv4 } from 'uuid';


@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss']
})
/**
 * @author: Carlos Rodríguez
 */
export class DetailPage implements OnInit, OnDestroy {
  @Output() changeVersionEmited = new EventEmitter<boolean>();

  id: number;
  project: Project;
  building: Building;
  showBuilding: boolean = true;
  idUserRole: number;
  showPreview: boolean = false;
  showMdlAcceptance: boolean = true;
  currentUserRoleId: number;
  currentUserId: number;

  version: Version;

  constructor(
    private auth: AuthService,
    private alertController: AlertController,
    private projectService: ProjectsService,
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
        console.log(this.project.id_project_status);


        if (this.project.id_project_status === 5 || this.project.id_project_status < 3 || this.idUserRole > 2 || shingle_lines) {
          this.showMdlAcceptance = false
        }
      });
      this.showPreview = this.project.id_project_status >= 3 ? true : false;
    });


  }

  ngOnInit() {
    this.menu.enable(true);
    this.getProject();
    this.routerOutlet.swipeGesture = false;

    this.auth.getAuthUser().then((user) => {
      this.currentUserRoleId = parseInt(user.role.id_role);
      this.currentUserId = user.id;
    });
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

  getNextProjectVersion(projectVersion: string) {
    let versionNumber = +projectVersion.toLowerCase().match(/v(\d+)/)[1];
    return `V${++versionNumber}-${new Date().toLocaleDateString()}`;
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

  private createNewVersion(activeVersion: Version) {
    this.projectService.saveVersion({ ...this.version, active: false, is_current_version: false });

    const lastVersion = this.project.versions[this.project.versions.length - 1];
    const nextProjectVersion = this.getNextProjectVersion(lastVersion.project_version);
    const newVersionId = uuidv4();

    return {
      ...activeVersion,
      id: newVersionId,
      project_version: nextProjectVersion,
      active: true,
      is_current_version: true,
      isModified: true,
      id_cost_type: activeVersion.id_cost_type ?? 1,
      shingle_lines: activeVersion.shingle_lines.map(x => ({ ...x, id: uuidv4(), id_version: newVersionId, isModified: true })),
      pv_trademarks: activeVersion.pv_trademarks.map(x => ({ ...x, id: uuidv4(), id_version: newVersionId, isModified: true })),
      buildings: activeVersion.buildings.map((building) => {
        const newBuildingId = uuidv4();
        let newMeasure = null;
        if (building.psb_measure) {
          const newMeasureId = uuidv4();
          const newVerifies = building.psb_measure.psb_verifieds?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newNoRequireds = building.psb_measure.psb_no_requireds?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newSlopes = building.psb_measure.psb_slopes?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newLayers = building.psb_measure.psb_layers?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newOptions = building.psb_measure.psb_options?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newCrickets = building.psb_measure.psb_crickets?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newChimneys = building.psb_measure.psb_chimneys?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newSkylights = building.psb_measure.psb_skylights?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newMaterials = building.psb_measure.psb_selected_materials?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newUpgrades = building.psb_measure.psb_upgrades?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));

          newMeasure = {
            ...building.psb_measure,
            id: newMeasureId,
            id_project_building: newBuildingId,
            psb_verifieds: newVerifies,
            psb_no_requireds: newNoRequireds,
            psb_slopes: newSlopes,
            psb_layers: newLayers,
            psb_options: newOptions,
            psb_crickets: newCrickets,
            psb_chimneys: newChimneys,
            psb_skylights: newSkylights,
            psb_selected_materials: newMaterials,
            psb_upgrades: newUpgrades,
            isModified: true
          };
        }

        return { ...building, pb_scopes: [], id: newBuildingId, psb_measure: newMeasure, isModified: true };
      })
    };
  }


  async clickCreateVersion () {
    const alert = await this.alertController.create({
      header: 'Are you sure you want create a new version?',
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
            this.createVersion();
          }
        }
      ]
    });
    await alert.present()
  }

  async createVersion() {
    let versions: Version[];
    const activeVersion = this.project.versions.find(x => x.active);
    const newVersion = this.createNewVersion(activeVersion);

    versions = [...this.project.versions.map((x) => {
      return { ...x, active: false, is_current_version: false, isModified: true };
    }), newVersion];

    const projectUpdated = { ...this.project, versions: versions, isModified: true };
    await this.projectService.update(this.project.id, projectUpdated);
    this.changeVersionEmited.emit(true);
  }

}
