import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Project } from 'src/app/models/project.model';
import { ModalController, ToastController } from '@ionic/angular';
import { PsbSlope } from 'src/app/models/psb-slope.model';
import { Building } from 'src/app/models/building.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { ModalRoofSlopeComponent } from './modals/modal-roof-slope/modal-roof-slope.component';
import { DeleteComponent } from 'src/app/prospecting/modals/delete/delete.component';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { Subscription } from 'rxjs';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

@Component({
  selector: 'app-roof-slopes-list',
  templateUrl: './roof-slopes-list.component.html',
  styleUrls: ['./roof-slopes-list.component.scss']
})
export class RoofSlopesListComponent implements OnInit, OnDestroy {
  @Output() changeSegmentEmmited = new EventEmitter<string>();

  project: Project;
  psb_slopes: PsbSlope[] = [];
  projectShingleBuilding: PsbMeasures;
  building: Building;
  buildings: Building[];
  maxLayers: number;
  totalProjectShingleLayers: number;
  jobType: number; //id_job_type  (13: Remove & replace) y (14: Overlay | ?: new construction),
  roofSlopesActive: boolean;
  storeSubs: Subscription;
  userDisabledPermision = false;
  buildingVerified = false;

  constructor(
    private store: Store<AppState>,
    private modalController: ModalController,
    private projectService: ProjectsService,
    private toastController: ToastController,
    private synProjects: SyncProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private general: GeneralService
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      this.loadRoofSlopes();
      this.validateRolePermission();
    });
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  loadRoofSlopes() {
    if (!this.project || this.project?.versions?.length == 0) {
      return;
    }

    const { buildings } = this.project.versions.find(x => x.active);

    this.buildings = buildings;
    this.building = buildings.find(x => x.active);
    this.buildingVerified = this.project.versions.find((x) => x.active).is_verified;

    if (this.building) {
      this.roofSlopesActive = this.findResource(7);

      this.jobType = this.building.id_job_type;
      this.projectShingleBuilding = { ...this.building.psb_measure };
      this.totalProjectShingleLayers = this.building.psb_measure.psb_layers
        ? this.building.psb_measure.psb_layers.length
        : 0;

      if (this.building.psb_measure?.hasOwnProperty('psb_slopes')) {
        this.psb_slopes = this.building.psb_measure.psb_slopes.filter(
          slope => slope.deletedAt == null
        );

        if (this.psb_slopes == null || this.psb_slopes == undefined) {
          this.psb_slopes = [];
        } else {
          this.maxLayers = 0;
          this.psb_slopes.forEach(element => {
            if (this.maxLayers < element.layers) {
              this.maxLayers = element.layers;
            }
          });
        }
      }
    }
  }

  async openModalRoofSlope(roofSlope) {
    if (!this.psb_slopes) {
      this.psb_slopes = [];
    }
    const modal = await this.modalController.create({
      component: ModalRoofSlopeComponent,
      cssClass: this.jobType == 13 ? 'building' : 'modal-sm',
      componentProps: {
        jobType: this.jobType,
        projectSlope: roofSlope ? roofSlope : null,
        totalSlopes: this.psb_slopes.length
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }

    const psbMeasure: PsbMeasures = {
      ...this.building.psb_measure,
      psb_slopes: data.psbMeasure.psb_slopes,
      psb_verifieds: data.psbMeasure.psb_verifieds,
      psb_selected_materials: data.psbMeasure.psb_selected_materials
    };

    this.projectService.saveProjectShingleBuilding(psbMeasure);
  }

  async openModalDelete(roofSlope) {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete',
      componentProps: {
        message: 'Are you sure to delete this slope?'
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      this.deleteRoofSlope(roofSlope);
    }
  }

  deleteRoofSlope(roofSlope) {
    const projectSlopeUpdated = { ...roofSlope, isModified: true };
    projectSlopeUpdated.deletedAt = new Date();

    const slopes: PsbSlope[] = this.building.psb_measure.psb_slopes.map(x => {
      if (x.id == roofSlope.id) {
        return projectSlopeUpdated;
      } else {
        return x;
      }
    });

    this.savePsbSlopes(slopes, projectSlopeUpdated.pitch);
  }

  savePsbSlopes(psb_slopes: PsbSlope[], slopePitchUpdate) {
    let psbMeasure: PsbMeasures = {
      ...this.building.psb_measure,
      psb_slopes
    };
    if (slopePitchUpdate <= 1.9) {
      psbMeasure = {
        ...psbMeasure,
        eves_rakes_lf_flat_roof: 0,
        id_metal_eves_rakes_flat_roof: null
      };
    } else if (slopePitchUpdate >= 4) {
      psbMeasure = {
        ...psbMeasure,
        eves_starters_lf_steep_slope: 0,
        valleys_lf_steep_slope: 0,
        rakes_lf_steep_slope: 0,
        id_metal_eves_starters_low_slope: null,
        id_metal_rakes_low_steep_slope: null
      };
    } else {
      psbMeasure = {
        ...psbMeasure,
        eves_starters_lf_low_slope: 0,
        rakes_lf_low_steep_slope: 0,
        valleys_lf_low_slope: 0,
        id_metal_eves_starters_low_slope: null,
        id_metal_rakes_low_steep_slope: null
      };
    }
    this.projectService.saveProjectShingleBuilding(psbMeasure);
  }

  /**
   * Present message inside the screen.
   *
   * @param message
   */
  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      animated: true,
      color: 'dark'
    });
    toast.present();
  }

  async savePsbVerified(event) {
    let psb_verifieds = this.projectService.getShingleVerifiedInformation(
      7,
      !this.roofSlopesActive
    );

    const isValidOtherMeasures = this.validateRoofOtherMeasuresData();

    if (!isValidOtherMeasures) {
      psb_verifieds = psb_verifieds.map(x => {
        if (x.id_resource == 9) {
          return { ...x, is_verified: false };
        } else {
          return x;
        }
      });
    }

    const project_shingle_building: PsbMeasures = {
      ...this.building.psb_measure,
      psb_verifieds
    };

    if (!this.requireFlatRoofData()) {
      project_shingle_building.eves_rakes_lf_flat_roof = 0;
      project_shingle_building.id_metal_eves_rakes_flat_roof = null;
    }

    if (!this.requireLowSlopeData()) {
      project_shingle_building.eves_starters_lf_low_slope = 0;
      project_shingle_building.valleys_lf_steep_slope = 0;
      project_shingle_building.rakes_lf_low_steep_slope = 0;
    }

    if (!this.requireSteepSlopeData()) {
      project_shingle_building.rakes_lf_steep_slope = 0;
      project_shingle_building.valleys_lf_steep_slope = 0;
      project_shingle_building.eves_starters_lf_steep_slope = 0;
    }

    if (!this.requireLowSlopeData() && !this.requireSteepSlopeData()) {
      project_shingle_building.id_metal_eves_starters_low_slope = null;
      project_shingle_building.id_metal_rakes_low_steep_slope = null;
    }

    /*if (this.requireSetSlopesDataNull()) {
      project_shingle_building.hips_lf = 0;
      project_shingle_building.ridge_lf = 0;

      const upgradeRidgeventsId = await this.general.getConstDecimalValue('upgrade_ridgevents');
      const costIntegrationDeclinedId = await this.general.getConstDecimalValue('cost_integration_declined');
      if(project_shingle_building.psb_upgrades && project_shingle_building.psb_upgrades.length > 0 ){

        project_shingle_building.psb_upgrades = project_shingle_building.psb_upgrades.map(x => {
          if(x.id_upgrade === upgradeRidgeventsId) {
            return {...x, id_cost_integration: costIntegrationDeclinedId};
          }
          return x;
        });
      } else {
        project_shingle_building.psb_upgrades = [{
          id_upgrade: upgradeRidgeventsId,
          id: null,
          id_project: this.project.id,
          id_cost_integration: costIntegrationDeclinedId,
          isModified: null,
      }
        ];
      }

      const categoryRidgecapId = await this.general.getConstDecimalValue('category_ridgecap');
      if(project_shingle_building.psb_selected_materials){
        project_shingle_building.psb_selected_materials = project_shingle_building.psb_selected_materials.map(
          x => {
            if (x.id_material_category === categoryRidgecapId) {
              return {...x, deletedAt:  new Date()};
            }
          return x;}
        );
      }
    }*/

    this.projectService.saveProjectShingleBuilding(project_shingle_building);

    setTimeout(() => {
      if (!event) {
        this.synProjects.syncOffline();
        this.changeSegmentEmmited.emit('details');
      }
    }, 500);
  }

  validateRoofOtherMeasuresData() {
    if (this.requireFlatRoofData() && !this.hasFlatRoofData()) {
      return false;
    }

    if (this.requireLowSlopeData() && !this.hasLowSlopeData()) {
      return false;
    }

    if (this.requireSteepSlopeData() && !this.hasSteepSlopeData()) {
      return false;
    }

    return true;
  }

  private requireFlatRoofData() {
    return this.building.psb_measure.psb_slopes.some(
      x => x.pitch >= 0 && x.pitch <= 1.9 && x.deletedAt == null
    );
  }

  private requireLowSlopeData() {
    return this.building.psb_measure.psb_slopes.some(
      x => x.pitch >= 2 && x.pitch <= 3.9 && x.deletedAt == null
    );
  }

  private requireSteepSlopeData() {
    return this.building.psb_measure.psb_slopes.some(
      x => x.pitch >= 4 && x.pitch <= 24 && x.deletedAt == null
    );
  }

  private requireSetSlopesDataNull() {
    return this.building.psb_measure.psb_slopes.filter(slope => !slope.deletedAt).length === 1;
  }

  hasFlatRoofData(): boolean {
    return (this.building.psb_measure.eves_rakes_lf_flat_roof ?? 0) > 0;
  }

  hasLowSlopeData(): boolean {
    return (this.building.psb_measure.eves_starters_lf_low_slope ?? 0) > 0;
  }

  hasSteepSlopeData(): boolean {
    return (this.building.psb_measure.eves_starters_lf_steep_slope ?? 0) > 0;
  }

  /**
   * Verified information before save data
   *
   * @returns
   */
  async onVerifiedCheked(event) {
    if (
      this.psb_slopes.length > 0 &&
      (this.totalProjectShingleLayers == this.maxLayers ||
        this.totalProjectShingleLayers > this.maxLayers ||
        (this.totalProjectShingleLayers == this.maxLayers && this.maxLayers == 0))
    ) {
      await this.savePsbVerified(event);
    } else if (this.psb_slopes.length == 0) {
      this.presentToast('Roof slopes not found!');
    } else if (this.totalProjectShingleLayers != this.maxLayers) {
      this.presentToast('Layers not found!');
    }
  }

  findResource(idResource: number) {
    let verifiedInformation;
    if(this.building.psb_measure.psb_verifieds !== undefined) {
      verifiedInformation = this.building.psb_measure.psb_verifieds.find(
        x => x.id_resource == idResource
      );
    } else{
      return false;
    }

    return verifiedInformation ? verifiedInformation.is_verified : false;
  }

  validateRolePermission() {
    this.rolesPermissionsService
      .validateUserPermision(
        this.project.id_project_status,
        this.project.user_saleman.id_user,
        this.project
      )
      .then(result => {
        this.userDisabledPermision = result;
      });
  }
}
