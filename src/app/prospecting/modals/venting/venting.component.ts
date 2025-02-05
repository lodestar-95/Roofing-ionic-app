import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Store, select } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import * as prospectingActions from '../../prospecting.actions';
import { Subscription } from 'rxjs';
import { PsbNoRequired } from 'src/app/models/psb_no_required.model';
import { v4 as uuidv4 } from 'uuid';
import { selectProjectWithoutRidge } from '../../state/propsecting.selectors';

@Component({
  selector: 'app-venting',
  templateUrl: './venting.component.html',
  styleUrls: ['./venting.component.scss']
})

/**
 * @author: Carlos Rodríguez
 */
export class VentingComponent implements OnInit, OnDestroy {

  isVent_modify: boolean = false;

  vent4: number;
  vent4Replace: number;
  vent4Remove: number;
  vent4Add: number;
  vent4Relocate: number;
  vent6: number;
  vent6Replace: number;
  vent6Remove: number;
  vent6Add: number;
  vent6Relocate: number;
  ridgeVent: number;
  isRidgeVent: boolean;
  isRidgeVentAddNew: boolean;
  isinplace: boolean;
  toBeReplace: boolean;

  // psb_louvrevents
  louveredVent4WithExtensions: number;
  louveredVent4WithExtensionsReplace: number;
  louveredVent4WithExtensionsRemove: number;
  louveredVent4WithExtensionsAdd: number;
  louveredVent4WithExtensionsRelocate: number;
  louveredVent6WithExtensions: number;
  louveredVent6WithExtensionsReplace: number;
  louveredVent6WithExtensionsRemove: number;
  louveredVent6WithExtensionsAdd: number;
  louveredVent6WithExtensionsRelocate: number;
  louveredVent4WithoutExtensions: number;
  louveredVent4WithoutExtensionsReplace: number;
  louveredVent4WithoutExtensionsRemove: number;
  louveredVent4WithoutExtensionsAdd: number;
  louveredVent4WithoutExtensionsRelocate: number;
  louveredVent6WithoutExtensions: number;
  louveredVent6WithoutExtensionsReplace: number;
  louveredVent6WithoutExtensionsRemove: number;
  louveredVent6WithoutExtensionsAdd: number;
  louveredVent6WithoutExtensionsRelocate: number;

  //psb_siffutvents
  soffitVent416: number;
  soffitVent416Add: number;
  soffitVent616: number;
  soffitVent616Add: number;
  soffitVent2: number;
  soffitVent2Add: number;
  soffitVent3: number;
  soffitVent3Add: number;
  soffitVent4: number;
  soffitVent4Add: number;

  soffitVentsNotes: string;

  metalArtticVents: number;
  metalArtticVentsReplace: number;
  metalArtticVentsAdd: number;
  metalArtticVentsRemove: number;
  metalArtticVentsRelocate: number;

  cutNewMetalArtticVents: number;
  powerVent: number;
  powerVentReplace: number;
  powerVentRemove: number;
  powerVentAdd: number;
  powerVentRelocate: number;
  solarPowerVent: number;
  solarPowerVentReplace: number;
  solarPowerVentRemove: number;
  solarPowerVentAdd: number;
  solarPowerVentRelocate: number;
  soffitEvesIn: number;
  soffit_rakes_in: number;
  additionalSoffitEvesSf: number;
  cutSiddingWallsLf: number;
  isvent4: boolean;
  isvent6: boolean;
  islouveredVent4WithExtensions: boolean;
  islouveredVent6WithExtensions: boolean;
  islouveredVent4WithoutExtensions: boolean;
  islouveredVent6WithoutExtensions: boolean;
  issoffitVent416: boolean;
  issoffitVent616: boolean;
  issoffitVent2: boolean;
  issoffitVent3: boolean;
  issoffitVent4: boolean;
  ismetalArtticVents: boolean;
  ispowerVent: boolean;
  issolarPowerVent: boolean;

  project: Project;
  building: Building;
  buildings: Building[];
  storeSubs: Subscription;
  noRequired = false;
  withoutRidge: boolean;

  constructor(
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private modalController: ModalController,
    private alertController: AlertController
  ) {
    this.store
      .pipe(select(selectProjectWithoutRidge))
      .subscribe(value => (this.withoutRidge = value));

    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find(x => x.active);
      this.buildings = buildings;
      this.building = buildings.find(x => x.active);
    });
  }

  ngOnInit() {
    this.initData();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Init data config
   */
  initData() {
    this.isVent_modify = this.building.psb_measure.isVent_modify;
    let isNoRequired
    try {
       isNoRequired = this.building.psb_measure.psb_no_requireds.find(x => x.id_resource === 19)?.no_required ?? false;
    } catch (error) {
      isNoRequired = false;
    }



    if(this.isVent_modify === undefined || this.isVent_modify === false) {
      this.noRequired = false;
      this.ismetalArtticVents = true;
      this.isvent4 = true;
      this.isvent6 = true;
      this.isRidgeVent = true;
      this.islouveredVent4WithExtensions = true;
      this.islouveredVent6WithExtensions = true;
      this.islouveredVent4WithoutExtensions = true;
      this.islouveredVent6WithoutExtensions = true;
      this.issoffitVent416 = true;
      this.issoffitVent616 = true;
      this.issoffitVent2  = true;
      this.issoffitVent3  = true;
      this.issoffitVent4 = true;
      this.ispowerVent = true;
      this.issolarPowerVent = true;

    }
    if (!isNoRequired) {
      this.noRequired = true;
      this.vent4 = undefined;
      this.vent6 = undefined;
      this.louveredVent4WithExtensions = undefined;
      this.louveredVent4WithoutExtensions = undefined;
      this.louveredVent6WithExtensions = undefined;
      this.louveredVent6WithoutExtensions = undefined;
      this.soffitVent416 = undefined;
      this.soffitVent616 = undefined;
      this.soffitVent2 = undefined;
      this.soffitVent3 = undefined;
      this.soffitVent4 = undefined;
      this.ridgeVent = undefined;
      this.isRidgeVent = true;
      this.metalArtticVents = undefined;
      this.metalArtticVentsReplace = undefined;
      this.metalArtticVentsAdd = undefined;
      this.metalArtticVentsRemove = undefined;
      this.metalArtticVentsRelocate = undefined;
      this.cutNewMetalArtticVents = undefined;
      this.solarPowerVent = undefined;
      this.powerVent = undefined;
      this.soffitEvesIn = undefined;
      this.soffit_rakes_in = undefined;
      this.additionalSoffitEvesSf = undefined;
      this.cutSiddingWallsLf = undefined;
    } else {
      this.noRequired = isNoRequired;

      this.louveredVent4WithExtensions =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithExtensions;
      this.louveredVent4WithExtensionsReplace =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithExtensions_replace;
      this.louveredVent4WithExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithExtensions_add;
      this.louveredVent4WithExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithExtensions_remove;
      this.louveredVent4WithExtensionsRelocate =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithExtensions_relocate;

      if (
        this.louveredVent4WithExtensions != undefined ||
        this.louveredVent4WithExtensionsReplace != undefined ||
        this.louveredVent4WithExtensionsAdd != undefined ||
        this.louveredVent4WithExtensionsRemove != undefined ||
        this.louveredVent4WithExtensionsRelocate != undefined
      ) {
        if (
          this.louveredVent4WithExtensions +
            this.louveredVent4WithExtensionsReplace +
            this.louveredVent4WithExtensionsAdd +
            this.louveredVent4WithExtensionsRemove +
            this.louveredVent4WithExtensionsRelocate !==
          0
        ) {
          this.islouveredVent4WithExtensions = true;
        }
      }

      this.louveredVent4WithoutExtensions =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithoutExtensions;
      this.louveredVent4WithoutExtensionsReplace =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithoutExtensions_replace;
      this.louveredVent4WithoutExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithoutExtensions_add;
      this.louveredVent4WithoutExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithoutExtensions_remove;
      this.louveredVent4WithoutExtensionsRelocate =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent4WithoutExtensions_relocate;

      if (
        this.louveredVent4WithoutExtensions != undefined ||
        this.louveredVent4WithoutExtensionsReplace != undefined ||
        this.louveredVent4WithoutExtensionsAdd != undefined ||
        this.louveredVent4WithoutExtensionsRemove != undefined ||
        this.louveredVent4WithoutExtensionsRelocate != undefined
      ) {
        if (
          this.louveredVent4WithoutExtensions +
            this.louveredVent4WithoutExtensionsReplace+
            this.louveredVent4WithoutExtensionsAdd +
            this.louveredVent4WithoutExtensionsRemove +
            this.louveredVent4WithoutExtensionsRelocate !==
          0
        )
          this.islouveredVent4WithoutExtensions = true;
      }

      this.louveredVent6WithExtensions =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithExtensions;
      this.louveredVent6WithExtensionsReplace =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithExtensions_replace;
      this.louveredVent6WithExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithExtensions_add;
      this.louveredVent6WithExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithExtensions_remove;
      this.louveredVent6WithExtensionsRelocate =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithExtensions_relocate;

      if (
        this.louveredVent6WithExtensions != undefined ||
        this.louveredVent6WithExtensionsReplace != undefined ||
        this.louveredVent6WithExtensionsAdd != undefined ||
        this.louveredVent6WithExtensionsRemove != undefined ||
        this.louveredVent6WithExtensionsRelocate != undefined
      ) {
        if (
          this.louveredVent6WithExtensions +
            this.louveredVent6WithExtensionsReplace +
            this.louveredVent6WithExtensionsAdd +
            this.louveredVent6WithExtensionsRemove +
            this.louveredVent6WithExtensionsRelocate !==
          0
        )
        this.islouveredVent6WithExtensions = true;
      }

      this.louveredVent6WithoutExtensions =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithoutExtensions;
      this.louveredVent6WithoutExtensionsReplace =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithoutExtensions_replace;
      this.louveredVent6WithoutExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithoutExtensions_add;
      this.louveredVent6WithoutExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithoutExtensions_remove;
      this.louveredVent6WithoutExtensionsRelocate =
        this.building.psb_measure.psb_louvrevents.vent_louveredVent6WithoutExtensions_relocate;

      if (
        this.louveredVent6WithoutExtensions != undefined ||
        this.louveredVent6WithoutExtensionsReplace != undefined ||
        this.louveredVent6WithoutExtensionsAdd != undefined ||
        this.louveredVent6WithoutExtensionsRemove != undefined ||
        this.louveredVent6WithoutExtensionsRelocate != undefined
      ) {
        if (
          this.louveredVent6WithoutExtensions +
            this.louveredVent6WithoutExtensionsReplace +
            this.louveredVent6WithoutExtensionsAdd +
            this.louveredVent6WithoutExtensionsRemove +
            this.louveredVent6WithoutExtensionsRelocate !==
          0
        )
        this.islouveredVent6WithoutExtensions = true;
      }

      this.soffitVent2 = this.building.psb_measure.psb_soffitvents.soffitVent2;
      this.soffitVent2Add = this.building.psb_measure.psb_soffitvents.soffitVent2Add;

      if (
        this.soffitVent2 != undefined ||
        this.soffitVent2Add != undefined
      ) {
        if (
          this.soffitVent2 +
            this.soffitVent2Add !==
          0
        )
        this.issoffitVent2 = true;
      }

      this.soffitVent3 = this.building.psb_measure.psb_soffitvents.soffitVent3;
      this.soffitVent3Add = this.building.psb_measure.psb_soffitvents.soffitVent3Add;

      if (
        this.soffitVent3 != undefined ||
        this.soffitVent3Add != undefined
      ) {
        if (
          this.soffitVent3 +
            this.soffitVent3Add !==
          0
        )
        this.issoffitVent3 = true;
      }

      this.soffitVent4 = this.building.psb_measure.psb_soffitvents.soffitVent4;
      this.soffitVent4Add = this.building.psb_measure.psb_soffitvents.soffitVent4Add;

      if (
        this.soffitVent4 != undefined ||
        this.soffitVent4Add != undefined
      ) {
        if (
          this.soffitVent4 +
            this.soffitVent4Add !==
          0
        )
        this.issoffitVent4 = true;
      }

      this.soffitVentsNotes = this.building.psb_measure.psb_soffitvents.soffitVentsNotes;

      this.soffitVent416 = this.building.psb_measure.psb_soffitvents.soffitVent416;
      this.soffitVent416Add = this.building.psb_measure.psb_soffitvents.soffitVent416Add;

      if (
        this.soffitVent416 != undefined ||
        this.soffitVent416Add != undefined
      ) {
        if (
          this.soffitVent416 +
            this.soffitVent416Add !==
          0
        )
        this.issoffitVent416 = true;
      }

      this.soffitVent616 = this.building.psb_measure.psb_soffitvents.soffitVent616;
      this.soffitVent616Add = this.building.psb_measure.psb_soffitvents.soffitVent616Add;

      if (
        this.soffitVent616 != undefined ||
        this.soffitVent616Add != undefined
      ) {
        if (
          this.soffitVent616 +
            this.soffitVent616Add !==
          0
        )
        this.issoffitVent616 = true;
      }

      this.vent4 = this.building.psb_measure.vent_j_vent_4_pc;
      this.vent4Replace = this.building.psb_measure.vent_j_vent_4_replace;
      this.vent4Add = this.building.psb_measure.vent_j_vent_4_add;
      this.vent4Remove = this.building.psb_measure.vent_j_vent_4_remove;
      this.vent4Relocate = this.building.psb_measure.vent_j_vent_4_relocate;

      if (
        this.vent4 != undefined ||
        this.vent4Replace != undefined ||
        this.vent4Add != undefined ||
        this.vent4Remove != undefined ||
        this.vent4Relocate != undefined
      ) {
        if (
          this.vent4 +
            this.vent4Replace +
            this.vent4Add +
            this.vent4Remove +
            this.vent4Relocate !==
          0
        )
        this.isvent4 = true;
      }

      this.vent6 = this.building.psb_measure.vent_j_vent_6_pc;
      this.vent6Replace = this.building.psb_measure.vent_j_vent_6_replace;
      this.vent6Add = this.building.psb_measure.vent_j_vent_6_add;
      this.vent6Remove = this.building.psb_measure.vent_j_vent_6_remove;
      this.vent6Relocate = this.building.psb_measure.vent_j_vent_6_relocate;

      if (
        this.vent6 != undefined ||
        this.vent6Replace != undefined ||
        this.vent6Add != undefined ||
        this.vent6Remove != undefined ||
        this.vent6Relocate != undefined
      ) {
        if (
          this.vent6 +
            this.vent6Replace +
            this.vent6Add +
            this.vent6Remove +
            this.vent6Relocate !==
          0
        )
        this.isvent6 = true;
      }


      // this.ridgeVent = this.building.psb_measure.vent_ridgevent_lf;
      this.ridgeVent = this.building.psb_measure.ridge_lf;

      if( this.ridgeVent === 0 || this.ridgeVent ===  null || this.ridgeVent === undefined) {
        this.isinplace = false;
        this.toBeReplace = false;
        this.isRidgeVentAddNew = false;
        this.isRidgeVent = false;
      }
      else {
        this.isinplace = this.building.psb_measure.vent_is_ridgevent_in_place;
        this.toBeReplace = this.building.psb_measure.vent_is_ridgevent_be_replace;
        this.isRidgeVentAddNew = this.building.psb_measure.vent_is_ridgevent_add;
        this.isRidgeVent = this.building.psb_measure.isridgeVent;
      }


      this.metalArtticVents = this.building.psb_measure.vent_metal_artict;
      this.metalArtticVentsReplace = this.building.psb_measure.vent_metal_artict_replace;
      this.metalArtticVentsAdd = this.building.psb_measure.vent_metal_artict_add;
      this.metalArtticVentsRemove = this.building.psb_measure.vent_metal_artict_remove;
      this.metalArtticVentsRelocate  = this.building.psb_measure.vent_metal_artict_relocate;

      if (
        this.metalArtticVents != undefined ||
        this.metalArtticVentsReplace != undefined ||
        this.metalArtticVentsAdd != undefined ||
        this.metalArtticVentsRemove != undefined ||
        this.metalArtticVentsRelocate
      ) {
        if (
          this.metalArtticVents +
            this.metalArtticVentsReplace +
            this.metalArtticVentsAdd +
            this.metalArtticVentsRemove+
            this.metalArtticVentsRelocate !==
          0
        )
        this.ismetalArtticVents = true;
      }

      this.cutNewMetalArtticVents = this.building.psb_measure.vent_metal_artict_cut_in_pc;

      this.solarPowerVent = this.building.psb_measure.vent_solar_power_vent_pc;
      this.solarPowerVentReplace = this.building.psb_measure.vent_solar_power_vent_pc_replace;
      this.solarPowerVentAdd = this.building.psb_measure.vent_solar_power_vent_pc_add;
      this.solarPowerVentRemove = this.building.psb_measure.vent_solar_power_vent_pc_remove;
      this.solarPowerVentRelocate = this.building.psb_measure.vent_solar_power_vent_pc_relocate;

      if (
        this.solarPowerVent != undefined ||
        this.solarPowerVentReplace != undefined ||
        this.solarPowerVentAdd != undefined ||
        this.solarPowerVentRemove != undefined ||
        this.solarPowerVentRelocate != undefined
      ) {
        if (
          this.solarPowerVent +
            this.solarPowerVentReplace +
            this.solarPowerVentAdd +
            this.solarPowerVentRemove +
            this.solarPowerVentRelocate !==
          0
        )
        this.issolarPowerVent = true;
      }

      this.powerVent = this.building.psb_measure.vent_power_vent_pc;
      this.powerVentReplace = this.building.psb_measure.vent_power_vent_pc_replace;
      this.powerVentAdd = this.building.psb_measure.vent_power_vent_pc_add;
      this.powerVentRemove = this.building.psb_measure.vent_power_vent_pc_remove;
      this.powerVentRelocate = this.building.psb_measure.vent_power_vent_pc_relocate;

      if (
        this.powerVent != undefined ||
        this.powerVentReplace != undefined ||
        this.powerVentAdd != undefined ||
        this.powerVentRemove != undefined ||
        this.powerVentRelocate != undefined
      ) {
        if (
          this.powerVent +
            this.powerVentReplace +
            this.powerVentAdd +
            this.powerVentRemove +
            this.powerVentRelocate !==
          0
        )
        this.ispowerVent = true;
      }


      //        this.building.psb_measure.vent_soffit_rakes_in;
      //        this.building.psb_measure.vent_soffit_eves_in;

      this.soffitEvesIn = 0;
      this.soffit_rakes_in = 0;
      this.additionalSoffitEvesSf =
        this.building.psb_measure.vent_additional_soffit_eves_sf;
      this.cutSiddingWallsLf = this.building.psb_measure.vent_cut_sidding_walls_lf;
    }
  }

  /**
   * Save shingle
   */
  async confirm() {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(19);

    const solar_pv_del_pc =
      this.building.psb_measure?.psb_upgrades_vent?.solar_pv_del_pc > this.solarPowerVent
        ? this.solarPowerVent
        : this.building.psb_measure?.psb_upgrades_vent?.solar_pv_del_pc;

    const pv_del_pc =
      this.building.psb_measure?.psb_upgrades_vent?.pv_del_pc > this.powerVent
        ? this.powerVent
        : this.building.psb_measure?.psb_upgrades_vent?.pv_del_pc;

    const solar_pv_keep_pc = solar_pv_del_pc
      ? this.solarPowerVent - solar_pv_del_pc
      : undefined;

    const pv_keep_pc = pv_del_pc ? this.powerVent - pv_del_pc : undefined;

    const psb_upgrades_vent = this.building.psb_measure?.psb_upgrades_vent
      ? {
          ...this.building.psb_measure.psb_upgrades_vent,
          solar_pv_del_pc,
          pv_del_pc,
          solar_pv_keep_pc,
          pv_keep_pc
        }
      : undefined;

    const noRequiredObj = this.building.psb_measure.psb_no_requireds.find(
      x => x.id_resource === 19
    ) ?? {
      id_psb_measure: this.building.psb_measure.id,
      isModified: true,
      no_required: this.noRequired,
      id_resource: 19,
      id: uuidv4()
    };

    let noRequireds;
    if (this.building.psb_measure.psb_no_requireds.some(x => x.id_resource === 19)) {
      noRequireds = [...this.building.psb_measure.psb_no_requireds];
    } else {
      noRequireds = [...this.building.psb_measure.psb_no_requireds, noRequiredObj];
    }
    noRequireds = noRequireds.map(x => {
      if (x.id_resource === 19) {
        return { ...x, no_required: this.noRequired, isModified: true };
      } else {
        return { ...x };
      }
    });

    const psb_measure: PsbMeasures = {
      ...this.building.psb_measure,

      psb_upgrades_vent,
      vent_j_vent_4_pc: this.vent4,
      vent_j_vent_4_replace: this.vent4Replace,
      vent_j_vent_4_add: this.vent4Add,
      vent_j_vent_4_remove: this.vent4Remove,
      vent_j_vent_4_relocate: this.vent4Relocate,
      vent_j_vent_6_pc: this.vent6,
      vent_j_vent_6_replace: this.vent6Replace,
      vent_j_vent_6_add: this.vent6Add,
      vent_j_vent_6_remove: this.vent6Remove,
      vent_j_vent_6_relocate: this.vent6Relocate,

      isVent_modify: true,
      vent_ridgevent_lf: this.ridgeVent,
      ridge_lf: this.ridgeVent,
      isridgeVent: this.isRidgeVent,
      vent_is_ridgevent_in_place: this.isinplace,
      vent_metal_artict: this.metalArtticVents,
      vent_metal_artict_replace: this.metalArtticVentsReplace,
      vent_metal_artict_add: this.metalArtticVentsAdd,
      vent_metal_artict_remove: this.metalArtticVentsRemove,
      vent_metal_artict_relocate: this.metalArtticVentsRelocate,
      vent_metal_artict_cut_in_pc: this.cutNewMetalArtticVents,
      vent_solar_power_vent_pc: this.solarPowerVent,
      vent_solar_power_vent_pc_replace: this.solarPowerVentReplace,
      vent_solar_power_vent_pc_add: this.solarPowerVentAdd,
      vent_solar_power_vent_pc_remove: this.solarPowerVentRemove,
      vent_solar_power_vent_pc_relocate: this.solarPowerVentRelocate,
      vent_power_vent_pc: this.powerVent,
      vent_power_vent_pc_replace: this.powerVentReplace,
      vent_power_vent_pc_add: this.powerVentAdd,
      vent_power_vent_pc_remove: this.powerVentRemove,
      vent_power_vent_pc_relocate: this.powerVentRelocate,
      vent_is_ridgevent_add: this.isRidgeVentAddNew,
      vent_is_ridgevent_be_replace: this.toBeReplace,
      isModified: true,
      vent_soffit_eves_in: 0, //this.soffitEvesIn,
      vent_soffit_rakes_in: 0, //this.soffit_rakes_in,
      vent_additional_soffit_eves_sf: this.additionalSoffitEvesSf,
      vent_cut_sidding_walls_lf: this.cutSiddingWallsLf,
      psb_no_requireds: noRequireds,
      psb_soffitvents: {
        id_psb_measure: this.building.psb_measure.id,
        id: uuidv4(),
        soffitVent416: this.soffitVent416,
        soffitVent416Add: this.soffitVent416Add,
        soffitVent616: this.soffitVent616,
        soffitVent616Add: this.soffitVent616Add,
        soffitVent2: this.soffitVent2,
        soffitVent2Add: this.soffitVent2Add,
        soffitVent3: this.soffitVent3,
        soffitVent3Add: this.soffitVent3Add,
        soffitVent4: this.soffitVent4,
        soffitVent4Add: this.soffitVent4Add,
        soffitVentsNotes: this.soffitVentsNotes
      },
      psb_louvrevents: {
        id_psb_measure: this.building.psb_measure.id,
        id: uuidv4(),
        vent_louveredVent4WithExtensions: this.louveredVent4WithExtensions,
        vent_louveredVent4WithExtensions_replace: this.louveredVent4WithExtensionsReplace,
        vent_louveredVent4WithExtensions_remove: this.louveredVent4WithExtensionsRemove,
        vent_louveredVent4WithExtensions_add: this.louveredVent4WithExtensionsAdd,
        vent_louveredVent4WithExtensions_relocate: this.louveredVent4WithExtensionsRelocate,
        vent_louveredVent6WithExtensions: this.louveredVent6WithExtensions,
        vent_louveredVent6WithExtensions_replace: this.louveredVent6WithExtensionsReplace,
        vent_louveredVent6WithExtensions_remove: this.louveredVent6WithExtensionsRemove,
        vent_louveredVent6WithExtensions_add: this.louveredVent6WithExtensionsAdd,
        vent_louveredVent6WithExtensions_relocate: this.louveredVent6WithExtensionsRelocate,
        vent_louveredVent4WithoutExtensions: this.louveredVent4WithoutExtensions,
        vent_louveredVent4WithoutExtensions_replace: this.louveredVent4WithoutExtensionsReplace,
        vent_louveredVent4WithoutExtensions_remove: this.louveredVent4WithoutExtensionsRemove,
        vent_louveredVent4WithoutExtensions_add: this.louveredVent4WithoutExtensionsAdd,
        vent_louveredVent4WithoutExtensions_relocate: this.louveredVent4WithoutExtensionsRelocate,
        vent_louveredVent6WithoutExtensions: this.louveredVent6WithoutExtensions,
        vent_louveredVent6WithoutExtensions_replace: this.louveredVent6WithoutExtensionsReplace,
        vent_louveredVent6WithoutExtensions_remove: this.louveredVent6WithoutExtensionsRemove,
        vent_louveredVent6WithoutExtensions_add: this.louveredVent6WithoutExtensionsAdd,
        vent_louveredVent6WithoutExtensions_relocate: this.louveredVent6WithoutExtensionsRelocate,
      }
    };
    this.updateRedux(psb_measure);

    if (this.confirm2MoreVents() > 1) {
      const result = await this.presentMore2VentsAlert();
      if (result) {
        this.projectService.saveProjectShingleBuilding(psb_measure);
        this.modalController.dismiss(this.modalController.dismiss({ data: true }));
      }
    } else if (this.showError() && this.noRequired === true) {
      await this.presentNoVentAlert();
    } else {
      const psb: PsbMeasures = {
        ...psb_measure,
        psb_verifieds
      };
      this.projectService.saveProjectShingleBuilding(psb);
      this.modalController.dismiss({ data: !this.showError() });
    }
  }

  /**
   * Displays an alert if no vent was chosen
   */
  async presentNoVentAlert() {
    const alert = await this.alertController.create({
      message: 'No ventilation defined, please set material for one kind of them',
      buttons: ['Accept']
    });

    await alert.present();
    await alert.onWillDismiss();
  }

  /**
   * Displays an alert if no vent was chosen
   */
  async presentMore2VentsAlert() {
    const alert = await this.alertController.create({
      message: `You're mixing different types of ventilation. Are you sure about combine them?`,
      buttons: [
        {
          text: 'Yes',
          role: 'confirm'
        },
        {
          text: 'No',
          role: 'cancel'
        }
      ]
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  /**
   * Indicate if there is any error
   * @returns
   */
  showError() {
    if (
      !this.noRequired &&
      !this.ridgeVent &&
      !this.metalArtticVentsAdd &&
      !this.metalArtticVentsRemove &&
      !this.cutNewMetalArtticVents &&
      !this.solarPowerVent &&
      !this.powerVent &&
      this.building.psb_measure.isModified
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * @returns
   */
  confirm2MoreVents() {

    let count = 0;

    if (this.vent4 || this.vent4Add||
      this.vent6 || this.vent6Add) {
      count++;
    }

    if (this.louveredVent4WithExtensions || this.louveredVent4WithExtensionsAdd ||
      this.louveredVent6WithExtensions || this.louveredVent6WithExtensionsAdd ||
      this.louveredVent4WithoutExtensions || this.louveredVent4WithoutExtensionsAdd ||
      this.louveredVent6WithoutExtensions || this.louveredVent6WithoutExtensionsAdd) {
      count++;
    }

    if (this.soffitVent2 || this.soffitVent2Add || this.soffitVent3 || this.soffitVent3Add ||
      this.soffitVent4 || this.soffitVent4Add || this.soffitVent416 || this.soffitVent416Add ||
      this.soffitVent616 || this.soffitVent616Add) {
        count++;
    }

    if (this.ridgeVent) {
      count++;
    }

    if (this.metalArtticVents || this.metalArtticVentsAdd) {
      count++;
    }

    if (this.solarPowerVent || this.solarPowerVentAdd) {
      count++;
    }

    if (this.powerVent || this.powerVentAdd) {
      count++;
    }

    return count;

  }

  /**
   * Checkbox changed event
   */
  inPlaceChange() {
    this.ridgeVent = 0;
    this.isinplace = !this.isinplace;
    if(this.isinplace) {
      this.isRidgeVentAddNew = false
    }
    if(!this.isinplace){
      this.toBeReplace = false;
    }
    if (this.isRidgeVent) {
      this.ridgeVent = this.building.psb_measure.ridge_lf;
    } else {
      this.ridgeVent = 0;
    }
  }

  /**
   * Update redux
   * @param versions
   * @author: Carlos Rodríguez
   */
  updateRedux(shingle: PsbMeasures) {
    const buildingUpdated = {
      ...this.building,
      shingle,
      isModified: true
    };

    const buildingsUpdated = this.buildings.map(x => {
      if (x.id === buildingUpdated.id) {
        return { ...buildingUpdated };
      } else {
        return { ...x };
      }
    });

    const version = {
      ...this.project.versions.find(x => x.active),
      buildings: buildingsUpdated
    };

    const versions = this.project.versions.map(x => {
      if (x.id === version.id) {
        return { ...version };
      } else {
        return { ...x };
      }
    });

    const projectUpdated: Project = {
      ...this.project,
      versions: versions
    };

    this.store.dispatch(prospectingActions.setProject({ project: projectUpdated }));
  }

  // noRequiredChange() {
  //   if (this.noRequired) {
  //     this.noRequired = false;
  //   } else {
  //     this.noRequired = true;
  //     this.vent4 = 0;
  //     this.vent6 = 0;
  //     this.metalArtticVentsRemove = 0;
  //     this.metalArtticVentsAdd = 0;
  //     this.cutNewMetalArtticVents = 0;
  //     this.solarPowerVent = 0;
  //     this.powerVent = 0;
  //     this.soffitEvesIn = 0;
  //     this.soffit_rakes_in = 0;
  //     this.additionalSoffitEvesSf = 0;
  //     this.cutSiddingWallsLf = 0;
  //     this.isRidgeVent = false;
  //   }
  // }
  disabledRidgeVent(): boolean {
    if(this.isRidgeVentAddNew) {
      this.isRidgeVentAddNew = false
    }
    //this.withoutRidge ||
    return  this.noRequired || this.isRidgeVentAddNew;
  }
  disabledRidgeVentToBeReplaced(): boolean {
    return this.noRequired || !this.isRidgeVent;
  }
  disabledRidgeVentAddNew(): boolean {
    return this.noRequired || !this.isRidgeVent;
  }
  isRidgeVentChange(): void {
    this.isRidgeVent = !this.isRidgeVent;
  }
  isRidgeVentAddNewChange(): void {
    this.ridgeVent = 0;
    this.toBeReplace = false;
    this.isRidgeVentAddNew = !this.isRidgeVentAddNew;
    if (this.isRidgeVent) {
      this.ridgeVent = this.building.psb_measure.ridge_lf;
    } else {
      this.ridgeVent = 0;
    }
  }
  toBeReplacedChange(): void {
    this.ridgeVent = 0;
    this.isRidgeVentAddNew = false;
    this.toBeReplace = !this.toBeReplace;
    if (this.isRidgeVent) {
      this.ridgeVent = this.building.psb_measure.ridge_lf;
    } else {
      this.ridgeVent = 0;
    }
  }
  noRequiredChange(): void {
    this.noRequired = !this.noRequired;
  }

  metalArtticVentsChange(e): void {
    e.stopPropagation();
    this.metalArtticVents = 0;
    this.metalArtticVentsReplace = 0;
    this.metalArtticVentsRemove = 0;
    this.metalArtticVentsAdd = 0;
    this.metalArtticVentsRelocate = 0;
    this.ismetalArtticVents = !this.ismetalArtticVents;
  }
  vent4Change(e): void {
    e.stopPropagation();
    this.vent4 = 0;
    this.vent4Replace = 0;
    this.vent4Remove = 0;
    this.vent4Add = 0;
    this.vent4Relocate = 0;
    this.isvent4 = !this.isvent4;
  }
  vent6Change(e): void {
    e.stopPropagation();
    this.vent6 = 0;
    this.vent6Replace = 0;
    this.vent6Remove = 0;
    this.vent6Add = 0;
    this.vent6Relocate = 0;
    this.isvent6 = !this.isvent6;
  }
  louveredVent4WithExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent4WithExtensions = 0;
    this.louveredVent4WithExtensionsReplace = 0;
    this.louveredVent4WithExtensionsRemove = 0;
    this.louveredVent4WithExtensionsAdd = 0;
    this.louveredVent4WithExtensionsRelocate = 0;
    this.islouveredVent4WithExtensions = !this.islouveredVent4WithExtensions;
  }
  louveredVent6WithExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent6WithExtensions = 0;
    this.louveredVent6WithExtensionsReplace = 0;
    this.louveredVent6WithExtensionsRemove = 0;
    this.louveredVent6WithExtensionsAdd = 0;
    this.louveredVent6WithExtensionsRelocate = 0;
    this.islouveredVent6WithExtensions = !this.islouveredVent6WithExtensions;
  }
  louveredVent4WithoutExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent4WithoutExtensions = 0;
    this.louveredVent4WithoutExtensionsReplace = 0;
    this.louveredVent4WithoutExtensionsRemove = 0;
    this.louveredVent4WithoutExtensionsAdd = 0;
    this.louveredVent4WithoutExtensionsRelocate = 0;
    this.islouveredVent4WithoutExtensions = !this.islouveredVent4WithoutExtensions;
  }
  louveredVent6WithoutExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent6WithoutExtensions = 0;
    this.louveredVent6WithoutExtensionsReplace = 0;
    this.louveredVent6WithoutExtensionsRemove = 0;
    this.louveredVent6WithoutExtensionsAdd = 0;
    this.louveredVent6WithoutExtensionsRelocate = 0;
    this.islouveredVent6WithoutExtensions = !this.islouveredVent6WithoutExtensions;
  }
  ridgeVentChange(e): void {
    e.stopPropagation();
    this.ridgeVent = 0;
    this.isRidgeVent = !this.isRidgeVent;
    this.toBeReplace = false;
    this.isRidgeVentAddNew = false;
  }
  soffitVent416Change(e): void {
    e.stopPropagation();
    this.soffitVent416 = 0;
    this.soffitVent416Add = 0;
    this.issoffitVent416 = !this.issoffitVent416;
  }
  soffitVent616Change(e): void {
    e.stopPropagation();
    this.soffitVent616 = 0;
    this.soffitVent616Add = 0;
    this.issoffitVent616 = !this.issoffitVent616;
  }
  soffitVent2Change(e): void {
    e.stopPropagation();
    this.soffitVent2 = 0;
    this.soffitVent2Add = 0;
    this.issoffitVent2 = !this.issoffitVent2;
  }
  soffitVent3Change(e): void {
    e.stopPropagation();
    this.soffitVent3 = 0;
    this.soffitVent3Add = 0;
    this.issoffitVent3 = !this.issoffitVent3;
  }
  soffitVent4Change(e): void {
    e.stopPropagation();
    this.soffitVent4 = 0;
    this.soffitVent4Add = 0;
    this.issoffitVent4 = !this.issoffitVent4;
  }
  powerVentChange(e): void {
    e.stopPropagation();
    this.powerVent = 0;
    this.powerVentReplace = 0;
    this.powerVentRemove = 0;
    this.powerVentAdd = 0;
    this.powerVentRelocate = 0;
    this.ispowerVent = !this.ispowerVent;
  }
  solarPowerVentChange(e): void {
    e.stopPropagation();
    this.solarPowerVent = 0;
    this.solarPowerVentReplace = 0;
    this.solarPowerVentRemove = 0;
    this.solarPowerVentAdd = 0;
    this.solarPowerVentRelocate = 0;
    this.issolarPowerVent = !this.issolarPowerVent;
  }
}
