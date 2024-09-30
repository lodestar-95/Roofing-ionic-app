import { Injectable } from '@angular/core';
import { Project } from 'src/app/models/project.model';
import { CatalogsService as ApiCatalogService } from 'src/app/services/catalogs.service';
import { DmetalService } from './materials/dmetal.service';
import { FlashingService } from './materials/flashing.service';
import { GeneralService } from './materials/general.service';
import { MiscellaneousService } from './materials/miscellaneous.service';
import { NailsService } from './materials/nails.service';
import { OsbService } from './materials/osb.service';
import { RidgecapsService } from './materials/ridgecaps.service';
import { SacapsService } from './materials/sacaps.service';
import { ShinglesService } from './materials/shingles.service';
import { StartersService } from './materials/starters.service';
import { VentingsService } from './materials/ventings.service';
import { TotalsService } from './totals.service';
import { InstallLaborService } from './labors/install.service';
import { OsbLaborService } from './labors/osb.service';
import { INWShieldUnderlaymentsService } from './materials/inwshield-underlayments.service';
import { TearOffLaborService } from './labors/tearoff.service';
import { MaterialPrice } from 'src/app/models/material-price.model';
import { BaseSheetService } from './materials/basesheet.service';
import { WMetalService } from './materials/wmetal.service';
import { SolderedCricketService } from './materials/solderedcricket.service';
import { EndWallService } from './materials/endwall.service';
import { RidgletService } from './materials/ridglet.service';
import { ConcretNailsService } from './materials/concretnails.service';
import { SaddleMetalService } from './materials/saddlemetal.service';
import { SkylightsService } from './materials/skylights.service';
import { PlugRoofService } from './materials/plugroof.service';
import { SaCapService } from './labors/sacap.service';
import { WMetalService as WMetalLabor } from './labors/wmetal.service';
import { CutInVentService } from './labors/cutinvents.service';
import { CutSiddingService } from './labors/cutsidding.service';
import { VentingService } from './labors/venting.service';
import { FlashingService as FlashingLabor } from './labors/flashing.service';
import { SkylightService as SkylighLabor } from './labors/skylights.service';
import { RegletService } from './labors/reglet.service';
import { TravelService } from './labors/travel.service';
import { WindWarrantyService } from './upgrades/windwarranty.service';
import { MaterialWarrantyService } from './upgrades/materialwarranty.service';
import { WMetalWarrantyService } from './upgrades/wmetalwarranty.service';
import { RidgeVentsService } from './upgrades/ridgevents.service';
import { RidgeCapUpgradeService } from './upgrades/ridgecapupgrade.service';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { Building } from 'src/app/models/building.model';
import { INWShieldUnderlaymentsService as INWShieldUnderlaymentsLaborService } from './labors/inwshield-underlayment.service'
import { cMetalService } from './materials/cmetal.service';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {
  private materialList;
  private costTypeId;
  private inspectorTypeId;

  constructor(
    private general: GeneralService,
    private shingle: ShinglesService,
    private starter: StartersService,
    private ridgeCap: RidgecapsService,
    private venting: VentingsService,
    private flashing: FlashingService,
    private miscellaneous: MiscellaneousService,
    private dmetal: DmetalService,
    private cmetal: cMetalService,
    private nails: NailsService,
    private sacaps: SacapsService,
    private osb: OsbService,
    private totals: TotalsService,
    private tearoff: TearOffLaborService,
    private install: InstallLaborService,
    private osbLabor: OsbLaborService,
    private inwshield: INWShieldUnderlaymentsService,
    private catalogsService: ApiCatalogService,
    private basesheet: BaseSheetService,
    private wmetal: WMetalService,
    private solderedcricket: SolderedCricketService,
    private endwall: EndWallService,
    private ridglet: RidgletService,
    private concretnails: ConcretNailsService,
    private saddlemetal: SaddleMetalService,
    private skylights: SkylightsService,
    private plugroof: PlugRoofService,
    private sacapLabor: SaCapService,
    private wmetalLabor: WMetalLabor,
    private cutnewventsLabor: CutInVentService,
    private cutsiddingLabor: CutSiddingService,
    private ventingsLabor: VentingService,
    private flashingLabor: FlashingLabor,
    private skylightLabor: SkylighLabor,
    private regletLabor: RegletService,
    private travelLabor: TravelService,
    private windwarranty: WindWarrantyService,
    private materialWorkmanship: MaterialWarrantyService,
    private wmetalUpgrade: WMetalWarrantyService,
    private ridgeventsUpgrade: RidgeVentsService,
    private ridgecapUpgrade: RidgeCapUpgradeService,
    private authService: AuthService,
    private inwLaborService: INWShieldUnderlaymentsLaborService,
  ) { }

  async calculateBidsheet(project: Project) {
    const currentUser = await this.authService.getAuthUser();
    this.inspectorTypeId = currentUser.id_inspector_type ?? 1;
    const activeVersion = project.versions.find(ver => ver.active);
    const acceptanceDate = activeVersion.expected_acceptance_date
      ? new Date(activeVersion.expected_acceptance_date)
      : new Date();

    const selectedPriceLists = await this.general.getSelectedPriceLists(acceptanceDate);
    const materialList = await this.getMaterialList(selectedPriceLists);
    this.setSelectedMaterialListToServices(materialList);
    return this.calculate(project);
  }

  async getMaterialList(priceListDate) {
    const ids = priceListDate.flatMap(dates => dates.id);
    const materialPrices = (await this.catalogsService.getMaterialPrices()).data;

    

    const custom_skylight_id_material = await this.general.getConstValue('custom_skylight_id_material');
    const materialPrice = materialPrices.filter(material => ids.includes(material.id_price_list) || material.id === custom_skylight_id_material);
    return materialPrice;
  }

  setSelectedMaterialListToServices(materialList: MaterialPrice[]) {
    this.shingle.setMaterialList(materialList);
    this.starter.setMaterialList(materialList);
    this.ridgeCap.setMaterialList(materialList);
    this.venting.setMaterialList(materialList);
    this.flashing.setMaterialList(materialList);
    this.miscellaneous.setMaterialList(materialList);
    this.nails.setMaterialList(materialList);
    this.sacaps.setMaterialList(materialList);
    this.osb.setMaterialList(materialList);
    this.dmetal.setMaterialList(materialList);
    this.cmetal.setMaterialList(materialList);
    this.basesheet.setMaterialList(materialList);
    this.wmetal.setMaterialList(materialList);
    this.solderedcricket.setMaterialList(materialList);
    this.endwall.setMaterialList(materialList);
    this.ridglet.setMaterialList(materialList);
    this.concretnails.setMaterialList(materialList);
    this.saddlemetal.setMaterialList(materialList);
    this.skylights.setMaterialList(materialList);
    this.inwshield.setMaterialList(materialList);
    this.plugroof.setMaterialList(materialList);
    this.materialWorkmanship.setMaterialList(materialList);
    this.wmetalUpgrade.setMaterialList(materialList);
    this.tearoff.setMaterialList(materialList);
    this.install.setMaterialList(materialList);
    this.ridgecapUpgrade.setMaterialList(materialList);
    this.inwLaborService.setMaterialList(materialList);
    this.materialList = materialList;
  }

  /**
   *
   * @param buildings_calculation
   * @returns
   */

  sum = (key, id_material_type, array) => {
    let calcsByShingle = array.filter(
      calc => calc.id_material_type_shingle == id_material_type
    );
    return calcsByShingle.reduce((a, b) => a + (b[key] || 0), 0);
  };

  sumAll = (key, array) => {
    return array.reduce((a, b) => a + (b[key] || 0), 0);
  };

  async getProjectsCalculates(buildings_calculation) {
    let totalsPerShingle = [];
    let shingles = await this.shingle.getShingles();
    for (let shingle of shingles) {
      let totals = [];
      let upgrades = [];
      let builtins = [];
      let options = [];
      for (let building of buildings_calculation) {
        totals = totals.concat(
          building.totals.filter(
            total => total.id_material_type_shingle == shingle.id_material_type
          )
        );
        upgrades = upgrades.concat(
          building.upgrades.filter(
            upgrade => upgrade.id_material_type_shingle == shingle.id_material_type
          )
        );
        builtins = builtins.concat(
          building.builtin.filter(
            builtin => builtin.id_material_type_shingle == shingle.id_material_type
          )
        );
        for (let opt of building.options) {
          opt.total = opt.cost * opt.qty_hours;
        }
        options = options.concat(building.options);
      }

      // totals.sum = sum;
      // upgrades.sum = sum;
      // builtins.sum = sum;
      // options.sum = sum;

      //
      //
      //
      //     Hacer ciclo por los tipos de costo y filtrar los totales por cada tipo
      //
      //
      const inspectorCostTypes = (
        await this.catalogsService.getInspectorCostTypes()
      )?.data?.filter(cost => cost.id_inspector_type == this.inspectorTypeId);

      const optionsOptional = this.sumAll(
        'total',
        options.filter(x => x.is_built_in == false)
      );
      const optionsTotal = this.sumAll('total', options);
      for (let costType of inspectorCostTypes) {
        let totalCostType = {
          total: 0,
          subtotal: this.sum(
            'total',
            shingle.id_material_type,
            totals.filter(x => x.id_cost_type == costType.id_cost_type)
          ),
          upgrades: this.sum('total', shingle.id_material_type, upgrades),
          builtins: this.sum('total', shingle.id_material_type, builtins),
          options: optionsOptional,
          optionsAll: optionsTotal, //TODO: revisar si se requiere sino remover
          id_cost_type: costType.id_cost_type,
          id_material_type_shingle: shingle.id_material_type
        };
        totalCostType.total =
          totalCostType.subtotal + totalCostType.upgrades + totalCostType.options;
        totalsPerShingle.push(totalCostType);
      }
    }
    return totalsPerShingle;
  }

  /**
   *
   * @param version
   * @param materials
   * @returns
   */
  async calculate(project: Project) {
    const version = project.versions.filter(ver => ver.active)[0];
    if (version == null) {
      return;
    }
    let buildings_calculation = [];
    this.costTypeId = !version.id_cost_type || version.id_cost_type == 0 ? 1 : version.id_cost_type;

    //Obtener los buildings de la versión  activa del proyecto
    const buildings = version.buildings.filter(building => building.deletedAt == null);
    const mainBuilding = buildings.find(building => building.is_main_building == true);

    for (const building of buildings) {
      let buildingObj = JSON.parse(JSON.stringify(building));
      //TODO: Eliminar cuando ya vengan en el json de projects
      if (!buildingObj.psb_measure) {
        buildingObj.psb_measure = {};
      }
      if (
        (project.id_prospecting_type == 1 || project.id_prospecting_type == 2) &&
        buildingObj.psb_measure != null
      ) {
        if (mainBuilding && mainBuilding.psb_measure.psb_upgrades) {
          buildingObj.psb_measure = {
            ...buildingObj.psb_measure,
            psb_upgrades: mainBuilding.psb_measure.psb_upgrades
          };
        }

        if (buildingObj.psb_measure.psb_skylights) {
          for (let skylight of buildingObj.psb_measure.psb_skylights) {
            //TODO: Cambiar los valores fijos por los valores del catálogo
            switch (skylight.id_skylight_size) {
              case 1:
                skylight.width = 22;
                skylight.f_width = 1 / 2;
                skylight.lenght = 22;
                skylight.f_lenght = 1 / 2;
                break;
              case 2:
                skylight.width = 22;
                skylight.f_width = 1 / 2;
                skylight.lenght = 46;
                skylight.f_lenght = 1 / 2;
                break;
            }
          }
        }

        // cálculo de edificios de tipo  shingle
        const buildingCalculation = await this.calculateShingleBuilding(
          buildingObj,
          version.id,
          project.id_prospecting_type
        );
        if (
          buildingCalculation.is_success == null ||
          buildingCalculation.is_success == false
        )
          return;

        buildings_calculation.push(buildingCalculation);
      }
    }

    const projects_calculation = await this.getProjectsCalculates(buildings_calculation);

    let upgradeBuiltinList = [];
    buildings_calculation.forEach(
      x => (upgradeBuiltinList = [...upgradeBuiltinList, ...(x.builtin ?? [])])
    );
    const upgradeBuiltinTotal = await this.calculateSummaryUpgrade(upgradeBuiltinList);

    let upgradeUpgradeList = [];
    buildings_calculation.forEach(
      x => (upgradeUpgradeList = [...upgradeUpgradeList, ...(x.upgrades ?? [])])
    );
    const upgradeUpgradeTotal = await this.calculateSummaryUpgrade(upgradeUpgradeList);

    let res = {
      data: null
    };

    res.data = {
      buildings: buildings_calculation,
      projects: projects_calculation,
      upgrades_builtin: upgradeBuiltinTotal,
      upgrades_upgrade: upgradeUpgradeTotal
    };
    return res;
  }

  async calculateSummaryUpgrade(upgradeBuiltin: any[]) {
    const shingles = await this.shingle.getShingles();
    const upgrades = (await this.catalogsService.getUpgrades()).data;

    let result = [];
    shingles.forEach(shingle => {
      upgrades.forEach(upgrade => {
        const upgradeList = upgradeBuiltin?.filter(
          x =>
            x.id_upgrade == upgrade.id &&
            shingle.id_material_type == x.id_material_type_shingle
        );
        if (upgradeList && upgradeList.length > 0) {
          const upgradeObj = JSON.parse(JSON.stringify(upgradeList[0]));
          upgradeObj.concept = upgrade.upgrade;
          upgradeObj.subtotal = upgradeList
            .map(x => +x.subtotal)
            .reduce((x, y) => x + y, 0);
          upgradeObj.taxes = upgradeList.map(x => +x.taxes).reduce((x, y) => x + y, 0);
          upgradeObj.total = upgradeList.map(x => +x.total).reduce((x, y) => x + y, 0);
          result.push(upgradeObj);
        }
      });
    });

    return result;
  }

  /**
   *
   * @param building
   * @param versionId
   * @returns
   */
  async calculateShingleBuilding(building, versionId, prospectingType) {
    //Material Calculations
    let buildingsCalculation: any = {};
    buildingsCalculation.shingles = await this.shingle.calculateShingles(building);
    buildingsCalculation.starters = await this.starter.calculateStarters(building);
    buildingsCalculation.ridgecap = await this.ridgeCap.calculateRidgecap(building);
    buildingsCalculation.InWShield = await this.inwshield.calculateInWShieldMeasures(
      building
    );
    buildingsCalculation.ventings = await this.venting.calculateVentingMeasures(building);
    buildingsCalculation.dmetals = await this.dmetal.calculateDMetalMeasures(building);
    buildingsCalculation.cmetals = await this.cmetal.calculateCMetalMeasures(building);
    buildingsCalculation.flashings = await this.flashing.calculateFlashingMeasures(
      building
    );
    buildingsCalculation.nails = await this.nails.calculateNailsMeasures(building);
    buildingsCalculation.concretnails = await this.concretnails.calculate(building);
    buildingsCalculation.SACap = await this.sacaps.calculateSACapsMeasures(building);
    buildingsCalculation.OSB = await this.osb.calculateOsbMeasures(building);
    buildingsCalculation.basesheets = await this.basesheet.calculate(building);
    buildingsCalculation.wmetals = await this.wmetal.calculate(building);
    buildingsCalculation.solderedcricket = await this.solderedcricket.calculate(building);
    buildingsCalculation.endwall = await this.endwall.calculate(building);
    buildingsCalculation.reglet = await this.ridglet.calculate(building);
    buildingsCalculation.saddlemetal = await this.saddlemetal.calculate(building);
    buildingsCalculation.skylights = await this.skylights.calculate(building);
    buildingsCalculation.miscellaneous =
      await this.miscellaneous.calculateMiscellaneousMeasures(building);
    buildingsCalculation.PlugRoofPatch = await this.plugroof.calculate(building);
    buildingsCalculation = await this.reorderPlasticCaps(buildingsCalculation);
    //TODO: Poner los totales en 0 si el tipo de trabajo es tear off only

    let allCalculationList = [];
    Object.keys(buildingsCalculation).forEach(
      key => (allCalculationList = [...allCalculationList, ...buildingsCalculation[key]])
    );

    //Labor Calculations
    let laborCalculations: any = {};
    const job_types_tear_off = await this.general.getConstValue('job_types_tear_off');
    const job_types_tear_off_only = await this.general.getConstValue('job_types_tear_off_only');
    const job_types_overlay = await this.general.getConstValue('job_types_overlay');
    const concept_types_labor = await this.general.getConstValue('concept_types_labor');

    if (
      building.id_job_type == job_types_tear_off ||
      building.id_job_type == job_types_tear_off_only
    ) {
      laborCalculations.tearOff = await this.tearoff.calcTearOffLabor(
        building,
        allCalculationList
      );
    }
    if (building.id_job_type != job_types_tear_off_only) {
      if (building.id_job_type == job_types_overlay) {
        laborCalculations.overlay = await this.install.calcInstallLabor(
          building,
          allCalculationList
        );
      } else {
        laborCalculations.install = await this.install.calcInstallLabor(
          building,
          allCalculationList
        );
      }
    }

    let osb_slopes = building.psb_measure.psb_slopes.filter(
      slope => slope.osb_area != null && slope.osb_area > 0
    );
    if (osb_slopes.length > 0) {
      laborCalculations.osb = await this.osbLabor.calcOsbLabor(
        building,
        allCalculationList
      );
    }

    laborCalculations.sacap = await this.sacapLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.wmetal = await this.wmetalLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.cutnewvents = await this.cutnewventsLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.cutsidding = await this.cutsiddingLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.venting = await this.ventingsLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.flashing = await this.flashingLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.skylight = await this.skylightLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.reglet = await this.regletLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.travel = await this.travelLabor.calculateLabor(
      building,
      allCalculationList
    );
    laborCalculations.inwshield = await this.inwLaborService.calculate(building, allCalculationList);

    let laborCalculationList = [];
    Object.keys(laborCalculations).forEach(
      key => (laborCalculationList = [...laborCalculationList, ...laborCalculations[key]])
    );
    laborCalculationList = laborCalculationList.map(x => ({
      ...x,
      id_concept_type: concept_types_labor
    }));
    const materialLaborList = [...allCalculationList, ...laborCalculationList];

    //Upgrades
    const windwarrantyCalculatios = await this.windwarranty.calculate(
      building,
      materialLaborList,
      this.costTypeId,
      this.inspectorTypeId
    );
    const materialWorshipCalculatios = await this.materialWorkmanship.calculate(
      building,
      materialLaborList,
      this.costTypeId,
      this.inspectorTypeId,
      prospectingType
    );
    const wmetalUpgradeCalculations = await this.wmetalUpgrade.calculate(
      building,
      materialLaborList,
      this.costTypeId,
      this.inspectorTypeId
    );
    const ridgeventsUpgradeCalculations = await this.ridgeventsUpgrade.calculate(
      building,
      materialLaborList,
      this.costTypeId,
      this.inspectorTypeId
    );

    const ridgeCapUpgradeCalculations = await this.ridgecapUpgrade.calculate(
      building,
      materialLaborList,
      this.costTypeId,
      this.inspectorTypeId
    );

    let upgradeList = [].concat(
      windwarrantyCalculatios,
      materialWorshipCalculatios,
      wmetalUpgradeCalculations,
      ridgeventsUpgradeCalculations,
      ridgeCapUpgradeCalculations
    );
    allCalculationList = [...allCalculationList, ...upgradeList];

    /*if ((laborCalculations.tearOff != null && laborCalculations.tearOff.lenght > 0) || (laborCalculations.install != null && laborCalculations.install.lenght > 0) || (laborCalculations.overlay != null && laborCalculations.overlay.lenght > 0)) {
      materialCalculations = materialCalculations.concat(laborCalculations.tearOff);
      materialCalculations = materialCalculations.concat(laborCalculations.install);

      let laborTotals = this.totals.calculateTotals(
        building.psb_measure.id,
        materialCalculations,
        concept_types_labor
      );
    }
    */

    //remove some venting calculation when ridge calculation  is built in
    const isBuiltIn = await this.isRidgeBuiltIn(building);
    if (isBuiltIn) {
      buildingsCalculation.ventings = await this.removeVentingList(buildingsCalculation.ventings);
      allCalculationList = await this.removeVentingList(allCalculationList);
      laborCalculationList = await this.removeVentingList(laborCalculationList);
    }

    //Totals calculations
    const concept_types_material = await this.general.getConstValue(
      'concept_types_material'
    );
    if (building.id_job_type == job_types_tear_off_only) {
      await this.setPrice0TearOffOnly(allCalculationList, concept_types_material);
    }
    let materialTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      allCalculationList,
      concept_types_material
    );

    const labor_tax_percentage = await this.general.getConstDecimalValue(
      'labor_tax_percentage'
    );
    let laborTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      laborCalculationList,
      concept_types_labor,
      null,
      labor_tax_percentage
    );

    const concept_types_expenses = await this.general.getConstValue(
      'concept_types_expenses'
    );
    const other_expenses_tax_percentage = await this.general.getConstDecimalValue(
      'other_expenses_tax_percentage'
    );
    let expensesTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      allCalculationList,
      concept_types_expenses,
      null,
      other_expenses_tax_percentage
    );

    const cost_integration_built_in = await this.general.getConstDecimalValue(
      'cost_integration_built_in'
    );
    const cost_integration_upgrade = await this.general.getConstDecimalValue(
      'cost_integration_upgrade'
    );

    const upgradesTotals = await this.GetUpgradeTotals(building, allCalculationList);
    const upgradeUpgradeTotals = upgradesTotals.filter(
      x => x.id_cost_integration == cost_integration_upgrade
    );
    const upgradeBuiltInTotals = upgradesTotals.filter(
      x => x.id_cost_integration == cost_integration_built_in
    );

    const upgradeFinalTotals = await this.getUpgradeFinalTotals(
      upgradeBuiltInTotals,
      this.costTypeId,
      this.inspectorTypeId
    );

    let optionsAll = this.totals.calculateOptions(building);
    const optionsGrantTotal = optionsAll
      .filter(x => x.is_built_in)
      .map(x => +(x.value ?? (+x.cost * +x.qty_hours)))
      .reduce((x, y) => x + y, 0);
    const optionsBuiltInTotals = await this.getOptionalsTotal(optionsGrantTotal, building.psb_measure.id);

    //Grant totals calculations
    let totals = await this.totals.calculateFinalTotals(
      building.psb_measure.id,
      materialTotals,
      laborTotals,
      expensesTotals,
      upgradeFinalTotals,
      optionsGrantTotal,
      versionId,
      this.inspectorTypeId
    );

    return {
      is_success: true,
      id_building: building.id,
      id_psb_measure: building.psb_measure.id,
      calculations: buildingsCalculation,
      labors: laborCalculationList,
      upgradecalculations: upgradeList.filter(
        x => !x.id_cost_integration || x.id_cost_integration == cost_integration_upgrade
      ),
      upgrades: upgradeUpgradeTotals,
      builtin: [...upgradeBuiltInTotals, ...optionsBuiltInTotals],
      options: optionsAll,
      totals: totals
    };
  }

  async removeVentingList(ventings: any[]) {
    const category_metal_artict_vents = await this.general.getConstValue('category_metal_artict_vents');
    const category_solar_power_vents = await this.general.getConstValue('category_solar_power_vents');
    const category_power_vents = await this.general.getConstValue('category_power_vents');

    const labor_category_cut_in_new_vents = await this.general.getConstDecimalValue('labor_category_cut_in_new_vents');
    const labor_category_install_power_vent = await this.general.getConstDecimalValue('labor_category_install_power_vent');
    const labor_category_install_solar_power_vent = await this.general.getConstDecimalValue('labor_category_install_solar_power_vent');

    return ventings.map(x => {
      if (x.id_material_category == category_metal_artict_vents
        || x.id_material_category == category_solar_power_vents
        || x.id_material_category == category_power_vents
        || x.category == labor_category_cut_in_new_vents
        || x.category == labor_category_install_power_vent
        || x.category == labor_category_install_solar_power_vent) {
        return { ...x, qty: 0, value: 0 };
      } else {
        return { ...x };
      }
    })
  }
  async setPrice0TearOffOnly(calculations: any[], idConceptType: string) {

    calculations.forEach(x => {
      if (x.id_concept_type == idConceptType) {
        x.value = 0.00;
      }
    });
  }

  private async isRidgeBuiltIn(building: Building) {
    const upgrade_ridgevents = await this.general.getConstDecimalValue('upgrade_ridgevents');
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');

    const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_ridgevents);
    return upgrade && upgrade.id_cost_integration == cost_integration_built_in;
  }

  async getOptionalsTotal(optionsGrantTotal: number, id_psb_measure) {
    const shingles = await this.shingle.getShingles();
    let totalsPerShingle = [];

    for (let shingle of shingles) {
      let total = {
        subtotal: optionsGrantTotal,
        taxes: null,
        total: null,
        id_concept_type: null,
        id_material_type_shingle: shingle.id_material_type,
        id_psb_measure: id_psb_measure,
        id_upgrade: null,
        id_cost_integration: null
      };

      total.taxes = 0;
      total.total = total.taxes + total.subtotal;
      totalsPerShingle.push(total);
    }
    return totalsPerShingle;
  }

  private async getUpgradeFinalTotals(
    upgradeBuiltInTotals: any[],
    costTypeId,
    inspectorTypeId
  ) {
    const upgrade_w_metal = await this.general.getConstValue('upgrade_w_metal');
    const upgrade_ridgevents = await this.general.getConstValue('upgrade_ridgevents');
    const upgrade_ridgecap = await this.general.getConstValue('upgrade_ridgecap');
    const inspectorType = (
      await this.catalogsService.getInspectorCostTypes()
    )?.data?.find(
      cost => cost.id_inspector_type == inspectorTypeId && cost.id_cost_type == costTypeId
    );

    const upgradeBuiltInTotalsWithoutWmetal = upgradeBuiltInTotals.filter(
      x => x.id_upgrade != upgrade_w_metal && x.id_upgrade != upgrade_ridgevents && x.id_upgrade != upgrade_ridgecap
    ); //El costo ya viene en el calculo de materiales y labor

    //Se quita las comissiones porque el total general lo calcula (evitar duplicar),
    //pero se requiere mantener en el array principal por el detalle de costos
    return upgradeBuiltInTotalsWithoutWmetal.map(x => {
      const generalPorcentage =
        100 -
        (+inspectorType.commision_porcentage +
          +inspectorType.profit_porcentage +
          +inspectorType.overhead_porcentage);
      return { ...x, total: (x.total / 100) * generalPorcentage };
    });
  }

  async reorderPlasticCaps(buildingsCalculation: any) {
    const category_plastic_caps = await this.general.getConstValue(
      'category_plastic_caps'
    );
    let material = this.general.getMaterial(this.materialList, category_plastic_caps)[0];

    if (buildingsCalculation.nails && buildingsCalculation.InWShield) {
      const plasticCaps = buildingsCalculation.InWShield.filter(
        x => x.id_material_type == material.id_material_type
      );
      const iceAndWater = buildingsCalculation.InWShield.filter(
        x => x.id_material_type != material.id_material_type
      );
      buildingsCalculation.nails = [...buildingsCalculation.nails, ...plasticCaps];
      buildingsCalculation.InWShield = iceAndWater;
    }

    return buildingsCalculation;
  }

  private async GetUpgradeTotals(building: any, materialCalculations: any[]) {
    const upgradeTaxPercentage = await this.general.getConstDecimalValue(
      'upgrade_tax_percentage'
    );
    const concept_types_ridgevent_upgrade = await this.general.getConstValue(
      'concept_types_ridgevent_upgrade'
    );
    const upgrade_ridgevents = await this.general.getConstValue('upgrade_ridgevents');
    let upgradesTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      materialCalculations,
      concept_types_ridgevent_upgrade,
      upgrade_ridgevents,
      upgradeTaxPercentage
    );

    const concept_types_wind_warranty_upgrade = await this.general.getConstValue(
      'concept_types_wind_warranty_upgrade'
    );
    const upgrade_wind_warranty = await this.general.getConstValue(
      'upgrade_wind_warranty'
    );
    const windTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      materialCalculations,
      concept_types_wind_warranty_upgrade,
      upgrade_wind_warranty,
      upgradeTaxPercentage
    );

    const concept_types_material_warranty_upgrade = await this.general.getConstValue(
      'concept_types_material_warranty_upgrade'
    );
    const upgrade_material_warranty = await this.general.getConstValue(
      'upgrade_material_warranty'
    );
    const materialTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      materialCalculations,
      concept_types_material_warranty_upgrade,
      upgrade_material_warranty,
      upgradeTaxPercentage
    );

    const concept_types_workmanship_warranty_upgrade = await this.general.getConstValue(
      'concept_types_workmanship_warranty_upgrade'
    );
    const upgrade_workmanship_warranty = await this.general.getConstValue(
      'upgrade_workmanship_warranty'
    );
    let workmanTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      materialCalculations,
      concept_types_workmanship_warranty_upgrade,
      upgrade_workmanship_warranty,
      upgradeTaxPercentage
    );

    const concept_types_wmetal_upgrade = await this.general.getConstValue(
      'concept_types_wmetal_upgrade'
    );
    const upgrade_w_metal = await this.general.getConstValue('upgrade_w_metal');
    let wmetalTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      materialCalculations,
      concept_types_wmetal_upgrade,
      upgrade_w_metal,
      upgradeTaxPercentage
    );

    const concept_types_ridgecap_upgrade = await this.general.getConstValue('concept_types_ridgecap_upgrade');
    const upgrade_ridgecap = await this.general.getConstValue('upgrade_ridgecap');
    let ridgecapTotals = await this.totals.calculateTotals(
      building.psb_measure.id,
      materialCalculations,
      concept_types_ridgecap_upgrade,
      upgrade_ridgecap,
      upgradeTaxPercentage
    );

    upgradesTotals = [
      ...upgradesTotals,
      ...windTotals,
      ...materialTotals,
      ...workmanTotals,
      ...wmetalTotals,
      ...ridgecapTotals
    ];
    return upgradesTotals;
  }
}
