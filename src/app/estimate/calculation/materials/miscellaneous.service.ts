import { Injectable } from '@angular/core';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService as ApiCatalogService } from 'src/app/services/catalogs.service';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class MiscellaneousService {
  private materialList: any;

  constructor(
    private general: GeneralService,
    private catalogsService: ApiCatalogService,
    private shingle: ShinglesService
  ) { }

  public setMaterialList(value: any) {
    this.materialList = value;
  }
  async calculateMiscellaneousMeasures(building) {
    return await this.calculateMiscellaneousCost(building.psb_measure);
  };

  async calculateMiscellaneousCost(measures) {
    const expenses = (await this.catalogsService.getExpenses()).data;
    const shingles = await this.shingle.getShingles();
    const category_roof_caulking = await this.general.getConstValue('category_roof_caulking');
    const caulking = this.general.getFirstMaterial(this.materialList,category_roof_caulking);
    if (!caulking) throw new NotFoundMaterialException('Roof caulking');

    const category_spray_paint = await this.general.getConstValue('category_spray_paint');
    const spray = this.general.getFirstMaterial(this.materialList, category_spray_paint);
    if (!spray) throw new NotFoundMaterialException('Spray paint');
    let quantityCaulking = measures.misc_roof_caulking_pc;
    quantityCaulking += this.getChimneyCaulking(measures);
    const x = await this.general.calculatePiecesCost(
      quantityCaulking,
      caulking,
      shingles
    );
    const y = await this.general.calculatePiecesCost(
      measures.misc_spary_paint_pc,
      spray,
      shingles
    );

    const expenses_poor_access = await this.general.getConstValue('expenses_poor_access');
    const z = await this.general.addExpense(
      measures.misc_poor_access_dll,
      expenses_poor_access,
      expenses,
      shingles
    );

    const expenses_miscellaneous = await this.general.getConstValue('expenses_miscellaneous');
    const w = await this.general.addExpense(
      measures.misc_miscellaneous_dll,
      expenses_miscellaneous,
      expenses,
      shingles
    );

    const expenses_permit = await this.general.getConstValue('expenses_permit');
    const v = await this.general.addExpense(
      measures.misc_permit_dll,
      expenses_permit,
      expenses,
      shingles
    );

    const expenses_contingency_fund = await this.general.getConstValue('expenses_contingency_fund');
    const u = await this.general.addExpense(
      measures.misc_contingency_fund_dll,
      expenses_contingency_fund,
      expenses,
      shingles
    );


    const t = await this.calculateOutTownExpenses(measures, expenses, shingles);
    let miscellaneousCalculations = [].concat(x, y, z, w, v, u, t);
    miscellaneousCalculations = miscellaneousCalculations.filter(Boolean);
    return miscellaneousCalculations;
  };

  getChimneyCaulking(measures: PsbMeasures) {
    const hasCutSidding = measures?.psb_chimneys?.filter(x => !x.deletedAt)?.some(x => x.need_cutsidding) ?? false;
    return hasCutSidding ? 1 : 0;
  }

  async calculateOutTownExpenses(measures: PsbMeasures, expenses, shingles) {
    let rooms = 1;
    const generals_hotel_id = await this.general.getConstDecimalValue('generals_hotel_id');
    if ((measures.out_id_loding_type == generals_hotel_id)) {
      rooms = Math.ceil(measures.out_estimated_roofers_qty / 2);
    }
    const cost = measures.out_estimated_days_days * rooms * measures.out_loding_rate_dll;

    const generals_perdium_per_day = await this.general.getConstDecimalValue('generals_perdium_per_day');
    const perdiumCost =
      measures.out_estimated_days_days *
      measures.out_estimated_roofers_qty *
      generals_perdium_per_day;

    const expenses_lodging = await this.general.getConstValue('expenses_lodging');
    const lodging = await this.general.addExpense(
      cost,
      expenses_lodging,
      expenses,
      shingles
    );

    const expenses_additional_fuel = await this.general.getConstValue('expenses_additional_fuel');
    const fuel = await this.general.addExpense(
      measures.out_additional_fuel_dll,
      expenses_additional_fuel,
      expenses,
      shingles
    );

    const expenses_perdium = await this.general.getConstValue('expenses_perdium');
    const perdium = await this.general.addExpense(
      perdiumCost,
      expenses_perdium,
      expenses,
      shingles
    );

    //crickets_additional_cost
    let crickets_additional_cost_total = 0;
    if (measures.psb_crickets && measures.psb_crickets.length > 0) {
        crickets_additional_cost_total = measures.psb_crickets.reduce((accumulator, current) => {
          return accumulator + current.aditional_cost;
        }, 0);
    }
    const expenses_crickets_additional_cost = await this.general.getConstValue('expenses_crickets_additional_cost');
    const cricketsAdditionalCost = await this.general.addExpense(
        crickets_additional_cost_total,
      expenses_crickets_additional_cost,
      expenses,
      shingles
    );

    //chimneys_additional_cost
    let chimneys_additional_cost_total = 0;
    if (measures.psb_chimneys && measures.psb_chimneys.length > 0) {
        chimneys_additional_cost_total = measures.psb_chimneys.reduce((accumulator, current) => {
          return accumulator + current.aditional_cost;
        }, 0);
    }
    const expenses_chimneys_additional_cost = await this.general.getConstValue('expenses_chimneys_additional_cost');
    const chimneysAdditionalCost = await this.general.addExpense(
        chimneys_additional_cost_total,
      expenses_chimneys_additional_cost,
      expenses,
      shingles
    );

    //skylights_additional_cost
    let skylights_additional_cost_total = 0;
    if (measures.psb_skylights && measures.psb_skylights.length > 0) {
        skylights_additional_cost_total = measures.psb_skylights.reduce((accumulator, current) => {
          return Number(accumulator) + Number(current.aditional_cost);
        }, 0);
    }

    const expenses_skylights_additional_cost = await this.general.getConstValue('expenses_skylights_additional_cost');
    const skylightsAdditionalCost = await this.general.addExpense(
        skylights_additional_cost_total,
      expenses_skylights_additional_cost,
      expenses,
      shingles
    );

    const outTownCalculations = [].concat(lodging, fuel, perdium, cricketsAdditionalCost, chimneysAdditionalCost, skylightsAdditionalCost);
    return outTownCalculations;
  };
}
