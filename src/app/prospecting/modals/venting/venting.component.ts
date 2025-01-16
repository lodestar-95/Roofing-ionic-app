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
  vent6Remove: number;
  vent6Add: number;
  ridgeVent: number;
  isRidgeVent: boolean;
  isRidgeVentAddNew: boolean;
  isinplace: boolean;
  toBeReplace: boolean;

  // psb_louvrevents
  louveredVent4WithExtensions: number;
  louveredVent4WithExtensionsRemove: number;
  louveredVent4WithExtensionsAdd: number;
  louveredVent6WithExtensions: number;
  louveredVent6WithExtensionsRemove: number;
  louveredVent6WithExtensionsAdd: number;
  louveredVent4WithoutExtensions: number;
  louveredVent4WithoutExtensionsRemove: number;
  louveredVent4WithoutExtensionsAdd: number;
  louveredVent6WithoutExtensions: number;
  louveredVent6WithoutExtensionsRemove: number;
  louveredVent6WithoutExtensionsAdd: number;

  //psb_siffutvents
  soffitVent416: number;
  soffitVent416Remove: number;
  soffitVent416Add: number;
  soffitVent616: number;
  soffitVent616Remove: number;
  soffitVent616Add: number;
  soffitVent2: number;
  soffitVent2Remove: number;
  soffitVent2Add: number;
  soffitVent3: number;
  soffitVent3Remove: number;
  soffitVent3Add: number;
  soffitVent4: number;
  soffitVent4Remove: number;
  soffitVent4Add: number;

  metalArtticVents: number;
  metalArtticVentsReplace: number;
  metalArtticVentsAdd: number;
  metalArtticVentsRemove: number;
  metalArtticVentsRelocate: number;
  
  cutNewMetalArtticVents: number;
  powerVent: number;
  powerVentRemove: number;
  powerVentAdd: number;
  solarPowerVent: number;
  solarPowerVentRemove: number;
  solarPowerVentAdd: number;
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
        this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensions;
      this.louveredVent4WithExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsAdd;
      this.louveredVent4WithExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.louveredVent4WithExtensionsRemove;

      if (
        this.louveredVent4WithExtensions != undefined ||
        this.louveredVent4WithExtensionsAdd != undefined ||
        this.louveredVent4WithExtensionsRemove != undefined
      ) {
        if (
          this.louveredVent4WithExtensionsAdd +
            this.louveredVent4WithExtensionsAdd +
            this.louveredVent4WithExtensionsRemove !==
          0
        ) {
          this.islouveredVent4WithExtensions = true;
        }
      }

      this.louveredVent4WithoutExtensions =
        this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensions;
      this.louveredVent4WithoutExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsAdd;
      this.louveredVent4WithoutExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.louveredVent4WithoutExtensionsRemove;

      if (
        this.louveredVent4WithoutExtensions != undefined ||
        this.louveredVent4WithoutExtensionsAdd != undefined ||
        this.louveredVent4WithoutExtensionsRemove != undefined
      ) {
        if (
          this.louveredVent4WithoutExtensions +
            this.louveredVent4WithoutExtensionsAdd +
            this.louveredVent4WithoutExtensionsRemove !==
          0
        )
          this.islouveredVent4WithoutExtensions = true;
      }

      this.louveredVent6WithExtensions =
        this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensions;
      this.louveredVent6WithExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsAdd;
      this.louveredVent6WithExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.louveredVent6WithExtensionsRemove;

      if (
        this.louveredVent6WithExtensions != undefined ||
        this.louveredVent6WithExtensionsAdd != undefined ||
        this.louveredVent6WithExtensionsRemove != undefined
      ) {
        if (
          this.louveredVent6WithExtensions +
            this.louveredVent6WithExtensionsAdd +
            this.louveredVent6WithExtensionsRemove !==
          0
        )
        this.islouveredVent6WithExtensions = true;
      }

      this.louveredVent6WithoutExtensions =
        this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensions;
      this.louveredVent6WithoutExtensionsAdd =
        this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsAdd;
      this.louveredVent6WithoutExtensionsRemove =
        this.building.psb_measure.psb_louvrevents.louveredVent6WithoutExtensionsRemove;

      if (
        this.louveredVent6WithoutExtensions != undefined ||
        this.louveredVent6WithoutExtensionsAdd != undefined ||
        this.louveredVent6WithoutExtensionsRemove != undefined
      ) {
        if (
          this.louveredVent6WithoutExtensions +
            this.louveredVent6WithoutExtensionsAdd +
            this.louveredVent6WithoutExtensionsRemove !==
          0
        )
        this.islouveredVent6WithoutExtensions = true;
      }

      this.soffitVent2 = this.building.psb_measure.psb_soffitvents.soffitVent2;
      this.soffitVent2Add = this.building.psb_measure.psb_soffitvents.soffitVent2Add;
      this.soffitVent2Remove =
        this.building.psb_measure.psb_soffitvents.soffitVent2Remove;

      if (
        this.soffitVent2 != undefined ||
        this.soffitVent2Add != undefined ||
        this.soffitVent2Remove != undefined
      ) {
        if (
          this.soffitVent2 +
            this.soffitVent2Add +
            this.soffitVent2Remove !==
          0
        )
        this.issoffitVent2 = true;
      }

      this.soffitVent3 = this.building.psb_measure.psb_soffitvents.soffitVent3;
      this.soffitVent3Add = this.building.psb_measure.psb_soffitvents.soffitVent3Add;
      this.soffitVent3Remove =
        this.building.psb_measure.psb_soffitvents.soffitVent3Remove;

      if (
        this.soffitVent3 != undefined ||
        this.soffitVent3Add != undefined ||
        this.soffitVent3Remove != undefined
      ) {
        if (
          this.soffitVent3 +
            this.soffitVent3Add +
            this.soffitVent3Remove !==
          0
        )
        this.issoffitVent3 = true;
      }

      this.soffitVent4 = this.building.psb_measure.psb_soffitvents.soffitVent4;
      this.soffitVent4Add = this.building.psb_measure.psb_soffitvents.soffitVent4Add;
      this.soffitVent4Remove =
        this.building.psb_measure.psb_soffitvents.soffitVent4Remove;

      if (
        this.soffitVent4 != undefined ||
        this.soffitVent4Add != undefined ||
        this.soffitVent4Remove != undefined
      ) {
        if (
          this.soffitVent4 +
            this.soffitVent4Add +
            this.soffitVent4Remove !==
          0
        )
        this.issoffitVent4 = true;
      }

      this.soffitVent416 = this.building.psb_measure.psb_soffitvents.soffitVent416;
      this.soffitVent416Add = this.building.psb_measure.psb_soffitvents.soffitVent416Add;
      this.soffitVent416Remove =
        this.building.psb_measure.psb_soffitvents.soffitVent416Remove;

      if (
        this.soffitVent416 != undefined ||
        this.soffitVent416Add != undefined ||
        this.soffitVent416Remove != undefined
      ) {
        if (
          this.soffitVent416 +
            this.soffitVent416Add +
            this.soffitVent416Remove !==
          0
        )
        this.issoffitVent416 = true;
      }

      this.soffitVent616 = this.building.psb_measure.psb_soffitvents.soffitVent616;
      this.soffitVent616Add = this.building.psb_measure.psb_soffitvents.soffitVent616Add;
      this.soffitVent616Remove =
        this.building.psb_measure.psb_soffitvents.soffitVent616Remove;

      if (
        this.soffitVent616 != undefined ||
        this.soffitVent616Add != undefined ||
        this.soffitVent616Remove != undefined
      ) {
        if (
          this.soffitVent616 +
            this.soffitVent616Add +
            this.soffitVent616Remove !==
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
                  this.vent4Relocate!==
          0
        )
        this.isvent4 = true;
      }

      this.vent6 = this.building.psb_measure.vent_j_vent_6_pc;
      this.vent6Add = this.building.psb_measure.vent_j_vent_6_pc_add;
      this.vent6Remove = this.building.psb_measure.vent_j_vent_6_pc_remove;

      if (
        this.vent6 != undefined ||
        this.vent6Add != undefined ||
        this.vent6Remove != undefined
      ) {
        if (
          this.vent6 +
            this.vent6Add +
            this.vent6Remove !==
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
      this.solarPowerVentAdd = this.building.psb_measure.vent_solar_power_vent_pc_add;
      this.solarPowerVentRemove =
        this.building.psb_measure.vent_solar_power_vent_pc_remove;

      if (
        this.solarPowerVent != undefined ||
        this.solarPowerVentAdd != undefined ||
        this.solarPowerVentRemove != undefined
      ) {
        if (
          this.solarPowerVent +
            this.solarPowerVentAdd +
            this.solarPowerVentRemove !==
          0
        )
        this.issolarPowerVent = true;
      }

      this.powerVent = this.building.psb_measure.vent_power_vent_pc;
      this.powerVentAdd = this.building.psb_measure.vent_power_vent_pc_add;
      this.powerVentRemove = this.building.psb_measure.vent_power_vent_pc_remove;

      if (
        this.powerVent != undefined ||
        this.powerVentAdd != undefined ||
        this.powerVentRemove != undefined
      ) {
        if (
          this.powerVent +
            this.powerVentAdd +
            this.powerVentRemove !==
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
      vent_j_vent_6_pc_add: this.vent6Add,
      vent_j_vent_6_pc_remove: this.vent6Remove,

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
      vent_solar_power_vent_pc_add: this.solarPowerVentAdd,
      vent_solar_power_vent_pc_remove: this.solarPowerVentRemove,
      vent_power_vent_pc: this.powerVent,
      vent_power_vent_pc_add: this.powerVentAdd,
      vent_power_vent_pc_remove: this.powerVentRemove,
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
        soffitVent416Remove: this.soffitVent416Remove,
        soffitVent416Add: this.soffitVent416Add,
        soffitVent616: this.soffitVent616,
        soffitVent616Remove: this.soffitVent616Remove,
        soffitVent616Add: this.soffitVent616Add,
        soffitVent2: this.soffitVent2,
        soffitVent2Remove: this.soffitVent2Remove,
        soffitVent2Add: this.soffitVent2Add,
        soffitVent3: this.soffitVent3,
        soffitVent3Remove: this.soffitVent3Remove,
        soffitVent3Add: this.soffitVent3Add,
        soffitVent4: this.soffitVent4,
        soffitVent4Remove: this.soffitVent4Remove,
        soffitVent4Add: this.soffitVent4Add
      },
      psb_louvrevents: {
        id_psb_measure: this.building.psb_measure.id,
        id: uuidv4(),
        louveredVent4WithExtensions: this.louveredVent4WithExtensions,
        louveredVent4WithExtensionsRemove: this.louveredVent4WithExtensionsRemove,
        louveredVent4WithExtensionsAdd: this.louveredVent4WithExtensionsAdd,
        louveredVent6WithExtensions: this.louveredVent6WithExtensions,
        louveredVent6WithExtensionsRemove: this.louveredVent6WithExtensionsRemove,
        louveredVent6WithExtensionsAdd: this.louveredVent6WithExtensionsAdd,
        louveredVent4WithoutExtensions: this.louveredVent4WithoutExtensions,
        louveredVent4WithoutExtensionsRemove: this.louveredVent4WithoutExtensionsRemove,
        louveredVent4WithoutExtensionsAdd: this.louveredVent4WithoutExtensionsAdd,
        louveredVent6WithoutExtensions: this.louveredVent6WithoutExtensions,
        louveredVent6WithoutExtensionsRemove: this.louveredVent6WithoutExtensionsRemove,
        louveredVent6WithoutExtensionsAdd: this.louveredVent6WithoutExtensionsAdd
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
      message: `You're mixing diferent types of ventilation. Are you sure about combine them?`,
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
    if (this.ridgeVent) {
      count++;
    }
    if (this.metalArtticVentsAdd || this.cutNewMetalArtticVents) {
      count++;
    }
    if (this.solarPowerVent) {
      count++;
    }
    if (this.powerVent) {
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
    this.vent6Remove = 0;
    this.vent6Add = 0;
    this.isvent6 = !this.isvent6;
  }
  louveredVent4WithExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent4WithExtensions = 0;
    this.louveredVent4WithExtensionsRemove = 0;
    this.louveredVent4WithExtensionsAdd = 0;
    this.islouveredVent4WithExtensions = !this.islouveredVent4WithExtensions;
  }
  louveredVent6WithExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent6WithExtensions = 0;
    this.louveredVent6WithExtensionsRemove = 0;
    this.louveredVent6WithExtensionsAdd = 0;
    this.islouveredVent6WithExtensions = !this.islouveredVent6WithExtensions;
  }
  louveredVent4WithoutExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent4WithoutExtensions = 0;
    this.louveredVent4WithoutExtensionsRemove = 0;
    this.louveredVent4WithoutExtensionsAdd = 0;
    this.islouveredVent4WithoutExtensions = !this.islouveredVent4WithoutExtensions;
  }
  louveredVent6WithoutExtensionsChange(e): void {
    e.stopPropagation();
    this.louveredVent6WithoutExtensions = 0;
    this.louveredVent6WithoutExtensionsRemove = 0;
    this.louveredVent6WithoutExtensionsAdd = 0;
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
    this.soffitVent416Remove = 0;
    this.soffitVent416Add = 0;
    this.issoffitVent416 = !this.issoffitVent416;
  }
  soffitVent616Change(e): void {
    e.stopPropagation();
    this.soffitVent616 = 0;
    this.soffitVent616Remove = 0;
    this.soffitVent616Add = 0;
    this.issoffitVent616 = !this.issoffitVent616;
  }
  soffitVent2Change(e): void {
    e.stopPropagation();
    this.soffitVent2 = 0;
    this.soffitVent2Remove = 0;
    this.soffitVent2Add = 0;
    this.issoffitVent2 = !this.issoffitVent2;
  }
  soffitVent3Change(e): void {
    e.stopPropagation();
    this.soffitVent3 = 0;
    this.soffitVent3Remove = 0;
    this.soffitVent3Add = 0;
    this.issoffitVent3 = !this.issoffitVent3;
  }
  soffitVent4Change(e): void {
    e.stopPropagation();
    this.soffitVent4 = 0;
    this.soffitVent4Remove = 0;
    this.soffitVent4Add = 0;
    this.issoffitVent4 = !this.issoffitVent4;
  }
  powerVentChange(e): void {
    e.stopPropagation();
    this.powerVent = 0;
    this.powerVentRemove = 0;
    this.powerVentAdd = 0;
    this.ispowerVent = !this.ispowerVent;
  }
  solarPowerVentChange(e): void {
    e.stopPropagation();
    this.solarPowerVent = 0;
    this.solarPowerVentRemove = 0;
    this.solarPowerVentAdd = 0;
    this.issolarPowerVent = !this.issolarPowerVent;
  }
}
