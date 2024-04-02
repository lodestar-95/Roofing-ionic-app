import { CALCULATION_SCHEMA } from './../../calculation/const';
import { Building } from './../../../models/building.model';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { MaterialColor } from 'src/app/models/material-color.model';
import { MeasuresMaterialType } from 'src/app/models/measures-material-types.model';
import { Project } from 'src/app/models/project.model';
import { PvMaterialColor } from 'src/app/models/pv_material_color.model';
import { Trademark } from 'src/app/models/trademark.model';
import { Version } from 'src/app/models/version.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { LoadingService } from 'src/app/shared/helpers/loading.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { CalculationService } from '../../calculation/calculation.service';
import { GeneralService } from '../../calculation/materials/general.service';
import { CostCalulation } from '../../models/costs-calculations.model';
import { v4 as uuidv4 } from 'uuid';
import { AlertController } from '@ionic/angular';
import { BidSheetCalculationService } from '../../pages/bid-sheet/calculations.service';
import { NotFoundMaterialException } from '../../calculation/not-found-material.exception';

export type CostsOrder = 'price' | 'brand';

@Component({
  selector: 'app-costs-grid',
  templateUrl: './costs-grid.component.html',
  styleUrls: ['./costs-grid.component.scss'],
})
export class CostsGridComponent implements OnInit, OnDestroy {
  order: CostsOrder = 'brand';
  project: Project;
  version: Version;
  shingleLines: any[];
  materialTypes: MeasuresMaterialType[];
  materialColors: MaterialColor[];
  trademarks: Trademark[] = [];
  storeSubs: Subscription;
  costCalculation: CostCalulation;
  buildingCalculation: any;
  canModifyProposal = true;
  options: any[];
  builtins: any[];
  upgrades: any[];
  isFirstLoad = true;
  userDisabledPermision = false;
  messageShowed = false;
  message: string;
  alwaysAllowModification: boolean;

  constructor(
    private store: Store<AppState>,
    private catalogs: CatalogsService,
    private calculation: CalculationService,
    private loading: LoadingService,
    private router: Router,
    private projectService: ProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private general: GeneralService,
    private alertController: AlertController,
    private calculationService: BidSheetCalculationService
  ) {
    this.message = '';
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      if (!this.router.url.includes('/estimate')) {
        return;
      }

      this.canModifyProposal = this.project?.project_status?.id == 1 || this.project?.project_status?.id == 2;
      this.validateRolePermission();
      this.version = this.project.versions.find(x => x.active);
      if (!this.version.id_cost_type) this.version = { ...this.version, id_cost_type: 1 };
      let activeBuildingId = this.version.buildings.find(x => x.active)?.id;
      if (!activeBuildingId) {
        activeBuildingId = this.version.buildings.find(x => x.is_main_building)?.id;
      }

      if (this.isFirstLoad) {
        this.isFirstLoad = false;
      }

      this.loading.loading(true);
      this.calculation.calculateBidsheet(this.project).then(result => {
        this.costCalculation = result;
        this.calculationService.setCalculations(result);
        this.options = [];
        this.builtins = [];
        result.data.buildings.forEach(x => this.builtins = [...this.builtins, ...(x.options.filter(x => x.is_built_in == true) ?? [])]);

        result.data.buildings.forEach(x => this.options = [...this.options, ...(x.options.filter(x => x.is_built_in == false) ?? [])]);
        this.builtins = [...this.builtins, ...result.data.upgrades_builtin];
        this.upgrades = [...result.data.upgrades_upgrade];

        this.buildingCalculation = this.costCalculation.data.buildings.find(x => x.id_building == activeBuildingId);

        this.catalogs.getUpgrades().then(response => {
          const conceptType = response.data;
          const builtin = this.buildingCalculation?.builtin.map((element) => {
            const concept = conceptType.find(x => x.id == element.id_upgrade)?.upgrade;
            return { ...element, concept };
          });

          const upgrades = this.buildingCalculation?.upgrades.map((element) => {
            const concept = conceptType.find(x => x.id == element.id_upgrade)?.upgrade;
            return { ...element, concept };
          });

          this.builtins = this.builtins?.map((element) => {
            const concept = conceptType.find(x => x.id == element.id_upgrade)?.upgrade;
            return { ...element, concept };
          });


          this.buildingCalculation = { ...this.buildingCalculation, upgrades, builtin };
          this.initData();
          this.saveMaterialCalculation(this.project, result);

          this.validatePitchs();

        });
        this.getAlwaysAllowModification();
      })
        .catch(e => {
          console.error(e);
          if (e instanceof NotFoundMaterialException) {
            this.alertController.create({
              message: e.message,
              buttons: ['OK']
            }).then(a => {
              a.present();
            });
          }
        })
        .finally(() => {
          this.loading.loading(false);
        });
    });
  }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
  }

  async validatePitchs() {
    const greather13 = this.version.buildings.some(b => b.psb_measure.psb_slopes.some(s => s.pitch >= 13));
    if (greather13 && this.messageShowed == false) {
      this.messageShowed = true;
      const alert = await this.alertController.create({
        message: 'One or more roof pitches are greater than 12/12. Please validate the steep slope price is accurate for this roof project.',
        buttons: ['OK']
      });

      await alert.present();
      this.messageShowed = false;
    }
  }

  async saveMaterialCalculation(project: Project, result: any) {
    const version = project.versions.find(x => x.active);
    const shingleIds = version.shingle_lines.filter(x => x.is_selected == true).map(x => this.general.parseNumber(x.id_material_type));
    const buildings = version.buildings.map(b => {
      const calculations = result.data?.buildings?.find(x => x.id_building == b.id)?.calculations;

      let allCalculationList = [];
      if (calculations) {
        Object.keys(calculations).forEach(
          key => (allCalculationList = [...allCalculationList, ...calculations[key]])
        );
      }

      const psb_material_calculations = allCalculationList
        .filter(x => x.qty && x.qty > 0
          && x.is_final == true
          && x.id_material_type && x.id_material_type > 0
          && shingleIds.includes(this.general.parseNumber(x.id_material_type_shingle)))
        .map(x => {
          const previosCalculation = b.psb_measure?.psb_material_calculations?.find(y =>
            this.general.parseNumber(y.id_material_shingle) == this.general.parseNumber(x.id_material_type_shingle)
            && this.general.parseNumber(y.id_concept_type) == this.general.parseNumber(x.id_material_type));

          const id = previosCalculation?.id ?? uuidv4();
          const isModified = this.general.parseNumber(previosCalculation?.quantity) != this.general.parseNumber(x.qty)
            || this.general.parseNumber(previosCalculation?.cost) != this.general.parseNumber(x.cost);

          return {
            id,
            id_concept: this.general.parseNumber(x.id_concept),
            quantity: this.general.parseNumber(x.qty),
            cost: this.general.parseNumber(x.cost),
            id_material_shingle: this.general.parseNumber(x.id_material_type_shingle),
            id_psb_measure: this.general.parseNumber(b.psb_measure.id),
            id_concept_type: this.general.parseNumber(x.id_material_type),
            id_material_price_list: this.general.parseNumber(x.id_material_price_list),
            deletedAt: null,
            isModified,
            from_original_proposal: true,
            is_updated: false,
            id_material: this.general.parseNumber(x.id_material),
          };
        });
      b.psb_measure?.psb_material_calculations?.forEach(c => {
        const newCalculation = psb_material_calculations.find(x => x.id_concept_type == c.id_concept_type && x.id_material_shingle == c.id_material_shingle);
        if (!newCalculation) {
          psb_material_calculations.push({ ...c, deletedAt: new Date(), isModified: true });
        }
      });
      const measure = { ...b.psb_measure, psb_material_calculations, isModified: true };
      return { ...b, psb_measure: measure };
    });

    const updateVersion = { ...version, buildings, isModified: true };
    this.projectService.saveVersion(updateVersion, false);
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() {
    this.catalogs.getMaterialColors().then((result) => {
      this.materialColors = result.data;
    });
  }

  /**
   * Init info page
   */
  initData() {
    this.catalogs.getTrademarks().then((result) => {
      this.trademarks = result.data.map((x) => {
        return { ...x, color: `color: ${x.color}` };
      });


      this.trademarks = this.trademarks.filter((x) => x.is_shingle_trademark == true);

      const trademarksSelected = this.version.pv_trademarks.filter(
        (x) => x.selected == true
      );

      let trademarksAux: Trademark[] = [];
      trademarksSelected.forEach(element => {
        const exist = this.trademarks.find(x => x.id == element.id_trademarks);
        if (!exist) {
          trademarksAux = this.trademarks.filter(x => x.id != element.id_trademarks);
        }
        else {
          trademarksAux.push(exist);
        }
      });

      this.trademarks = trademarksAux;
    });

    const { shingle_lines } = this.project.versions.find((x) => x.active);
    let ids = [];
    this.shingleLines = shingle_lines.filter(x => {
      if (ids.includes(x.id_material_type)) {
        return false;
      } else {
        ids.push(x.id_material_type);
        return true;
      }
    });

    this.shingleLines = this.shingleLines.filter((x) => x.is_selected);

    this.catalogs.getMeasuresMaterialTypes().then((result) => {
      this.materialTypes = result.data;

      this.shingleLines = this.shingleLines.map((element) => {
        const materialType = this.getMaterialType(element.id_material_type);
        const trademark = this.getTrademark(materialType?.id_trademark);
        const color = this.getColor(element.id_material_type);
        const cost = this.getCost(this.costCalculation, element, this.version?.id_cost_type);
        return { ...element, show: false, materialType, trademark, cost, color };
      }).filter(x => x.trademark);

      let shingleLinesAux = [];
      this.trademarks.forEach(element => {
        shingleLinesAux.push(...this.shingleLines.filter(x => x.trademark.id == element.id))
      });
      this.shingleLines = shingleLinesAux;
      this.onOrderByChanged(this.order);
    });
  }

  /**
   * Get catalog material types
   * @param idMaterialType
   * @returns
   */
  getMaterialType(idMaterialType: number): MeasuresMaterialType {
    return this.materialTypes.find((x) => x.id == idMaterialType);
  }

  getColor(idMaterialType: number) {
    const pvColor = this.version.pv_material_colors?.find((x) => x.id_material_type == idMaterialType);
    if (!pvColor) {
      return {};
    }
    const colorName = this.materialColors.find(x => x.id == pvColor.id_color.toString())?.color;
    return { ...pvColor, color: colorName };
  }

  /**
   * Get catalos trademrks
   * @param idTrademark
   * @returns
   */
  getTrademark(idTrademark: number) {
    return this.trademarks.find((x) => x.id == idTrademark);
  }

  /**
   *
   * @param shingleLines
   * @param idCost
   */
  getCost(costCalculation, shingleLine: any, idCost: number = 1) {
    return costCalculation.data.projects
      ?.map((x: any) => {
        if (x.id_concept_type == 10) {
          return { ...x, id_cost_type: 1 };
        } else if (x.id_concept_type == 11) {
          return { ...x, id_cost_type: 2 };
        } else if (x.id_concept_type == 12) {
          return { ...x, id_cost_type: 3 };
        } else {
          return { ...x };
        }
      })
      ?.filter((x) => x.id_material_type_shingle == shingleLine.id_material_type)
      ?.find((x) => x.id_cost_type == idCost);
  }

  /**
   *
   * @param item
   */
  onOrderByChanged(item: CostsOrder) {
    this.order = item;
    if (item == 'brand') {
      this.orderByBrand();
    } else {
      this.orderByPrice();
    }
  }

  /**
   * Order info by brand name asc
   */
  orderByBrand() {
    this.shingleLines = this.shingleLines.sort((a, b) => {
      if (a.materialType?.material_type > b.materialType?.material_type) {
        return 1;
      }
      if (a.materialType?.material_type < b.materialType?.material_type) {
        return -1;
      }
      return 0;
    });
  }

  orderByPrice() {
    this.shingleLines = this.shingleLines.sort((a, b) => (a?.cost?.total ?? 0) - (b?.cost?.total ?? 0));
  }

  onColorChanged(materialColor: PvMaterialColor) {
    const colors = this.version.pv_material_colors ?? [];

    const colorsUpdated = colors.map((x) => {
      if (x.id_material_type == materialColor.id_material_type) {
        return { ...x, id_color: materialColor.id_color, isModified: true };
      } else {
        return x;
      }
    });

    if (!colorsUpdated.some(x => x.id_material_type == materialColor.id_material_type)) {
      colorsUpdated.push(materialColor);
    }

    const versionUpdated = {
      ...this.version,
      pv_material_colors: colorsUpdated,
      isModified: true
    };

    this.projectService.saveVersion(versionUpdated);
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
