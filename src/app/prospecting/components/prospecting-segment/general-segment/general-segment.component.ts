import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { IonInput, ToastController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { v4 as uuidv4 } from 'uuid';

import { AppState } from 'src/app/app.reducer';
import { CostIntegration } from 'src/app/models/cost-integration.model';
import { InwshieldRow } from 'src/app/models/in-wshield-row.model';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { WarrantyOption } from 'src/app/models/warranty-option.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { Subscription } from 'rxjs';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';
import { Version } from 'src/app/models/version.model';

@Component({
  selector: 'app-general-segment',
  templateUrl: './general-segment.component.html',
  styleUrls: ['./general-segment.component.scss']
})
/**
 * @author: Carlos Rodríguez
 */
export class GeneralSegmentComponent implements OnInit, OnDestroy {
  @Output() changeSegmentEmmited = new EventEmitter<string>();
  @ViewChild('emailInput', { static: false }) emailInput!: IonInput;
  project: Project;
  building: Building;
  version: Version;
  buildings: Building[];
  isOverlay: boolean;

  warranties: WarrantyOption[];
  inwshieldRows: InwshieldRow[];
  costIntegrations: CostIntegration[];

  warrantyOption: WarrantyOption;
  inwshieldRow: InwshieldRow;
  costIntegration: CostIntegration;
  wasting: number;

  storeSubs: Subscription;
  isFormValid = false;
  userDisabledPermision = false;
  verifiedActive: boolean;
  buildingVerified = false;
  firstInit = true;
  validJobTypeForInW = true;
  windWarrantyDeclinedId: number;
  jobTypesTearoffId: number;
  inwshieldDeclinedId: number;

  constructor(
    private catalogsService: CatalogsService,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private toastController: ToastController,
    private synProjects: SyncProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private general: GeneralService
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;

      this.version = this.project.versions.find(x => x.active);
      if (!this.project || this.project?.versions?.length == 0) {
        return;
      }

      const { buildings } = this.project.versions.find(x => x.active);
      this.buildings = buildings;
      this.buildingVerified = this.project.versions.find((x) => x.active).is_verified;
      this.building = buildings.find(x => x.active);
      if (!this.building) {
        return;
      }
      this.isValidJobForInW();
      this.getJobTypesTearoffId();
      this.getInwshieldDeclinedId();
      if (this.building.psb_measure) {
        this.verifiedActive = this.findResource(6);
      }

      this.projectService.isActive = this.verifiedActive;

      this.getWarrantyOptions();
      this.getInwshieldRows();
      this.getCostIntegrations();
      this.getWasting();
      this.validateRolePermission();
      this.getCostIntegrationDeclinedId();
    });
    window.addEventListener('keyboardDidShow', () => {
      document.activeElement.scrollIntoView(true);
    });
  }
  async getInwshieldDeclinedId() {
    this.inwshieldDeclinedId = await this.general.getConstDecimalValue('inwshield_declined');
  }

  async getJobTypesTearoffId() {
    this.jobTypesTearoffId = await this.general.getConstDecimalValue('job_types_tear_off');
  }

  async getCostIntegrationDeclinedId() {
    this.windWarrantyDeclinedId = await this.general.getConstDecimalValue('cost_integration_declined');
  }

  async isValidJobForInW() {
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');

    this.validJobTypeForInW = this.building.id_job_type != job_types_overlay;
    this.isOverlay = !this.validJobTypeForInW;
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() { }

  getWasting() {
    this.wasting = this.building?.psb_measure?.wasting
      ? this.building.psb_measure.wasting
      : undefined;
  }

  /**
   * Get warranties catalog
   */
  getWarrantyOptions() {
    this.catalogsService.getWarrantiesOptions().then(result => {
      this.warranties = result.data;

      if (this.building.psb_measure) {
        const idProjectWarrantyOption =
          this.building.psb_measure.id_project_warranty_option;

        this.warranties.map(x => {
          if (x.id == idProjectWarrantyOption) {
            x.isChecked = true;
            this.warrantyOption = { ...x };
          }
        });
      }
    });
  }

  /**
   * Get inwshield rows catalog
   */
  async getInwshieldRows() {
    try {
        const result = await this.catalogsService.getInwshieldRows();
        const isNewConstruction = await this.isNewConstruction();
        const isTearoff = await this.isTearoffAndInstall();
        
        if (isTearoff) {
          this.inwshieldRows = result.data.filter(inwshieldRow => inwshieldRow.id != this.inwshieldDeclinedId);
        } else {
          const isTearOffOnly = await this.isTearoffOnly();
          if (isTearOffOnly) {
            this.inwshieldRows = result.data.filter(inwshieldRow => inwshieldRow.id != this.inwshieldDeclinedId);
          } else {
            this.inwshieldRows = result.data;
          }
        }
    
        console.log('>>>>inw');
        console.log(this.inwshieldRows);
    
        if (this.building.psb_measure) {
          const idInwshieldRowsSelected = this.building.psb_measure.id_inwshield_rows;
          console.log('idInwshieldRowsSelected', idInwshieldRowsSelected);
    
          this.inwshieldRows.forEach(x => {
            if (x.id == idInwshieldRowsSelected) {
              x.isChecked = true;
              this.inwshieldRow = x;
            }
            if (isNewConstruction && x.id == 3) {
              x.sub_title = 'Upgrades using 3 feet on eaves and valleys and using 6 feet on eaves and 3 feets on valleys will be added in proposal.';
            }
          });
        }
      } catch (error) {
        console.error('Error getting inwshield rows:', error);
      }
    /*
    this.catalogsService.getInwshieldRows().then(result => {
      this.isNewConstruction().then(isNewConstruction => {
        this.isTearoffAndInstall().then(isTearoff => {
          if (isTearoff) {
            this.inwshieldRows = result.data.filter(inwshieldRow => inwshieldRow.id != this.inwshieldDeclinedId);
          } else {
            this.isTearoffOnly().then(isTearOffOnly => {
              if (isTearOffOnly) {
                this.inwshieldRows = result.data.filter(inwshieldRow => inwshieldRow.id != this.inwshieldDeclinedId);
              } else {
                this.inwshieldRows = result.data;
              }
            });
          }
          console.log('>>>>inw');
          console.log(this.inwshieldRows);
          if (this.building.psb_measure) {
              const idInwshieldRowsSelected = this.building.psb_measure.id_inwshield_rows;
              console.log('idInwshieldRowsSelected', idInwshieldRowsSelected);

            this.inwshieldRows.map(x => {
              if (x.id == idInwshieldRowsSelected) {
                x.isChecked = true;
                this.inwshieldRow = x;
              }
              if (isNewConstruction && x.id == 3) {
                x.sub_title = 'Upgrades using 3 feet on eaves and valleys and using 6 feet on eaves and 3 feets on valleys will be added in proposal.';
              }
            });
          }
        });
      });
    });*/
  }

  async isNewConstruction() {
    const job_types_new_construction = await this.general.getConstDecimalValue('job_types_new_construction');
    return this.building.id_job_type == job_types_new_construction;
  }

  async isTearoffAndInstall() {
    const jobTypesTearoffId = await this.general.getConstDecimalValue('job_types_tear_off');
    return this.building.id_job_type == jobTypesTearoffId;
  }

  async isTearoffOnly() {
    const jobTypesTearoffOnlyId = await this.general.getConstDecimalValue('job_types_tear_off_only');
    return this.building.id_job_type == jobTypesTearoffOnlyId;
  }
  /**
   * Get inwshield rows catalog
   */
  getCostIntegrations() {
    this.catalogsService.getCostIntegrations().then(result => {
      this.costIntegrations = result.data;

      if (this.building.psb_measure) {
        const idCostIntegrationWindWarrantySelected =
          this.building.psb_measure.id_cost_int_windw;

        this.costIntegrations.map(x => {
          if (x.id == idCostIntegrationWindWarrantySelected) {
            x.isChecked = true;
            this.costIntegration = x;
          }
        });
      }
    });
  }

  /**
   * Save shingle WarrantyOption
   * @param warrantyOption
   */
  onOptionSelectedWarranties(warrantyOption: any) {
    this.warrantyOption = warrantyOption;
    this.isFormValid = false;

    const shingle: PsbMeasures = {
      ...this.building.psb_measure,
      id_project_warranty_option: this.warrantyOption.id
    };

    if (!shingle?.id) {
      shingle.id = uuidv4();
    }

    this.projectService.saveProjectShingleBuilding(shingle);
  }

  /**
   * Save shingle InwshieldRow
   * @param inwshieldRow
   */
  onOptionSelectedInwshieldRows(inwshieldRow: any) {
    this.inwshieldRow = inwshieldRow;
    this.isFormValid = false;

    const shingle: PsbMeasures = {
      ...this.building.psb_measure,
      // inwshield_rows: { ...this.inwshieldRow },
      id_inwshield_rows: this.inwshieldRow.id
    };

    if (inwshieldRow.id == 3) {
      shingle.psb_selected_materials = shingle.psb_selected_materials?.map(x => {
        if (x.id_material_category == 30) {
          return { ...x, deletedAt: new Date() };
        } else {
          return x;
        }
      });
    }

    if (inwshieldRow.id == 4) {
      shingle.psb_selected_materials = shingle.psb_selected_materials?.map(x => {
        if (x.id_material_category == 34) {
          return { ...x, deletedAt: new Date() };
        } else {
          return x;
        }
      });
    }

    if (inwshieldRow.id != 3 && this.findResource(12) && !this.selectionInWOk()) {
      shingle.psb_verifieds = shingle.psb_verifieds.map(x => {
        if (x.id_resource == 12) {
          return { ...x, is_verified: false };
        } else {
          return x;
        }
      });
    }

    if (inwshieldRow.id != 4 && this.findResource(12) && !this.selectionUnderlaymentOk()) {
      shingle.psb_verifieds = shingle.psb_verifieds.map(x => {
        if (x.id_resource == 12) {
          return { ...x, is_verified: false };
        } else {
          return x;
        }
      });
    }

    this.projectService.saveProjectShingleBuilding(shingle);
  }

  selectionInWOk() {
    if (!this.project.versions.find(x => x.active)?.pv_trademarks) {
      return true;
    }

    const trademarksSelected = this.project.versions.find(x => x.active)?.pv_trademarks?.filter(
      (x) => x.selected == true
    );

    if (!this.building.psb_measure.psb_selected_materials) {
      return true;
    }
    let selectionComplete = trademarksSelected?.length > 0;
    trademarksSelected.forEach((element) => {
      const materials = this.building.psb_measure.psb_selected_materials?.filter(
        (x) => x.id_trademark_shingle == element.id_trademarks
      );

      const materialCount = materials.filter(x => !x.deletedAt && x.id_material_category !== 15).length;
      if (
        materialCount == 3 ||
        (this.isRidgeVentsDeclined() && materialCount == 2)
      ) {
        selectionComplete = selectionComplete && true;
      } else {
        selectionComplete = false;
      }
    });

    return selectionComplete;
  }

  selectionUnderlaymentOk() {
    if (!this.project.versions.find(x => x.active)?.pv_trademarks) {
      return true;
    }

    const trademarksSelected = this.project.versions.find(x => x.active)?.pv_trademarks?.filter(
      (x) => x.selected == true
    );

    if (!this.building.psb_measure.psb_selected_materials) {
      return true;
    }
    let selectionComplete = trademarksSelected?.length > 0;
    trademarksSelected.forEach((element) => {
      const materials = this.building.psb_measure.psb_selected_materials?.filter(
        (x) => x.id_trademark_shingle == element.id_trademarks
      );

      const materialCount = materials.filter(x => !x.deletedAt && x.id_material_category !== 15).length;
      if (
        materialCount == 3 ||
        (this.isRidgeVentsDeclined() && materialCount == 2)
      ) {
        selectionComplete = selectionComplete && true;
      } else {
        selectionComplete = false;
      }
    });

    return selectionComplete;
  }

  isRidgeVentsDeclined(): boolean {
    if (!this.building.psb_measure?.psb_upgrades) {
      return false
    }

    return (
      this.building.psb_measure.psb_upgrades.find((x) => x.id_upgrade == 2)
        .id_cost_integration == 3
    );
  }

  /**
   * Save shingle CostIntegration
   * @param costIntegration
   */
  onOptionSelectedCostIntegrations(costIntegration: any) {
    this.costIntegration = costIntegration;
    this.isFormValid = false;

    const shingle: PsbMeasures = {
      ...this.building.psb_measure,
      id_cost_int_windw: this.costIntegration.id
    };

    this.projectService.saveProjectShingleBuilding(shingle);
  }

  /**
   * Save shingle wasting
   */
  onWastingChanged() {
    // this.emailInput.setFocus();
    if (this.wasting > 50) {
      this.wasting = 50;
    } else if (this.wasting < 0) {
      this.wasting = 0;
    }

    const shingle: PsbMeasures = {
      ...this.building.psb_measure,
      wasting: this.wasting
    };
    if (this.firstInit) {
      this.firstInit = false;
    } else {
      this.projectService.saveProjectShingleBuilding(shingle);
    }
  }

  /**
   * Present message inside the screen.
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

  /**
   * Verified information before save data
   * @returns
   */

  createnowDateString() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString();
    const day = currentDate.getDate().toString();
    const dateString = '-' + day + '/' + month + '/' + year;
    return dateString;
  }

  checkwithDate(project_name: string) {
    const datePattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const endsWithDate = datePattern.test(project_name);
    return endsWithDate;
  }


  async confirm(event) {
    
    let update_date;
    
    if (this.checkwithDate(this.version.project_version)) {
      update_date = this.version.project_version;

    } else {
      update_date = this.version.project_version + this.createnowDateString();
    }

    if (event) {
      const psb_verifieds = this.projectService.getShingleVerifiedInformation(
        6,
        !this.verifiedActive
      );

      const shingle: PsbMeasures = {
        ...this.building.psb_measure,
        verified_general: !this.verifiedActive,
        psb_verifieds
      };
      this.projectService.saveVersion({ ...this.version, project_version: update_date });
      this.projectService.saveProjectShingleBuilding(shingle);
      setTimeout(() => {
        if (!event) {
          this.synProjects.syncOffline();
          this.changeSegmentEmmited.emit('roof-slopes');
        }
      }, 500);
    } else {

      console.log("this.verifiedActive", this.verifiedActive);
      
      if (!this.validJobTypeForInW) {
        this.costIntegration = this.costIntegrations.filter(x => x.id === this.windWarrantyDeclinedId)[0];
        this.costIntegration.isChecked = true;
      }
      if (!this.warrantyOption) {
        this.presentToast('warrantyOption not found!');
        return;
      } else if (!this.costIntegration) {
        this.presentToast('Cost integration not found!');
        return;
      } else if (!this.wasting) {
        this.presentToast('Wasting not found!');
        return;
      } else if (this.validJobTypeForInW && !this.inwshieldRow) {
        this.presentToast('Inwshield row not found!');
        return;
      } else {
        const psb_verifieds = this.projectService.getShingleVerifiedInformation(
          6,
          !this.verifiedActive
        );

        const shingle: PsbMeasures = {
          ...this.building.psb_measure,
          verified_general: true,
          psb_verifieds
        };
        
        await this.projectService.saveProjectShingleBuilding(shingle);

        setTimeout(() => {
          if (!event) {
            this.synProjects.syncOffline();
            this.changeSegmentEmmited.emit('roof-slopes');
            this.projectService.saveVersion({ ...this.version, project_version: update_date });
          }
        }, 1000);
      }
    }
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

  findResource(idResource: number) {
    if (!this.building.psb_measure.psb_verifieds) {
      return false;
    }

    const verifiedInformation = this.building.psb_measure.psb_verifieds.find(
      x => x.id_resource == idResource
    );
    return verifiedInformation ? verifiedInformation.is_verified : false;
  }
}
