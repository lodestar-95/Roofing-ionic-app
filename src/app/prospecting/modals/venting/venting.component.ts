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
  styleUrls: ['./venting.component.scss'],
})

/**
 * @author: Carlos Rodríguez
 */
export class VentingComponent implements OnInit, OnDestroy {
  vent4: number;
  vent6: number;
  ridgeVent: number;
  isRidgeVent: boolean;
  metalArtticVentsReplace: number;
  metalArtticVentsRemove: number;
  cutNewMetalArtticVents: number;
  solarPowerVent: number;
  powerVent: number;
  soffitEvesIn: number;
  soffit_rakes_in: number;
  additionalSoffitEvesSf: number;
  cutSiddingWallsLf: number;

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
    this.store.pipe(select(selectProjectWithoutRidge)).subscribe(value => this.withoutRidge = value);

    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find(
        (x) => x.active
      );
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
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
    const isNoRequired = this.building.psb_measure.psb_no_requireds.find(x => x.id_resource == 19)?.no_required ?? false;
    if (isNoRequired) {
      this.noRequired = true;
      this.vent4 = 0;
      this.vent6 = 0;
      this.ridgeVent = 0;
      this.isRidgeVent = false;
      this.metalArtticVentsReplace = 0;
      this.metalArtticVentsRemove = 0;
      this.cutNewMetalArtticVents = 0;
      this.solarPowerVent = 0;
      this.powerVent = 0;
      this.soffitEvesIn = 0;
      this.soffit_rakes_in = 0;
      this.additionalSoffitEvesSf = 0;
      this.cutSiddingWallsLf = 0;
    } else {
      this.noRequired = false;
      this.vent4 = this.building.psb_measure.vent_j_vent_4_pc;
      this.vent6 = this.building.psb_measure.vent_j_vent_6_pc;
      this.ridgeVent = this.building.psb_measure.vent_ridgevent_lf;
      this.isRidgeVent =
        this.building.psb_measure.vent_is_ridgevent_in_place;
      this.metalArtticVentsReplace =
        this.building.psb_measure.vent_metal_artict_replace_pc;
      this.metalArtticVentsRemove =
        this.building.psb_measure.vent_metal_artict_remove_pc;
      this.cutNewMetalArtticVents =
        this.building.psb_measure.vent_metal_artict_cut_in_pc;
      this.solarPowerVent =
        this.building.psb_measure.vent_solar_power_vent_pc;
      this.powerVent = this.building.psb_measure.vent_power_vent_pc;
      this.soffitEvesIn = 0;
//        this.building.psb_measure.vent_soffit_eves_in;
      this.soffit_rakes_in = 0;
//        this.building.psb_measure.vent_soffit_rakes_in;
      this.additionalSoffitEvesSf =
        this.building.psb_measure.vent_additional_soffit_eves_sf;
      this.cutSiddingWallsLf =
        this.building.psb_measure.vent_cut_sidding_walls_lf;
    }
  }

  /**
   * Save shingle
   */
  async confirm() {
    const psb_verifieds =
      this.projectService.getShingleVerifiedInformation(19);

    const solar_pv_del_pc = this.building.psb_measure?.psb_upgrades_vent?.solar_pv_del_pc > this.solarPowerVent
      ? this.solarPowerVent : this.building.psb_measure?.psb_upgrades_vent?.solar_pv_del_pc;

    const pv_del_pc = this.building.psb_measure?.psb_upgrades_vent?.pv_del_pc > this.powerVent
      ? this.powerVent : this.building.psb_measure?.psb_upgrades_vent?.pv_del_pc;

    const solar_pv_keep_pc = solar_pv_del_pc ? this.solarPowerVent - solar_pv_del_pc : undefined;

    const pv_keep_pc = pv_del_pc ? this.powerVent - pv_del_pc : undefined;

    const psb_upgrades_vent = this.building.psb_measure?.psb_upgrades_vent ?
      {
        ...this.building.psb_measure.psb_upgrades_vent,
        solar_pv_del_pc,
        pv_del_pc,
        solar_pv_keep_pc,
        pv_keep_pc
      } : undefined;

    const noRequiredObj = this.building.psb_measure.psb_no_requireds.find(x => x.id_resource == 19) ?? {
      id_psb_measure: this.building.psb_measure.id, isModified: true,
      no_required: this.noRequired, id_resource: 19, id: uuidv4()
    };

    let noRequireds;
    if (this.building.psb_measure.psb_no_requireds.some(x => x.id_resource == 19)) {
      noRequireds = [...this.building.psb_measure.psb_no_requireds];
    }else{
      noRequireds = [...this.building.psb_measure.psb_no_requireds, noRequiredObj];
    }

    noRequireds = noRequireds.map(x => {
      if (x.id_resource == 19) {
        return { ...x, no_required: this.noRequired, isModified: true };
      } else {
        return { ...x };
      }
    });

    const psb_measure: PsbMeasures = {
      ...this.building.psb_measure,
      psb_upgrades_vent,
      vent_j_vent_4_pc: this.vent4,
      vent_j_vent_6_pc: this.vent6,
      vent_ridgevent_lf: this.ridgeVent,
      vent_is_ridgevent_in_place: this.isRidgeVent,
      vent_metal_artict_replace_pc: this.metalArtticVentsReplace,
      vent_metal_artict_remove_pc: this.metalArtticVentsRemove,
      vent_metal_artict_cut_in_pc: this.cutNewMetalArtticVents,
      vent_solar_power_vent_pc: this.solarPowerVent,
      vent_power_vent_pc: this.powerVent,
      isModified: true,
      vent_soffit_eves_in: 0, //this.soffitEvesIn,
      vent_soffit_rakes_in: 0, //this.soffit_rakes_in,
      vent_additional_soffit_eves_sf: this.additionalSoffitEvesSf,
      vent_cut_sidding_walls_lf: this.cutSiddingWallsLf,
      psb_no_requireds: noRequireds
    };
    this.updateRedux(psb_measure);

    if (this.confirm2MoreVents() > 1) {
      const result = await this.presentMore2VentsAlert();
      if (result) {


        this.projectService.saveProjectShingleBuilding(psb_measure);
        this.modalController.dismiss(this.modalController.dismiss({ data: true }));
      }
    } else if (this.showError()) {
      await this.presentNoVentAlert();
    } else {
      const psb: PsbMeasures = {
        ...psb_measure,
        psb_verifieds,
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
      message:
        'No ventilation defined, please set material for one kind of them',
      buttons: ['Accept'],
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
          role: 'confirm',
        },
        {
          text: 'No',
          role: 'cancel',
        },
      ],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    return role == 'confirm';
  }

  /**
   * Indicate if there is any error
   * @returns
   */
  showError() {
    if (!this.noRequired &&
      !this.ridgeVent &&
      !this.metalArtticVentsReplace &&
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
    if (this.metalArtticVentsReplace || this.cutNewMetalArtticVents) {
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
  inPlaceChangeCahnged() {
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

    const buildingsUpdated = this.buildings.map((x) => {
      if (x.id == buildingUpdated.id) {
        return { ...buildingUpdated };
      } else {
        return { ...x };
      }
    });

    const version = {
      ...this.project.versions.find((x) => x.active),
      buildings: buildingsUpdated,
    };

    const versions = this.project.versions.map((x) => {
      if (x.id == version.id) {
        return { ...version };
      } else {
        return { ...x };
      }
    });

    const projectUpdated: Project = {
      ...this.project,
      versions: versions,
    };

    this.store.dispatch(
      prospectingActions.setProject({ project: projectUpdated })
    );
  }

  noRequiredChange() {
    if (this.noRequired) {
      this.noRequired = false;
    } else {
      this.noRequired = true;
      this.vent4 = 0;
      this.vent6 = 0;
      this.metalArtticVentsRemove = 0;
      this.metalArtticVentsReplace = 0;
      this.cutNewMetalArtticVents = 0;
      this.solarPowerVent = 0;
      this.powerVent = 0;
      this.soffitEvesIn = 0;
      this.soffit_rakes_in = 0;
      this.additionalSoffitEvesSf = 0;
      this.cutSiddingWallsLf = 0;
      this.isRidgeVent = false;
    }
  }
  disabledRidgeVent(): boolean {
    return (this.withoutRidge || this.noRequired);
  }
}
