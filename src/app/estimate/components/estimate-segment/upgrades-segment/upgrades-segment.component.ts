import { JobType } from 'src/app/models/job-type.mode';
import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';

import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbUpgrade } from 'src/app/models/psb_upgrades.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { RadioButtonList } from 'src/app/shared/interfaces/radio-button-list';
import { v4 as uuidv4 } from 'uuid';
import { UpgradesRadio } from '../../upgrades-radio-buttons/upgrades-radio-buttons.component';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

@Component({
  selector: 'app-upgrades-segment',
  templateUrl: './upgrades-segment.component.html',
  styleUrls: ['./upgrades-segment.component.scss']
})
export class UpgradesSegmentComponent implements OnInit {
  project: Project;
  mainBuilding: Building;

  materialWarrantySelected: PsbUpgrade;
  workWarrantySelected: PsbUpgrade;
  windWarrantySelected: PsbUpgrade;
  wMetalSelected: PsbUpgrade;
  ridgeVentsSelected: PsbUpgrade;
  hpRidgeCapSelected: PsbUpgrade;
  options: UpgradesRadio[] = [];
  storeSubs: Subscription;
  canModifyProposal = true;
  userDisabledPermision = false;
  alwaysAllowModification: boolean;
  // idAux: number;
  // isClickedCheckBox: boolean = false;

  constructor(
    private catalogService: CatalogsService,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private navController: NavController,
    private alertController: AlertController,
    private general: GeneralService
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      this.canModifyProposal = this.project?.project_status?.id == 1 || this.project?.project_status?.id == 2;
      const { buildings } = this.project.versions.find(x => x.active);
      if (buildings.length == 0) {
        return;
      }
      this.mainBuilding = buildings.find(x => x.is_main_building);

      if (!this.mainBuilding) {
        return;
      }
      this.initData();
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() { }

  /**
   *
   */
  initData() {
    let psb_upgrades: PsbUpgrade[] = [];
    if (this.mainBuilding.psb_measure.psb_upgrades) {
      const wmetal = this.mainBuilding.psb_measure.psb_upgrades.find(
        x => x?.id_upgrade == 1
      );
      if (!wmetal) {
        const upgradeWmetal: PsbUpgrade = {
          id: uuidv4(),
          id_upgrade: 1,
          id_cost_integration: null,
          id_project: this.project.id,
          isModified: true
        };

        psb_upgrades.push(upgradeWmetal);
      }

      const ridge = this.mainBuilding.psb_measure.psb_upgrades.find(
        x => x?.id_upgrade == 2
      );
      if (!ridge) {
        const upgradeRidge: PsbUpgrade = {
          id: uuidv4(),
          id_upgrade: 2,
          id_cost_integration: null,
          id_project: this.project.id,
          isModified: true
        };

        psb_upgrades.push(upgradeRidge);
      }

      const windWarranty = this.mainBuilding.psb_measure.psb_upgrades.find(
        x => x?.id_upgrade == 3
      );
      if (!windWarranty) {
        psb_upgrades.push(this.getWindWarrantySelected());
      }

      const materialWarrantySelected = this.mainBuilding.psb_measure.psb_upgrades.find(
        x => x?.id_upgrade == 5
      );
      if (!materialWarrantySelected) {
        psb_upgrades.push(this.getworkmanchipAndMaterialWarranties()[0]);
      }

      const workWarrantySelected = this.mainBuilding.psb_measure.psb_upgrades.find(
        x => x?.id_upgrade == 6
      );
      if (!workWarrantySelected) {
        psb_upgrades.push(this.getworkmanchipAndMaterialWarranties()[1]);
      }

      const hpRidgeSelected = this.mainBuilding.psb_measure.psb_upgrades.find(
        x => x?.id_upgrade == 7
      );
      if (!hpRidgeSelected) {
        psb_upgrades.push(this.getHpRidgeCapSelected());
      }

      this.createInitPsbUpgrades(psb_upgrades);
      this.getPsbUpgrades();
      this.getRadioButtons();
      this.validateRolePermission();
      this.getAlwaysAllowModification();
    }
  }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
    console.log(this.alwaysAllowModification);
  }

  /**
   * Get list a radio buttons
   */
  async getRadioButtons() {
    this.options = [
      { title: 'W Metal', options: [], psbUpgrade: null },
      { title: 'Ridge Vents', options: [], psbUpgrade: null, disabled: await this.hasRidge()},
      { title: 'Material Full System Warranty', options: [], disabled: await this.isOnlyOverlay()},
      { title: 'Manufacture Workmanship Warranty', options: [], disabled: await this.isOnlyOverlay()},
      { title: 'Wind Warranty', options: [], psbUpgrade: null, disabled: await this.isOnlyOverlay()},
      { title: 'HP Ridge Cap', options: [], psbUpgrade: null, disabled: await this.hasRidge()},
    ];
    this.catalogService.getCostIntegrations().then(result => {
      this.options.forEach((element: UpgradesRadio) => {
        element.options = [];
        result.data.forEach(x => {
          const option: RadioButtonList = {
            id: x.id,
            text: x.cost_integration,
            isChecked: false
          };

          switch (element.title) {
            case 'W Metal':
              option.isChecked = x.id == this.wMetalSelected?.id_cost_integration;
              element.psbUpgrade = this.wMetalSelected;
              break;
            case 'Ridge Vents':
              option.isChecked = x.id == this.ridgeVentsSelected?.id_cost_integration;
              element.psbUpgrade = this.ridgeVentsSelected;
              break;
            case 'Material Full System Warranty':
              option.isChecked =
              x.id == this.materialWarrantySelected?.id_cost_integration;
              element.psbUpgrade = this.materialWarrantySelected;
              break;
            case 'Manufacture Workmanship Warranty':
              option.isChecked = x.id == this.workWarrantySelected?.id_cost_integration;
              element.psbUpgrade = this.workWarrantySelected;
              break;
            case 'Wind Warranty':
              option.isChecked = x.id == this.windWarrantySelected?.id_cost_integration;
              element.psbUpgrade = this.windWarrantySelected;
              break;
            case 'HP Ridge Cap':
              option.isChecked = x.id == this.hpRidgeCapSelected?.id_cost_integration;
              element.psbUpgrade = this.hpRidgeCapSelected;
              break;
          }

          element.options.push(option);
        });
      });
    });
  }
  hasRidge(): boolean | PromiseLike<boolean> {
    const x = this.project.versions.find(v => v.is_current_version).buildings.every(element => {
      //TODO: hay que modificar esta condicion
      if(element.psb_measure.ridge_lf > 0){
        return false;
      }else{
        return true;
      }
    });
    console.log("xxxxxxxx");
    console.log(this.project.versions.find(v => v.is_current_version).buildings);
    console.log(x);
    return x;
  }

  async isOnlyOverlay(){
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');
    const x = this.project.versions.find(v => v.is_current_version).buildings.every(element => {
      if(element.id_job_type !== job_types_overlay){
        return false;
      }else{
        return true;
      }
    });
    console.log("xxxxxxxx");
    console.log(job_types_overlay);
    console.log(this.project.versions.find(v => v.is_current_version).buildings);
    console.log(x);
    return x;
  }

  /**
   * Get info for a first time
   * @returns
   */
  getworkmanchipAndMaterialWarranties(): PsbUpgrade[] {
    let psbUpgrades: PsbUpgrade[];
    switch (this.mainBuilding.psb_measure.id_project_warranty_option) {
      case 1:
        psbUpgrades = [
          {
            id: uuidv4(),
            id_upgrade: 5,
            id_cost_integration: 3,
            id_project: this.project.id,
            isModified: true
          },
          {
            id: uuidv4(),
            id_upgrade: 6,
            id_cost_integration: 3,
            id_project: this.project.id,
            isModified: true
          }
        ];
      case 2:
        psbUpgrades = [
          {
            id: uuidv4(),
            id_upgrade: 5,
            id_cost_integration: 1,
            id_project: this.project.id,
            isModified: true
          },
          {
            id: uuidv4(),
            id_upgrade: 6,
            id_cost_integration: 3,
            id_project: this.project.id,
            isModified: true
          }
        ];
      case 3:
        psbUpgrades = [
          {
            id: uuidv4(),
            id_upgrade: 5,
            id_cost_integration: 2,
            id_project: this.project.id,
            isModified: true
          },
          {
            id: uuidv4(),
            id_upgrade: 6,
            id_cost_integration: 3,
            id_project: this.project.id,
            isModified: true
          }
        ];
      case 4:
        psbUpgrades = [
          {
            id: uuidv4(),
            id_upgrade: 6,
            id_cost_integration: 1,
            id_project: this.project.id,
            isModified: true
          },
          {
            id: uuidv4(),
            id_upgrade: 5,
            id_cost_integration: 3,
            id_project: this.project.id,
            isModified: true
          }
        ];
      case 5:
        psbUpgrades = [
          {
            id: uuidv4(),
            id_upgrade: 6,
            id_cost_integration: 2,
            id_project: this.project.id,
            isModified: true
          },
          {
            id: uuidv4(),
            id_upgrade: 5,
            id_cost_integration: 3,
            id_project: this.project.id,
            isModified: true
          }
        ];
      case 6:
        psbUpgrades = [
          {
            id: uuidv4(),
            id_upgrade: 5,
            id_cost_integration: 2,
            id_project: this.project.id,
            isModified: true
          },
          {
            id: uuidv4(),
            id_upgrade: 6,
            id_cost_integration: 2,
            id_project: this.project.id,
            isModified: true
          }
        ];
      case 7:
        psbUpgrades = [
          {
            id: uuidv4(),
            id_upgrade: 5,
            id_cost_integration: 1,
            id_project: this.project.id,
            isModified: true
          },
          {
            id: uuidv4(),
            id_upgrade: 6,
            id_cost_integration: 2,
            id_project: this.project.id,
            isModified: true
          }
        ];
    }

    return psbUpgrades;
  }

  /**
   * Get info for a first time
   * @returns
   */
  getWindWarrantySelected(): PsbUpgrade {
    const psbUpgrade: PsbUpgrade = {
      id: uuidv4(),
      id_upgrade: 3,
      id_cost_integration: this.mainBuilding.psb_measure.id_cost_int_windw,
      id_project: this.project.id,
      isModified: true
    };

    return psbUpgrade;
  }

  getHpRidgeCapSelected(): PsbUpgrade {
    const upgrade = this.mainBuilding?.psb_measure?.psb_upgrades?.find(
      x => x.id_upgrade == 7
    );

    const psbUpgrade: PsbUpgrade = {
      id: uuidv4(),
      id_upgrade: 7,
      id_cost_integration: upgrade?.id_cost_integration ?? null,
      id_project: this.project.id,
      isModified: true
    };

    return psbUpgrade;
  }

  /**
   *
   */
  getPsbUpgrades() {
    this.wMetalSelected = this.mainBuilding.psb_measure.psb_upgrades.find(
      x => x.id_upgrade == 1
    );

    this.ridgeVentsSelected = this.mainBuilding.psb_measure.psb_upgrades.find(
      x => x.id_upgrade == 2
    );

    this.windWarrantySelected = this.mainBuilding.psb_measure.psb_upgrades.find(
      x => x.id_upgrade == 3
    );

    this.materialWarrantySelected = this.mainBuilding.psb_measure.psb_upgrades.find(
      x => x.id_upgrade == 5
    );

    this.workWarrantySelected = this.mainBuilding.psb_measure.psb_upgrades.find(
      x => x.id_upgrade == 6
    );

    this.hpRidgeCapSelected = this.mainBuilding.psb_measure.psb_upgrades.find(
      x => x.id_upgrade == 7
    );
  }

  /**
   * Push initial objects in psb_upgrades
   */
  async createInitPsbUpgrades(psb_upgrade: PsbUpgrade[]) {
    if(psb_upgrade.length==0){
      return;
    }

    const psb_upgrades: PsbUpgrade[] = [
      ...this.mainBuilding.psb_measure.psb_upgrades,
      ...psb_upgrade
    ];

    const psb_measure: PsbMeasures = {
      ...this.mainBuilding.psb_measure,
      psb_upgrades
    };

    await this.projectService.savePsbMesaureMainBuilding(psb_measure);
  }

  /**
   *
   * @param event
   */
  async onChange(event) {
    const psb_upgrades = this.mainBuilding.psb_measure.psb_upgrades.map(x => {
      if (x.id_upgrade == event.element.psbUpgrade.id_upgrade) {
        return {
          ...x,
          isModified: true,
          id_cost_integration: event.item.id
        };
      } else {
        return { ...x };
      }
    });

    let buildingUpgrades = psb_upgrades ?? [];
    let ids = [];
    buildingUpgrades = buildingUpgrades.filter(x => {
      if (isNaN(x.id) && ids.includes(x.id_upgrade)) {
        return false;
      }
      ids.push(x.id_upgrade);
      return true;
    });

    const isRidgeUpgrade = event.element.psbUpgrade.id_upgrade == 2 && event.item.id != 3;
    if (isRidgeUpgrade) {
      const version = this.project.versions.find(x => x.active == true);
      const hasRidgeDeclined = version.buildings.some(x => x.psb_measure.psb_upgrades.some(y => y.id_upgrade == 2 && y.id_cost_integration == 3));

      if (hasRidgeDeclined) {
        const buildings = version.buildings.map(x => {
          let isNotVerified = null;
          const upgrades = x.psb_measure.psb_upgrades.map(y => {
            if (y.id_upgrade == 2) {
              isNotVerified = y.id_cost_integration == 3 && event.item.id != 3;
              return { ...y, id_cost_integration: event.item.id };
            } else {
              return { ...y };
            }
          });

          let verifieds = [...x.psb_measure.psb_verifieds];
          if (isNotVerified == true) {
            verifieds = x.psb_measure.psb_verifieds.map(z => {
              if (z.id_resource == 12) {
                return { ...z, is_verified: false };
              } else {
                return { ...z };
              }
            });
          }

          const measure = { ...x.psb_measure, psb_upgrades: upgrades, psb_verifieds: verifieds, isModified: true };
          return { ...x, psb_measure: measure, isModified: true };
        });

        const auxVersion = { ...version, buildings, is_verified: false, isModified: true };
        this.projectService.saveVersion(auxVersion);

        const alert = await this.alertController.create({
          message: 'You\'ll be redirect to Roof inspection, some selections are incomplete or should be verified.',
          buttons: [{
            text: 'OK', handler: () => {
              this.navController.navigateForward('home/prospecting/detail/' + parseInt(localStorage.getItem('idProject')));
            }
          }]
        });

        await alert.present();

        return;
      }
    }

    const psb_measure: PsbMeasures = {
      ...this.mainBuilding.psb_measure,
      psb_upgrades: buildingUpgrades
    };

    await this.projectService.savePsbMesaureMainBuilding(psb_measure);
  }

  validateRolePermission() {
    if (this.project) {
      this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project).
        then((result) => {
          this.userDisabledPermision = result;
        });
    }
  }
}
