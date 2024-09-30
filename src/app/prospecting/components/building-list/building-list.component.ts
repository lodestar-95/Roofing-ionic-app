import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BuildingComponent } from '../../modals/building/building.component';
import { DeleteComponent } from '../../modals/delete/delete.component';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { AlertController, ModalController, NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Version } from 'src/app/models/version.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { OverlayEventDetail } from '@ionic/core/components';
import { PvTrademarks } from 'src/app/models/pv_trademarks.model';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../login/services/auth/auth.service';
import { User } from '../../../models/user.model';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { v4 as uuidv4 } from 'uuid';
import { PsbUpgrade } from 'src/app/models/psb_upgrades.model';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';

@Component({
  selector: 'app-building-list',
  templateUrl: './building-list.component.html',
  styleUrls: ['./building-list.component.scss']
})
export class BuildingListComponent implements OnInit {
  @Output() showBuildingsEmited = new EventEmitter<any>();
  project: Project;
  version: Version;
  versionTypeAny: any;
  projectBuildings: Building[];
  trademarks = [];
  isModalOpen = false;
  dateTxt: string;
  validCheckbox: boolean = false;
  pricesUntilDate: any;
  user: User;
  storeSubs: Subscription;
  canModifyProposal = true;
  userDisabledPermision = false;
  alwaysAllowModification: boolean;

  constructor(
    private projectService: ProjectsService,
    private modalController: ModalController,
    private store: Store<AppState>,
    private auth: AuthService,
    private nav: NavController,
    private synprojects: SyncProjectsService,
    private catalogsService: CatalogsService,
    private rolesPermissionsService: RolesPermissionsService,
    private alertController: AlertController,
    private general: GeneralService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      this.canModifyProposal = this.project?.project_status?.id == 1 || this.project?.project_status?.id == 2;
      this.loadBuildings();
      this.validateRolePermission();
    });

    this.auth.getAuthUser().then(user => {
      this.user = user;
    });
    this.getAlwaysAllowModification();
  }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
  }

  ngOnInit() {
    this.loadBuildings();
    // this.trademarksList();
    this.PriceDateList();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }


  loadBuildings() {
    if (!this.project) {
      return;
    }
    this.version = this.project.versions.find(x => x.active);

    this.trademarksList();

    const version = this.project.versions.find(x => x.active);
    if (!version) {
      return;
    }

    this.versionTypeAny = JSON.parse(JSON.stringify(this.version));
    this.dateTxt = this.version.expected_acceptance_date
      ? this.formatDate(this.version.expected_acceptance_date)
      : this.formatDate(new Date());
    if (this.version && this.version.pv_trademarks) {
      this.version.pv_trademarks.forEach(e => {
        if (this.trademarks.length > 0)
          this.trademarks.find(i => i.id == e.id_trademarks).checked = e.selected;
      });
    }

    this.project.versions.forEach(projectVersion => {
      if (this.version.id && projectVersion.id == this.version.id) {
        this.projectBuildings = projectVersion.buildings.filter(
          building => building.deletedAt == null
        );
        this.projectBuildings = this.projectBuildings.map(x => {
          let _psb_verified_informations =
            x.psb_measure && x.psb_measure.psb_verifieds
              ? x.psb_measure.psb_verifieds.filter(
                x => x.id_resource >= 6 && x.id_resource <= 12 && x.is_verified
              )
              : [];
          let found = {};
          let out = _psb_verified_informations.filter(function (element) {
            return found.hasOwnProperty(element.id_resource)
              ? false
              : (found[element.id_resource] = true);
          });
          if (out.length == 7) {
            const psb_measure_updated = { ...x.psb_measure, isAllSegmentsVerified: true };
            return { ...x, psb_measure: psb_measure_updated };
          } else {
            const psb_measure_updated = {
              ...x.psb_measure,
              isAllSegmentsVerified: false
            };
            return { ...x, psb_measure: psb_measure_updated };
          }
        });
      }
    });
    this.versionTypeAny.buildings = JSON.parse(JSON.stringify(this.projectBuildings));
    if (this.version && this.version.is_verified != undefined) {
      this.validCheckbox = this.version.is_verified;
    }
  }

  isDisabledBrand() {
    const rolesForbiden = [1, 2];
    if (rolesForbiden.includes(parseInt(this.user?.role.id_role)) && this.project.id_user_saleman != this.user?.id) {
      return true;
    }

    return this.validCheckbox;
  }

  async openModalBuilding(building?: Building) {
    if (!building && this.projectBuildings.length >= 5) {
      const alert = await this.alertController.create({
        message: 'Building limit reached',
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    const modal = await this.modalController.create({
      component: BuildingComponent,
      cssClass: 'building',
      componentProps: {
        project: this.project,
        building: building ? building : null,
        descBuilding: !building ? 'Building ' + (this.projectBuildings.length + 1) : null,
        idProject: this.project.id,
        idProjectVersion: this.version.id
      }
    });
    await modal.present();
  }

  async openModalDelete(building: Building) {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete',
      componentProps: {
        building: building
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      this.deleteBuilding(building.id);
    }
  }

  deleteBuilding(idProjectBuilding: number) {
    const versions = this.project.versions.map(x => {
      if (this.version.id == x.id) {
        let projectBuildingsUpdated: Building[] = x.buildings.map(item => {
          let buildingUpdated: Building = { ...item };
          if (item.id === idProjectBuilding) {
            buildingUpdated = {
              ...buildingUpdated,
              deletedAt: new Date(),
              isModified: true
            };
          }
          return buildingUpdated;
        });

        return { ...x, buildings: projectBuildingsUpdated, isModified: true };
      } else {
        return { ...x };
      }
    });

    const projectUpdated = { ...this.project, versions: versions, isModified: true };

    this.projectService.update(this.project.id, projectUpdated);

    // setTimeout(() => {
    //   this.synprojects.syncOffline();
    // }, 500);
  }

  async makeMainBuilding(idProjectBuilding: number) {
    const upgrades = (await this.catalogsService.getUpgrades()).data.filter(x => x.is_active == true);
    const versions = this.project.versions.map(x => {
      if (this.version.id == x.id) {
        const mainUpgrades = x.buildings.find(y => y.is_main_building)?.psb_measure?.psb_upgrades ?? [];
        let projectBuildingsUpdated: Building[] = x.buildings.map(item => {
          let buildingUpdated: Building = { ...item, isModified: true };
          if (item.id === idProjectBuilding) {
            const buildUpgrades = buildingUpdated?.psb_measure?.psb_upgrades ?? [];

            const updatedUpgrades = upgrades.map(y => {
              let upgradeFound = buildUpgrades.find(z => z.id_upgrade == y.id);
              if (upgradeFound) {
                return upgradeFound;
              } else {
                const measureId = buildingUpdated?.psb_measure?.id ?? uuidv4();
                upgradeFound = mainUpgrades.find(z => z.id_upgrade == y.id);
                if (upgradeFound) {
                  return {
                    ...upgradeFound,
                    id: uuidv4(),
                    id_psb_measure: measureId
                  };
                } else {
                  return {
                    id: uuidv4(),
                    isModified: true,
                    id_upgrade: x.id,
                    id_project: this.project.id,
                    id_cost_integration: null,
                    id_psb_measure: measureId
                  };
                }
              }
            });

            let updateMeasure = null;
            const measureId = buildingUpdated.psb_measure ? buildingUpdated.psb_measure.id : uuidv4();
            if (buildingUpdated.psb_measure) {
              updateMeasure = {
                ...buildingUpdated.psb_measure,
                psb_upgrades: updatedUpgrades,
                id: measureId
              };
            } else {
              updateMeasure = {
                id: measureId,
                psb_upgrades: updatedUpgrades
              };
            }

            buildingUpdated = {
              ...buildingUpdated,
              is_main_building: true,
              psb_measure: updateMeasure
            };

          } else {
            buildingUpdated = {
              ...buildingUpdated,
              is_main_building: false
            };
          }
          return buildingUpdated;
        });

        return { ...x, buildings: projectBuildingsUpdated };
      } else {
        return { ...x };
      }
    });

    const projectUpdated = { ...this.project, versions: versions, isModified: true };

    this.projectService.update(this.project.id, projectUpdated);
  }

  showBuildings(option, building: Building) {
    if (building.job_material_type?.material.toLocaleLowerCase() == 'shingle') {
      this.showBuildingsEmited.emit({ option, building });
    } else {
    }
  }

  gotoGenerate() {
    this.nav.navigateForward(`/home/estimate`);
  }

  trademarksList() {
    this.catalogsService.getTrademarks().then(resp => {
      this.trademarks = [];
      resp.data
        .filter(e => e.is_shingle_trademark)
        .forEach(element => {
          let mark = {};
          let t: PvTrademarks;
          if (this.version?.pv_trademarks) {
            t = this.version.pv_trademarks.find(x => x.id_trademarks == element.id);
            if (t != undefined && t.id != undefined) {
              mark['idRow'] = t.id;
            }
          }

          console.log("test trademarks");
          

          mark['id'] = element.id;
          mark['color'] = element.color;
          mark['trademark'] = element.trademark;
          mark['checked'] = t?.selected ? t.selected : false;

          console.log(mark);
          
          this.trademarks.push(mark);
        });
    });
  }

  async selectCheckBox(id) {
    var auxarray = [];
    this.trademarks.forEach(e => {
      let aux = {};
      if (e.id == id) {
        e.checked = e.checked ? false : true;
        if (e.checked) {
          this.versionTypeAny.buildings.forEach(building => {
            building.psb_measure['isAllSegmentsVerified'] = false;
            building.psb_measure['isModified'] = true;
            if (building.psb_measure.psb_verifieds) {
              building.psb_measure.psb_verifieds.forEach(Verifieds => {
                if (Verifieds.id_resource == 12) {
                  Verifieds['is_verified'] = false;
                }
              });
            }
          });
        } else {
          this.versionTypeAny.buildings.forEach(building => {
            let auxPsbSelectedMaterials = [];
            if (building.psb_measure.psb_selected_materials) {
              building.psb_measure.psb_selected_materials.forEach(selectedmaterials => {
                if (selectedmaterials.id_trademark_shingle == id) {
                  auxPsbSelectedMaterials.push({
                    ...selectedmaterials,
                    isModified: true,
                    deletedAt: new Date()
                  });
                }
              });
              building.psb_measure.psb_selected_materials = building.psb_measure.psb_selected_materials
                .filter(x => x.id_trademark_shingle != id);
              building.psb_measure.psb_selected_materials =
                [
                  ...building.psb_measure.psb_selected_materials,
                  ...auxPsbSelectedMaterials
                ];
              building.psb_measure.isModified = true;
            }
          });
        }

        this.versionTypeAny['is_Verified'] = false;
      }

      if (e.idRow != undefined) {
        aux['id'] = e.idRow;
      }

      aux['id_version'] = this.version.id;
      aux['id_trademarks'] = e.id;
      aux['selected'] = e.checked;
      aux['isModified'] = true;

      auxarray.push(aux);
    });
    this.versionTypeAny.pv_trademarks = auxarray;
    this.versionTypeAny.shingle_lines = await this.getShingleLines(this.versionTypeAny);
    this.projectService.saveVersion(this.versionTypeAny);
  }

  async getShingleLines(versionTypeAny) {
    const materialTypes = (await this.catalogsService.getMeasuresMaterialTypes()).data;

    return versionTypeAny.shingle_lines.map(x => {
      const materialType = materialTypes.find(y => y.id == x.id_material_type);
      const shingleLine = versionTypeAny.pv_trademarks.find(z => z.id_trademarks == materialType.id_trademark);
      if (shingleLine.selected) {
        return { ...x };
      } else {
        return { ...x, is_selected: false, isModified: true };
      }
    });
  }

  onVerifiedCheked() {
    
    if (this.validCheckbox) {
      this.version = { ...this.version, is_verified: false, isModified: true};
      this.projectService.saveVersion(this.version);
    } else {
      const validTradeMarks = this.trademarks.find(e => e.checked) ? true : false;
      const validateAllBuildingsVerified = this.validBuildings();
      const hasMainBuilding = this.projectBuildings.some(x => x.is_main_building && x.deletedAt == null);

      if (validateAllBuildingsVerified && validTradeMarks && hasMainBuilding) {
        this.validCheckbox = this.validCheckbox ? false : true;
        if (this.validCheckbox) {
          this.version = this.validateGeneralUpgrades();
        }
        this.version = {
          ...this.version,
          is_verified: this.validCheckbox,
          isModified: true
        };
        this.projectService.saveVersion(this.version);
      }
    }
  }

  validateGeneralUpgrades(): Version {
    const building = this.version.buildings.find(x => x.is_main_building);
    const upgrades = building.psb_measure.psb_upgrades;

    const upgradesUpdated = [];
    for (const upgrade of upgrades) {
      const costIntegration = this.getCostIntegration(upgrade, building);
      const upgradeAux = {
        ...upgrade,
        id_cost_integration: costIntegration
      };

      upgradesUpdated.push(upgradeAux);
    }

    const measureUpdate = {
      ...building.psb_measure,
      psb_upgrades: upgradesUpdated
    };

    const buildingUpdated = {
      ...building,
      psb_measure: measureUpdate
    };

    const buildingsUpdated = this.version.buildings.map(x => {
      if (x.id == buildingUpdated.id) {
        return buildingUpdated;
      } else {
        return x;
      }
    });

    return {
      ...this.version,
      buildings: buildingsUpdated
    };
  }

  getCostIntegration(upgrade: PsbUpgrade, building: Building): number {
    const option = building.psb_measure.id_project_warranty_option;
    switch (upgrade.id_upgrade) {
      case 3://Wind Warranty
        return building.psb_measure.id_cost_int_windw;
        break;
      case 5://Material Extended Warranty
        return option == 2 || option == 7 ? 1 : option == 3 || option == 6 ? 2 : 3;
      case 6://Workmanship Manufacturer Warranty
        return option == 4 ? 1 : option == 5 || option == 6 || option == 7 ? 2 : 3;
      default:
        return upgrade.id_cost_integration;
    }
  }

  validBuildings() {
    let CountBuildingsVerified = 0;
    this.projectBuildings.forEach(element => {
      if (element.psb_measure.isAllSegmentsVerified) {
        CountBuildingsVerified++;
      }
    });
    return CountBuildingsVerified == this.projectBuildings.length ? true : false;
  }

  PriceDateList() {
    this.catalogsService.getPriceList().then(resp => {
      let dateList = resp.data.filter(e => {
        e.start_date = new Date(e.start_date);
        return e.start_date >= new Date();
      });
      const auxDate = new Date(Date.now());
      auxDate.setDate(auxDate.getDate() + 30);
      const minDate = !dateList || dateList.length == 0 ? auxDate : new Date(Math.min(...dateList.map(e => e.start_date.getTime())));
      let day =
        minDate.getUTCDate() < 10 ? `0${minDate.getUTCDate()}` : minDate.getUTCDate();
      let month =
        minDate.getUTCMonth() + 1 < 10
          ? `0${minDate.getUTCMonth() + 1}`
          : minDate.getUTCMonth() + 1;
      this.pricesUntilDate = `${month}/${day}/${minDate.getUTCFullYear()}`;
    });
  }

  formatDate(date) {
    const month = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'Octuber',
      'November',
      'December'
    ];
    const day = [
      '',
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
      '10th',
      '11th',
      '12th',
      '13th',
      '14th',
      '15th',
      '16th',
      '17th',
      '18th',
      '19th',
      '20th',
      '21st',
      '22nd',
      '23rd',
      '24th',
      '25th',
      '26th',
      '27th',
      '28th',
      '29th',
      '30th',
      '31st'
    ];
    var newDate = `${month[new Date(date).getMonth()]} ${day[new Date(date).getDate()]
      } ${new Date(date).getFullYear()}`;
    return newDate;
  }

  validateRolePermission() {
    if (this.project) {
      this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project).
        then((result) => {
          this.userDisabledPermision = result;
        });
    }
  }

  /**
   * Modal Date Functions
   */
  openModalDatetime(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
  mdlResponsePayload(payload: any) {
    this.isModalOpen = payload.isDatePopUpOpen;
    if (payload.wasSelectedDate) {
      var date = new Date(payload.dateSelected);
      this.version = { ...this.version, expected_acceptance_date: date };
      this.dateTxt = this.formatDate(date);
      this.projectService.saveVersion(this.version);
    }
  }
}
