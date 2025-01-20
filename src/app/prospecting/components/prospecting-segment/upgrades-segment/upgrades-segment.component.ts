import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { CostIntegration } from 'src/app/models/cost-integration.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbUpgrade } from 'src/app/models/psb_upgrades.model';
import { UpgradesComponent } from 'src/app/prospecting/modals/upgrades/upgrades.component';
import { selectProjectWithoutRidge } from 'src/app/prospecting/state/propsecting.selectors';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { v4 as uuidv4 } from 'uuid';

export interface UpgradesList {
  description: string;
  value?: string | number;
  visible: boolean;
}

@Component({
  selector: 'app-upgrades-segment',
  templateUrl: './upgrades-segment.component.html',
  styleUrls: ['./upgrades-segment.component.scss'],
})
export class UpgradesSegmentComponent implements OnInit, OnDestroy {
  @Output() changeSegmentEmmited = new EventEmitter<string>();

  project: Project;
  building: Building;
  buildings: Building[];
  costIntegrationsValleyMetal: CostIntegration[];
  costIntegrationsRidgeVent: CostIntegration[];
  costIntegrationValleyM: CostIntegration;
  costIntegrationRidgeV: CostIntegration;
  upgradesActive: boolean;
  otherMeasuresActive: boolean;
  upgradeList: UpgradesList[];
  showIconError: boolean;
  userDisabledPermision = false;
  storeSubs: Subscription;
  buildingVerified = false;
  withoutRidge: boolean;
  isCheckedToBeReplaced: boolean;
  isCheckedAddNew: boolean;

  constructor(
    private catalogsService: CatalogsService,
    private modalController: ModalController,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private synProjects: SyncProjectsService,
    private rolesPermissionsService: RolesPermissionsService
  ) {
    this.store.pipe(select(selectProjectWithoutRidge)).subscribe(value => this.withoutRidge = value);

    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project || this.project?.versions?.length == 0) {
        return;
      }
      const { buildings } = this.project.versions.find((x) => x.active);
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
      this.buildingVerified = this.project.versions.find((x) => x.active).is_verified;

      if (!this.building) {
        return;
      }
      this.otherMeasuresActive = this.projectService.findResourceId(9);
      this.upgradesActive = this.projectService.findResourceId(11);
      this.getVentilationList();
      this.validateRolePermission();
    
      this.isCheckedToBeReplaced = this.buildings[0].psb_measure.vent_is_ridgevent_be_replace;
      this.isCheckedAddNew = this.buildings[0].psb_measure.vent_is_ridgevent_add;
    });
  }

  ngOnInit() {
    this.getCostIntegrations();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  getCostIntegrations() {
    this.catalogsService.getCostIntegrations().then((result) => {
      this.costIntegrationsValleyMetal = result.data;

      const upgrade = this.findCostIntegrationId(1);
      if (this.building.psb_measure.psb_upgrades && upgrade) {
        this.costIntegrationsValleyMetal.map((x) => {
          if (x.id == upgrade.id_cost_integration) {
            x.isChecked = true;
            this.costIntegrationValleyM = x;
          }
        });
      }
    });
    this.catalogsService.getCostIntegrations().then((result) => {
      this.costIntegrationsRidgeVent = result.data;

      const upgrade = this.findCostIntegrationId(2);
      if (this.building.psb_measure.psb_upgrades && upgrade) {
        this.costIntegrationsRidgeVent.map((x) => {
          if(this.isCheckedToBeReplaced){     
            this.withoutRidge = true;
          }
          if(this.isCheckedAddNew && x.id == 1){
            x.isChecked = true;
          }
          if(this.isCheckedAddNew && x.id != 1){
            x.isChecked = false;
          }
          if(!this.isCheckedAddNew && !this.isCheckedToBeReplaced){
            x.isChecked = false;
          }
        });
      }
    });
  }

  onOptionSelectedCostIntegrations(
    costIntegration: any,
    option: number, type: string
  ) {
    if(type==='valley'){
        this.costIntegrationValleyM = costIntegration;
    }
    if(type==='ridge'){
        this.costIntegrationRidgeV = costIntegration;
    }
    const costIntegrationSelected = costIntegration;

    const upgrade = this.findCostIntegrationId(option);

    if (upgrade) {
      const upgradeUpdated = {
        ...upgrade,
        id_cost_integration: costIntegrationSelected.id,
        isModified: true,
      };

      const psb_upgrades_updated = this.building.psb_measure.psb_upgrades.map(
        (x) => {
          if (x.id == upgradeUpdated.id) {
            return upgradeUpdated;
          } else {
            return x;
          }
        }
      );

      const psbMeasuresUpdated = {
        ...this.building.psb_measure,
        psb_upgrades: psb_upgrades_updated,
      };
      this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    } else {
      const upgradeNew: PsbUpgrade = {
        id_upgrade: option,
        id: uuidv4(),
        id_project: this.project.id,
        id_cost_integration: costIntegrationSelected.id,
        isModified: true
      };
      const psb_upgrades_updated = this.building.psb_measure.psb_upgrades
        ? [...this.building.psb_measure.psb_upgrades]
        : [];
      psb_upgrades_updated.push(upgradeNew);

      const psbMeasuresUpdated = {
        ...this.building.psb_measure,
        psb_upgrades: psb_upgrades_updated,
      };
      this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    }
  }

  findCostIntegrationId(upgrateId: number) {
    const upgrade = this.building.psb_measure.psb_upgrades?.find(
      (x) => x.id_upgrade === upgrateId
    );
    return upgrade;
  }

  getVentilationList() {
    this.upgradeList = [];
    if (!this.building.psb_measure?.psb_upgrades_vent) return;

    this.upgradeList.push(
      {
        description: 'Ridge Vent',
        value: `${this.building.psb_measure.psb_upgrades_vent.ridgevents_lf} LF`,
        visible: this.building.psb_measure.psb_upgrades_vent.ridgevents_lf
          ? true
          : false,
      },
      {
        description: 'Metal Attic Vents to Replace',
        value: `${this.building.psb_measure.psb_upgrades_vent.attic_replace_pc} PC`,
        visible: this.building.psb_measure.psb_upgrades_vent.attic_replace_pc
          ? true
          : false,
      },
      {
        description: 'Metal Attic Vents to Remove and Cover',
        value: `${this.building.psb_measure.psb_upgrades_vent.attic_remove_pc} PC`,
        visible: this.building.psb_measure.psb_upgrades_vent.attic_remove_pc
          ? true
          : false,
      },
      {
        description: 'Cut in New Metal Attic Vents',
        value: `${this.building.psb_measure.psb_upgrades_vent.attic_cutin_pc} PC`,
        visible: this.building.psb_measure.psb_upgrades_vent.attic_cutin_pc
          ? true
          : false,
      },
      {
        description: 'Solar Power Vent to be Deleted',
        value: `${this.building.psb_measure.psb_upgrades_vent.solar_pv_del_pc} PC`,
        visible: true,
      },
      {
        description: `Keep ${this.building.psb_measure.psb_upgrades_vent.solar_pv_keep_pc} in place`,
        visible: true,
      },
      {
        description: 'Power Vent to be Deleted',
        value: `${this.building.psb_measure.psb_upgrades_vent.pv_del_pc} PC`,
        visible: true
      },
      {
        description: `Keep ${this.building.psb_measure.psb_upgrades_vent.pv_keep_pc} in place`,
        visible: true,
      },
      {
        description: 'New Solar Power',
        value: `${this.building.psb_measure.psb_upgrades_vent.solar_pv_new_pc} PC`,
        visible: this.building.psb_measure.psb_upgrades_vent.solar_pv_new_pc
          ? true
          : false,
      },
      {
        description: 'New Power Vent ',
        value: `${this.building.psb_measure.psb_upgrades_vent.pv_new_pc} PC`,
        visible: this.building.psb_measure.psb_upgrades_vent.pv_new_pc
          ? true
          : false,
      }
    );

  }

  async goAdvanceVentilation() {
    const modal = await this.modalController.create({
      component: UpgradesComponent,
      cssClass: 'screen-650',
      componentProps: {},
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
  }

  onVerifiedCheked(event) {
    if (
      ((!this.costIntegrationRidgeV && !this.withoutRidge) || !this.costIntegrationValleyM) &&
      !event
    ) {
      this.showIconError = true;
    } else {
      this.showIconError = false;
      //upgrades= 11
      const psb_verifieds = this.projectService.getShingleVerifiedInformation(
        11,
        !this.upgradesActive
      );
      const project_shingle_building: PsbMeasures = {
        ...this.building.psb_measure,
        psb_verifieds,
      };

      this.projectService.saveProjectShingleBuilding(project_shingle_building);
      setTimeout(() => {
        if(!event){
          this.synProjects.syncOffline();
          this.changeSegmentEmmited.emit('selection');
        }
      }, 500);
    }
  }

  validateRolePermission(){
    this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project).
    then((result) => {
     this.userDisabledPermision = result;
    });
  }
}
