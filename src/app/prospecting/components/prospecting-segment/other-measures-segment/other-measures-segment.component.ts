import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { PsbVerified } from 'src/app/models/psb_verified.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { RidgeCapComponent } from '../../../modals/ridge-cap/ridge-cap.component';
import { v4 as uuidv4 } from 'uuid';
import { FlatRoofComponent } from '../../../modals/flat-roof/flat-roof.component';
import { MiscellaneusComponent } from '../../../modals/miscellaneus/miscellaneus.component';
import { SteepSlopeComponent } from '../../../modals/steep-slope/steep-slope.component';
import { OtherMeasuresList } from '../../other-measures/other-measures.component';
import { VentingComponent } from 'src/app/prospecting/modals/venting/venting.component';
import { LowSlopeComponent } from 'src/app/prospecting/modals/low-slope/low-slope.component';
import { FlashingsComponent } from 'src/app/prospecting/modals/flashings/flashings.component';
import { DMetalComponent } from 'src/app/prospecting/modals/d-metal/d-metal.component';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { MeasuresMaterialType } from 'src/app/models/measures-material-types.model';
import { OutOfTownExpensesComponent } from 'src/app/prospecting/modals/out-of-town-expenses/out-of-town-expenses.component';
import { ConfigsGeneralService } from 'src/app/services/configs-general.service';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { Subscription } from 'rxjs';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

@Component({
  selector: 'app-other-measures-segment',
  templateUrl: './other-measures-segment.component.html',
  styleUrls: ['./other-measures-segment.component.scss']
})
export class OtherMeasuresSegmentComponent implements OnInit, OnDestroy {
  @Output() changeSegmentEmmited = new EventEmitter<string>();

  project: Project;
  buildings: Building[];
  building: Building;
  projectShingleBuilding: PsbMeasures;
  psbVerifieds: PsbVerified[];

  ridgeCapList: OtherMeasuresList[];
  flatRoofList: OtherMeasuresList[];
  lowSlopeList: OtherMeasuresList[];
  flashingsList: OtherMeasuresList[];
  miscellaneusList: OtherMeasuresList[];
  stepSlopeList: OtherMeasuresList[];
  ventingList: OtherMeasuresList[];
  dMetalList: OtherMeasuresList[];
  outOfTownExpensesList: OtherMeasuresList[];

  ridgeCapActive: boolean;
  flatRoofActive: boolean;
  lowSlopeActive: boolean;
  steepSlopeActive: boolean;
  dMetalActive: boolean;
  flashingsActive: boolean;
  ventingActive: boolean;
  miscellaneusActive: boolean;
  outOfTownExpensesActive: boolean;
  otherMeasuresActive: boolean;
  showIconError: boolean;
  isOverlay = false;

  validPitchAngleLowSlope: boolean;
  validPitchAngleSteepSlope: boolean;
  validPitchAngleFlatRoof: boolean;

  validEvesRakesInFlatRoof: boolean;
  validEvesStartersInLowOrSteepSlope: boolean;
  validRakesInLowOrSteepSlope: boolean;

  measuresMaterialsType: MeasuresMaterialType[];
  hotelId: number;
  airBnBId: number;
  userDisabledPermision = false;
  storeSubs: Subscription;
  buildingVerified = false;

  constructor(
    private toastController: ToastController,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private modalController: ModalController,
    private catalogsService: CatalogsService,
    private configService: ConfigsGeneralService,
    private synProjects: SyncProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private general: GeneralService,
  ) {

    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;

      if (!this.project) {
        return;
      }
      this.loadProjectShingleBuilding();
      this.validateRolePermission();
    });
  }

  ngOnInit() {
    this.configService.getConfigByKey('hotel_id').then(config => {
      this.hotelId = parseInt(config.value);
    });
    this.configService.getConfigByKey('airBnB_id').then(config => {
      this.airBnBId = parseInt(config.value);
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  loadProjectShingleBuilding() {
    const { buildings } = this.project.versions.find(x => x.active);

    this.buildings = buildings;
    this.building = buildings.find(x => x.active);
    this.buildingVerified = this.project.versions.find((x) => x.active).is_verified;

    if (this.building) {
      this.projectShingleBuilding = {
        ...this.building.psb_measure
      };

      this.validPitchAngleLowSlope = this.validatePitchAngleRange(2, 3.9);
      this.validPitchAngleSteepSlope = this.validatePitchAngleRange(4, 24);
      this.validPitchAngleFlatRoof = this.validatePitchAngleRange(0, 1.9);

      this.psbVerifieds = this.projectShingleBuilding.psb_verifieds
        ? [...this.projectShingleBuilding.psb_verifieds]
        : [];

      this.validDMetal();

      this.ridgeCapActive = this.findModal(13); //ridge cap
      this.flatRoofActive = this.findModal(14);
      this.lowSlopeActive = this.findModal(15);
      this.steepSlopeActive = this.findModal(16);
      this.dMetalActive = this.findModal(17);
      this.flashingsActive = this.findModal(18);
      this.ventingActive = this.findModal(19);
      this.miscellaneusActive = this.findModal(20);
      this.outOfTownExpensesActive = this.findModal(21);
      this.otherMeasuresActive = this.findModal(9);

      this.getRidgeCapList();
      this.getFlatRoofList();
      this.getLowSlopeList();
      this.getFlashingsList();
      this.getMiscellaneusList();
      this.getStepSlopeList();
      this.getVentingList();
      this.getOutOfTownExpenses();

      if (!this.measuresMaterialsType) {
        this.catalogsService.getMeasuresMaterialTypes().then(result => {
          this.measuresMaterialsType = [...result.data];
          this.getDMetalList();
        });
      } else {
        this.getDMetalList();
      }
      this.validateChanges();
    }
  }

  validDMetal() {
    this.isOverlay = this.building.id_job_type == 14;
    this.validEvesRakesInFlatRoof = //this.isOverlay ||
      (this.building.psb_measure.eves_rakes_lf_flat_roof && this.validPitchAngleFlatRoof)
        ? true
        : false;
    this.validEvesStartersInLowOrSteepSlope = //this.isOverlay ||
      ((this.building.psb_measure.eves_starters_lf_low_slope &&
        this.validPitchAngleLowSlope) ||
        (this.building.psb_measure.eves_starters_lf_steep_slope &&
          this.validPitchAngleSteepSlope))
        ? true
        : false;
    this.validRakesInLowOrSteepSlope = //this.isOverlay ||
      ((this.building.psb_measure.rakes_lf_low_steep_slope &&
        this.validPitchAngleLowSlope) ||
        (this.building.psb_measure.rakes_lf_steep_slope && this.validPitchAngleSteepSlope))
        ? true
        : false;
  }

  validatePitchAngleRange(startValue: number, endValue: number) {
    let valid = false;
    this.building.psb_measure.psb_slopes.forEach(element => {
      if (
        element.pitch >= startValue &&
        element.pitch <= endValue &&
        element.deletedAt == null
      ) {
        valid = true;
      }
    });
    return valid;
  }

  findModal(idResource: number) {
    const verifiedInformation = this.psbVerifieds.find(x => x.id_resource == idResource);
    return verifiedInformation ? verifiedInformation.is_verified : false;
  }

  getRidgeCapList() {
    this.ridgeCapList = [];
    this.ridgeCapList.push(
      {
        description: 'Ridges (Roof peak)',
        value: `${this.building.psb_measure.ridge_lf} LF`,
        visible: this.building.psb_measure.ridge_lf ? true : false
      },
      {
        description: 'Hips',
        value: `${this.building.psb_measure.hips_lf} LF`,
        visible: this.building.psb_measure.hips_lf ? true : false
      }
    );
  }

  /**
   * @author: Carlos Rodríguez
   */
  getVentingList() {
    if (!this.building) {
      return;
    }
    this.ventingList = [];
    this.ventingList.push(
      {
        description: 'Existing Metal Attic Vents',
        value: `${this.building.psb_measure.vent_metal_artict} PC`,
        visible: this.building.psb_measure.vent_metal_artict ? true : false
      },
      {
        description: 'Metal Attic Vents to remove and cover',
        value: `${this.building.psb_measure.vent_metal_artict_remove_pc} PC`,
        visible: this.building.psb_measure.vent_metal_artict_remove_pc ? true : false
      },
      {
        description: 'Metal Attic Vents to keep',
        value: `${this.building.psb_measure.vent_metal_artict - this.building.psb_measure.vent_metal_artict_remove_pc} PC`,
        visible: this.building.psb_measure.vent_metal_artict - this.building.psb_measure.vent_metal_artict_remove_pc > 0? true : false
      },
      {
        description: 'Metal Attic Vents to add',
        value: `${this.building.psb_measure.vent_metal_artict_replace_pc} PC`,
        visible: this.building.psb_measure.vent_metal_artict_replace_pc ? true : false
      },
      
      
      {
        description: 'Existing J Vent 4”',
        value: `${this.building.psb_measure.vent_j_vent_4_pc} PC`,
        visible: this.building.psb_measure.vent_j_vent_4_pc ? true : false
      },
      {
        description: 'J Vent 4” to remove and cover',
        value: `${this.building.psb_measure.vent_j_vent_4_pc_remove} PC`,
        visible: this.building.psb_measure.vent_j_vent_4_pc_remove ? true : false
      },
      {
        description: 'J Vent 4” to keep',
        value: `${this.building.psb_measure.vent_j_vent_4_pc - this.building.psb_measure.vent_j_vent_4_pc_remove} PC`,
        visible: this.building.psb_measure.vent_j_vent_4_pc - this.building.psb_measure.vent_j_vent_4_pc_remove? true : false
      },
      {
        description: 'J Vent 4” to add',
        value: `${this.building.psb_measure.vent_j_vent_4_pc_add} PC`,
        visible: this.building.psb_measure.vent_j_vent_4_pc_add ? true : false
      },
      {
        description: 'J Vent 6”',
        value: `${this.building.psb_measure.vent_j_vent_6_pc} PC`,
        visible: this.building.psb_measure.vent_j_vent_6_pc ? true : false
      },
      {
        description: 'J Vent 6” to remove and cover',
        value: `${this.building.psb_measure.vent_j_vent_6_pc_remove} PC`,
        visible: this.building.psb_measure.vent_j_vent_6_pc_remove ? true : false
      },
      {
        description: 'J Vent 6” to keep',
        value: `${this.building.psb_measure.vent_j_vent_6_pc - this.building.psb_measure.vent_j_vent_6_pc_remove} PC`,
        visible: this.building.psb_measure.vent_j_vent_6_pc - this.building.psb_measure.vent_j_vent_6_pc_remove? true : false
      },
      {
        description: 'J Vent 6” to add',
        value: `${this.building.psb_measure.vent_j_vent_6_pc_add} PC`,
        visible: this.building.psb_measure.vent_j_vent_6_pc_add ? true : false
      },

      {
        description: 'Existing 4" LV with extensions',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensions} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensions ? true : false
      },

      {
        description: '4" LV with extensions to remove and cover',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsRemove } PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsRemove  ? true : false
      },
      {
        description: '4" LV with extensions to keep',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensions - this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsRemove} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensions - this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsRemove? true : false
      },
      {
        description: '4" LV with extensions to add',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsAdd} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsAdd ? true : false
      },


      {
        description: 'Existing 6" LV with extensions',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensions} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensions ? true : false
      },

      {
        description: '6" LV with extensions to remove and cover',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsRemove } PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsRemove  ? true : false
      },
      {
        description: '6" LV with extensions to keep',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensions - this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsRemove} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensions - this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsRemove? true : false
      },
      {
        description: '6" LV with extensions to add',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsAdd} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsAdd ? true : false
      },

      {
        description: '4" LV without with extensions',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensions} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensions ? true : false
      },
      {
        description: '4" LV without to remove and cover',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsRemove} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsRemove ? true : false
      },
      {
        description: '4" LV without to keep',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensions - this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsRemove} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensions - this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsRemove? true : false
      },
      {
        description: '4" LV without to add',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsAdd} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsAdd ? true : false
      },

      {
        description: '6" LV without extensions',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensions} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensions ? true : false
      },
      {
        description: '6" LV without to remove and cover',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsRemove} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsRemove ? true : false
      },
      {
        description: '6" LV without to keep',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensions - this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsRemove} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensions - this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsRemove? true : false
      },
      {
        description: '6" LV without to add',
        value: `${this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsAdd} PC`,
        visible: this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsAdd ? true : false
      },

      {
        description: 'Ridge Vent to in place',
        value: `${this.building.psb_measure.vent_ridgevent_lf} LF`,
        visible: this.building.psb_measure.vent_is_ridgevent_in_place && !this.building.psb_measure.vent_is_ridgevent_be_replace && this.building.psb_measure.vent_ridgevent_lf? true : false
      },
      {
        description: 'Ridge Vent to add',
        value: `${this.building.psb_measure.vent_ridgevent_lf} LF`,
        visible: this.building.psb_measure.vent_is_ridgevent_add && this.building.psb_measure.vent_ridgevent_lf? true : false
      },

      {
        description: 'Ridge Vent to be replace',
        value: `${this.building.psb_measure.vent_ridgevent_lf} LF`,
        visible: this.building.psb_measure.vent_is_ridgevent_be_replace && this.building.psb_measure.vent_ridgevent_lf? true : false
      },

      {
        description: 'Existing 4" x 16" SV',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent416} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent416 ? true : false
      },
      {
        description: '4" x 16" SV to remove and cover',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent416Remove} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent416Remove ? true : false
      },

      {
        description: '4" x 16" SV to keep',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent416 - this.building.psb_measure.psb_soffitvents.soffitVent416Remove} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent416 -this.building.psb_measure.psb_soffitvents.soffitVent416Remove ? true : false
      },
      {
        description: '4" x 16" SV to add',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent416Add} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent416Add ? true : false
      },
      {
        description: 'Existing 6" x 16" SV',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent616} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent616 ? true : false
      },
      {
        description: '6" x 16" SV to remove and cover',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent616Remove} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent616Remove ? true : false
      },

      {
        description: '6" x 16" SV to keep',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent616 - this.building.psb_measure.psb_soffitvents.soffitVent616Remove} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent616 -this.building.psb_measure.psb_soffitvents.soffitVent616Remove ? true : false
      },
      {
        description: '6" x 16" SV to add',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent616Add} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent616Add ? true : false
      },
      {
        description: 'Existing 2" SV',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent2} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent2 ? true : false
      },
      {
        description: '2" SV to remove and cover',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent2Remove} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent2Remove ? true : false
      },
      {
        description: '2" SV to keep',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent2 - this.building.psb_measure.psb_soffitvents.soffitVent2Remove } PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent2 - this.building.psb_measure.psb_soffitvents.soffitVent2Remove ? true : false
      },
      {
        description: '2" SV to add',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent2Add} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent2Add ? true : false
      },
      {
        description: 'Existing 3" SV',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent3} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent3 ? true : false
      },
      {
        description: '3" SV to remove and cover',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent3Remove} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent3Remove ? true : false
      },
      {
        description: '3" SV to keep',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent3 - this.building.psb_measure.psb_soffitvents.soffitVent3Remove } PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent3 - this.building.psb_measure.psb_soffitvents.soffitVent3Remove ? true : false
      },
      {
        description: '3" SV to add',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent3Add} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent3Add ? true : false
      },
      {
        description: 'Existing 4" SV',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent4} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent4 ? true : false
      },
      {
        description: '4" SV to remove and cover',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent4Remove} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent4Remove ? true : false
      },
      {
        description: '4" SV to keep',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent4 - this.building.psb_measure.psb_soffitvents.soffitVent4Remove } PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent4 - this.building.psb_measure.psb_soffitvents.soffitVent4Remove ? true : false
      },
      {
        description: '4" SV to add',
        value: `${this.building.psb_measure.psb_soffitvents.soffitVent4Add} PC`,
        visible: this.building.psb_measure.psb_soffitvents.soffitVent4Add ? true : false
      },
      {
        description: 'Existing solar power vent',
        value: `${this.building.psb_measure.vent_solar_power_vent_pc} PC`,
        visible: this.building.psb_measure.vent_solar_power_vent_pc ? true : false
      },
      {
        description: 'Solar power vent to remove and cover',
        value: `${this.building.psb_measure.vent_solar_power_vent_pc_remove} PC`,
        visible: this.building.psb_measure.vent_solar_power_vent_pc_remove ? true : false
      },
      {
        description: 'Solar power vent to keep',
        value: `${this.building.psb_measure.vent_solar_power_vent_pc - this.building.psb_measure.vent_solar_power_vent_pc_remove} PC`,
        visible: this.building.psb_measure.vent_solar_power_vent_pc - this.building.psb_measure.vent_solar_power_vent_pc_remove? true : false
      },
      {
        description: 'Solar power vent to add',
        value: `${this.building.psb_measure.vent_solar_power_vent_pc_add} PC`,
        visible: this.building.psb_measure.vent_solar_power_vent_pc_add ? true : false
      },
      {
        description: 'Existing power vent',
        value: `${this.building.psb_measure.vent_power_vent_pc} PC`,
        visible: this.building.psb_measure.vent_power_vent_pc ? true : false
      },
      {
        description: 'Power vent to remove and cover',
        value: `${this.building.psb_measure.vent_power_vent_pc_remove} PC`,
        visible: this.building.psb_measure.vent_power_vent_pc_remove ? true : false
      },
      {
        description: 'Power vent to keep',
        value: `${this.building.psb_measure.vent_power_vent_pc - this.building.psb_measure.vent_power_vent_pc_remove} PC`,
        visible: this.building.psb_measure.vent_power_vent_pc -this.building.psb_measure.vent_power_vent_pc_remove ? true : false
      },
      {
        description: 'Power vent to add',
        value: `${this.building.psb_measure.vent_power_vent_pc_add} PC`,
        visible: this.building.psb_measure.vent_power_vent_pc_add ? true : false
      },
      // {
      //   description: 'Exposed wide soffit on eves',
      //   value: `${this.building.psb_measure.vent_soffit_eves_in} IN`,
      //   visible: this.building.psb_measure.vent_soffit_eves_in ? true : false
      // },
      // {
      //   description: 'Exposed wide soffit on rakes',
      //   value: `${this.building.psb_measure.vent_soffit_rakes_in} IN`,
      //   visible: this.building.psb_measure.vent_soffit_rakes_in ? true : false
      // },
      {
        description: 'All Expossed soffit',
        value: `${this.building.psb_measure.vent_additional_soffit_eves_sf} SF`,
        visible: this.building.psb_measure.vent_additional_soffit_eves_sf ? true : false
      },
      // {
      //   description: 'Cut siding on walls',
      //   value: `${this.building.psb_measure.vent_cut_sidding_walls_lf} LF`,
      //   visible: this.building.psb_measure.vent_cut_sidding_walls_lf ? true : false
      // }
    );
  }

  findMeasureMaterialType(id: number) {
    const material = this.measuresMaterialsType.find(x => x.id === id);
    if (material) {return material.material_type;}
    return '';
  }

  getDMetalList() {
    this.dMetalList = [];
    const evesRakes = `${this.building.psb_measure.id_metal_eves_rakes_flat_roof &&
        this.validEvesRakesInFlatRoof
        ? this.findMeasureMaterialType(
          this.building.psb_measure.id_metal_eves_rakes_flat_roof
        )
        : ''
      }`;
    const evesStarters = `${this.building.psb_measure.id_metal_eves_starters_low_slope &&
        this.validEvesStartersInLowOrSteepSlope
        ? this.findMeasureMaterialType(
          this.building.psb_measure.id_metal_eves_starters_low_slope
        )
        : ''
      }`;
    const rakes = `${this.building.psb_measure.id_metal_rakes_low_steep_slope &&
        this.validRakesInLowOrSteepSlope
        ? this.findMeasureMaterialType(
          this.building.psb_measure.id_metal_rakes_low_steep_slope
        )
        : ''
      }`;

    this.dMetalList.push(
      {
        description: 'Eaves/rakes',
        value: evesRakes,
        visible: evesRakes && evesRakes !== '' ? true : false
      },
      {
        description: 'Eaves/starters',
        value: evesStarters,
        visible: evesStarters && evesStarters !== '' ? true : false
      },
      {
        description: 'Rakes',
        value: rakes,
        visible: rakes && rakes !== '' ? true : false
      }
    );
  }

  getLowSlopeList() {
    this.lowSlopeList = [];
    if (this.validPitchAngleLowSlope) {
      this.lowSlopeList.push(
        {
          description: 'Eaves/starter',
          value: `${this.building.psb_measure.eves_starters_lf_low_slope} LF`,
          visible: this.building.psb_measure.eves_starters_lf_low_slope ? true : false
        },
        {
          description: 'Valleys',
          value: `${this.building.psb_measure.valleys_lf_low_slope} LF`,
          visible: this.building.psb_measure.valleys_lf_low_slope ? true : false
        },
        {
          description: 'Rakes',
          value: `${this.building.psb_measure.rakes_lf_low_steep_slope} LF`,
          visible: this.building.psb_measure.rakes_lf_low_steep_slope ? true : false
        }
      );
    }
  }

  /**
   * @author: Carlos Rodríguez
   */
  getFlatRoofList() {
    if (!this.building) {
      return;
    }
    this.flatRoofList = [];
    if (this.validPitchAngleFlatRoof) {
      this.flatRoofList.push({
        description: 'Eaves & Rakes',
        value: `${this.building.psb_measure.eves_rakes_lf_flat_roof} LF`,
        visible: this.building.psb_measure.eves_rakes_lf_flat_roof ? true : false
      });
    }
  }

  getFlashingsList() {
    this.flashingsList = [];
    this.flashingsList.push(
      {
        description: 'Step 4x4x8',
        value: `${this.building.psb_measure.flash_step_4_4_8_lf} LF`,
        visible: this.general.parseNumber(this.building.psb_measure.flash_step_4_4_8_lf) > 0
      },
      {
        description: 'Step 4x4x12',
        value: `${this.building.psb_measure.flash_step_4_4_12_lf} LF`,
        visible: this.general.parseNumber(this.building.psb_measure.flash_step_4_4_12_lf ) > 0
      },
      {
        description: 'Rolled metal 20” x 50”',
        value: `${this.building.psb_measure.flash_rolled_metal_20_50_lf} LF`,
        visible: this.general.parseNumber(this.building.psb_measure.flash_rolled_metal_20_50_lf ) > 0
      },
      {
        description: 'End wall metal',
        value: `${this.building.psb_measure.flash_end_wall_metal_3_5_10_lf} LF`,
        visible: this.general.parseNumber(this.building.psb_measure.flash_end_wall_metal_3_5_10_lf ) > 0
      },
      {
        description: 'Pipe flashings (3 in 1 - 1”, 2”, 3”)',
        value: `${this.building.psb_measure.flash_pipe_3_in_1_pc} PC`,
        visible: this.general.parseNumber(this.building.psb_measure.flash_pipe_3_in_1_pc ) > 0
      },
      {
        description: 'Pipe flashings (2 in 1 - 4”, 5”)',
        value: `${this.building.psb_measure.flash_pipe_2_in_1_pc} PC`,
        visible: this.general.parseNumber(this.building.psb_measure.flash_pipe_2_in_1_pc ) > 0
      },
      {
        description: 'Retrofit pipe flashing',
        value: `${this.building.psb_measure.flash_retrofit_pipe_pc} PC`,
        visible: this.general.parseNumber(this.building.psb_measure.flash_retrofit_pipe_pc ) > 0
      }
    );
  }

  /**
   * @author: Carlos Rodríguez
   */
  getMiscellaneusList() {
    if (!this.building) {
      return;
    }
    this.miscellaneusList = [];
    this.miscellaneusList.push(
      {
        description: 'Roof caulking',
        value: `${this.building.psb_measure.misc_roof_caulking_pc} PC`,
        visible: this.building.psb_measure.misc_roof_caulking_pc ? true : false
      },
      {
        description: 'Spray Paint',
        value: `${this.building.psb_measure.misc_spary_paint_pc} PC`,
        visible: this.building.psb_measure.misc_spary_paint_pc ? true : false
      },
      {
        description: 'Poor access',
        value: `${this.building.psb_measure.misc_poor_access_dll} $`,
        visible: this.building.psb_measure.misc_poor_access_dll ? true : false
      },
      {
        description: 'Miscellaneous',
        value: `${this.building.psb_measure.misc_miscellaneous_dll} $`,
        visible: this.building.psb_measure.misc_miscellaneous_dll ? true : false
      },
      {
        description: 'Permit',
        value: `${this.building.psb_measure.misc_permit_dll} $`,
        visible: this.building.psb_measure.misc_permit_dll ? true : false
      },
      {
        description: 'Contingency Fund',
        value: `${this.building.psb_measure.misc_contingency_fund_dll} $`,
        visible: this.building.psb_measure.misc_contingency_fund_dll ? true : false
      }
    );
  }

  /**
   * @author: Carlos Rodríguez
   */
  getStepSlopeList() {
    if (!this.building) {
      return;
    }
    this.stepSlopeList = [];

    if (this.validPitchAngleSteepSlope) {
      this.stepSlopeList.push(
        {
          description: 'Linear Feet of eaves/starter',
          value: `${this.building.psb_measure.eves_starters_lf_steep_slope} LF`,
          visible: this.building.psb_measure.eves_starters_lf_steep_slope ? true : false
        },
        {
          description: 'Linear Feet of Valleys',
          value: `${this.building.psb_measure.valleys_lf_steep_slope} LF`,
          visible: this.building.psb_measure.valleys_lf_steep_slope ? true : false
        },
        {
          description: 'Linear Feet of Rakes',
          value: `${this.building.psb_measure.rakes_lf_steep_slope} LF`,
          visible: this.building.psb_measure.rakes_lf_steep_slope && this.building.psb_measure.rakes_lf_steep_slope > 0 ? true : false
        }
      );
    }
  }

  getOutOfTownExpenses() {
    if (!this.building) {
      return;
    }
    this.outOfTownExpensesList = [];
    this.outOfTownExpensesList.push(
      {
        description: 'Additional fuel',
        value: `$ ${this.building.psb_measure.out_additional_fuel_dll}`,
        visible: this.building.psb_measure.out_additional_fuel_dll ? true : false
      },
      {
        description: 'Estimated days',
        value: `${this.building.psb_measure.out_estimated_days_days} QTY`,
        visible: this.building.psb_measure.out_estimated_days_days ? true : false
      },
      {
        description: 'Estimated roofers',
        value: `${this.building.psb_measure.out_estimated_roofers_qty} QTY`,
        visible: this.building.psb_measure.out_estimated_roofers_qty ? true : false
      },
      {
        description: 'Lodging rate per dayl',
        value: `$ ${this.building.psb_measure.out_loding_rate_dll}`,
        visible: this.building.psb_measure.out_loding_rate_dll ? true : false
      },
      {
        description: 'Travel time',
        value: `${this.building.psb_measure.out_travel_time_hrs} Hrs`,
        visible: this.building.psb_measure.out_travel_time_hrs ? true : false
      }
    );
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

  async openModalRidgeCap() {
    //if(this.oneRidgeCap === false) {
      const modal = await this.modalController.create({
        component: RidgeCapComponent,
        cssClass: 'screen-350'
      });
      await modal.present();
      const { data } = await modal.onWillDismiss();
      if (!data) {
        return;
      }
    //}
  }

  /**
   * Verified information before save data
   *
   * @returns
   */
  async onVerifiedCheked(event) {
    let aRestar = 0;
    if (!this.validPitchAngleFlatRoof) {aRestar++;}
    if (!this.validPitchAngleLowSlope) {aRestar++;}
    if (!this.validPitchAngleSteepSlope) {aRestar++;}

    const totalModals = 7 - aRestar;

    const verifiedInformation = this.projectShingleBuilding.psb_verifieds
      ? [...this.projectShingleBuilding.psb_verifieds]
      : [];


    const psb_no_requireds = this.projectService.getShingleNoRequired(12, false, true);
    const psb_selection_verifieds = this.projectService.getShingleVerifiedInformation(
    12,
    false
    );

    const verified = verifiedInformation.filter(
      x => x.id_resource >= 13 && x.id_resource <= 21 && x.is_verified
    );

    if (verified.length >= totalModals) {
      this.showIconError = false;
      let psb_verifieds = this.projectService.getShingleVerifiedInformation(
        9,
        !this.otherMeasuresActive
      );

      psb_verifieds = [...psb_verifieds, ...psb_selection_verifieds];

      //this.projectShingleBuilding.psb_selected_materials = [];

      if(this.projectShingleBuilding.psb_selected_materials){
        this.projectShingleBuilding.psb_selected_materials = this.projectShingleBuilding.psb_selected_materials.map(
          x => {return {...x, deletedAt:  new Date()};}
        );
      }

      const shingle: PsbMeasures = {
        ...this.projectShingleBuilding,
        psb_verifieds,
        psb_no_requireds
      };

      if(shingle.hips_lf === 0 && shingle.ridge_lf === 0) {
        const upgradeRidgeventsId = await this.general.getConstDecimalValue('upgrade_ridgevents');
        const costIntegrationDeclinedId = await this.general.getConstDecimalValue('cost_integration_declined');
        const resourceSelectionId = await this.general.getConstDecimalValue('resource_selection');

        shingle.psb_verifieds = shingle.psb_verifieds.filter(item => item.id_resource !== resourceSelectionId);

        if(shingle.psb_upgrades && shingle.psb_upgrades.length > 0 ){

          shingle.psb_upgrades = shingle.psb_upgrades.map(x => {
            if(x.id_upgrade === upgradeRidgeventsId) {
              return {...x, id_cost_integration: costIntegrationDeclinedId};
            }
            return x;
          });
        } else {
          shingle.psb_upgrades = [{
            id_upgrade: upgradeRidgeventsId,
            id: null,
            id_project: this.project.id,
            id_cost_integration: costIntegrationDeclinedId,
            isModified: null,
        }
          ];
        }

        const categoryRidgecapId = await this.general.getConstDecimalValue('category_ridgecap');
        if(shingle.psb_selected_materials){
          shingle.psb_selected_materials = shingle.psb_selected_materials.map(
            x => {
              if (x.id_material_category === categoryRidgecapId) {
                return {...x, deletedAt:  new Date()};
              }

            return x;}
          );
        }

      }
      this.projectService.saveProjectShingleBuilding(shingle);
      setTimeout(() => {
        if (!event) {
          this.synProjects.syncOffline();
          this.changeSegmentEmmited.emit('options');
        }
      }, 500);

    } else {
      this.showIconError = true;
    }
  }

  validateChanges() {
    let aRestar = 0;
    if (!this.validPitchAngleFlatRoof) {aRestar++;}
    if (!this.validPitchAngleLowSlope) {aRestar++;}
    if (!this.validPitchAngleSteepSlope) {aRestar++;}

    const totalModals = 8 - aRestar;

    const verifiedInformation = this.projectShingleBuilding.psb_verifieds
      ? [...this.projectShingleBuilding.psb_verifieds]
      : [];

    const verified = verifiedInformation.filter(
      x => x.id_resource >= 13 && x.id_resource <= 21 && x.is_verified
    );
    if (verified.length >= totalModals) {
      this.showIconError = false;
    } else {
      this.otherMeasuresActive = false;
      this.showIconError = true;
    }
  }

  isExistResources(idResourse: number) {
    const element = this.psbVerifieds.find(element => element.id_resource == idResourse);
    if (element) {
      return true;
    }
    return false;
  }

  /**
   * @author: Carlos Rodríguez
   */
  async openModalFlatRoof() {
    if (this.validPitchAngleFlatRoof) {
      const modal = await this.modalController.create({
        component: FlatRoofComponent,
        cssClass: 'screen-300'
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (!data) {
        return;
      }
    }
  }

  /**
   * @author: Carlos Rodríguez
   */
  async openModalMiscellaneus() {
    const modal = await this.modalController.create({
      component: MiscellaneusComponent,
      cssClass: 'screen-550'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (!data) {
      return;
    }
  }

  async openModalLowSlope() {
    if (this.validPitchAngleLowSlope) {
      const modal = await this.modalController.create({
        component: LowSlopeComponent,
        cssClass: 'screen-450'
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (!data) {
        return;
      }
    }
  }

  async openModalOutOfTownExpenses() {
    const modal = await this.modalController.create({
      component: OutOfTownExpensesComponent,
      cssClass: 'screen-650',
      componentProps: {
        hotelId: this.hotelId,
        airBnBId: this.airBnBId
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (!data) {
      return;
    }
  }

  /**
   * @author: Carlos Rodríguez
   */
  async openModalStepSlope() {
    if (this.validPitchAngleSteepSlope) {
      const modal = await this.modalController.create({
        component: SteepSlopeComponent,
        cssClass: 'screen-400'
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (!data) {
        return;
      }
    }
  }

  async openModalDMetal() {
    if (
      this.validEvesRakesInFlatRoof ||
      this.validEvesStartersInLowOrSteepSlope ||
      this.validRakesInLowOrSteepSlope
    ) {
      const modal = await this.modalController.create({
        component: DMetalComponent,
        cssClass: 'screen-750',
        componentProps: {
          validEvesRakesInFlatRoof: this.validEvesRakesInFlatRoof,
          validEvesStartersInLowOrSteepSlope: this.validEvesStartersInLowOrSteepSlope,
          validRakesInLowOrSteepSlope: this.validRakesInLowOrSteepSlope
        }
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      if (!data) {
        return;
      }
    }
  }

  async openModalFlashings() {
    const modal = await this.modalController.create({
      component: FlashingsComponent,
      cssClass: 'screen-650'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (!data) {
      return;
    }
  }

  /**
   * @author: Carlos Rodríguez
   */
  async openModalVenting() {
    const modal = await this.modalController.create({
      component: VentingComponent
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (!data) {
      return;
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
}
