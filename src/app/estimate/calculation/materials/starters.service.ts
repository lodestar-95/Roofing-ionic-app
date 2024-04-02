import { Injectable } from '@angular/core';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';

@Injectable({
  providedIn: 'root',
})
export class StartersService {
  private materialList: any;

  constructor(
    private shingle: ShinglesService,
    private general: GeneralService
  ) { }


  public setMaterialList(value: any) {
    this.materialList = value;
  }

  /**
   *
   * @param building
   * @returns
   */
  async calculateStarters(building) {
    const lowSlope = building?.psb_measure?.eves_starters_lf_low_slope ?? 0;
    const steepSlope = building?.psb_measure?.eves_starters_lf_steep_slope ?? 0;
    const lfStarters = lowSlope + steepSlope;
    return await this.calculatestarterCalculation(lfStarters);
  };

  /**
   *
   * @param lfStarters
   * @returns
   */
  async calculatestarterCalculation(lfStarters) {
    let starterCalculations = [];
    let starters: any = await this.getStarters();
    let shingles = await this.shingle.getShingles();
    const concept_types_material = await this.general.getConstValue('concept_types_material');

    for (let shingle of shingles) {

      const category_architectural_regular_shingle = await this.general.getConstValue('category_architectural_regular_shingle');
      const category_architectural_thick_shingle = await this.general.getConstValue('category_architectural_thick_shingle');
      const category_starters = await this.general.getConstValue('category_starters');
      /*
              if (
                (shingle.id_material_category == category_architectural_regular_shingle
                  || shingle.id_material_category == category_architectural_thick_shingle)
                && starter.id_material_category == category_presidential_starters
              ) {
                continue;
              }
              */
      let trademarkStarter;
      if (shingle.id_material_category == category_architectural_regular_shingle
        || shingle.id_material_category == category_architectural_thick_shingle) {
        trademarkStarter = starters.filter(starter => {
          return starter.id_material_category == category_starters
            && starter.id_trademark == shingle.id_trademark
        });
      } else {
        trademarkStarter = starters.filter(starter => {
          return starter.id_trademark == shingle.id_trademark
        });
      }
      if (!trademarkStarter || trademarkStarter.length == 0) {
        continue;
      }
      for (let starter of trademarkStarter) {
        let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        newCalc.qty = Math.ceil(lfStarters / starter.coverage_lf);
        newCalc.calculation_type = 'Costo de starters';
        newCalc.id_material_category = starter.id_material_category;
        newCalc.category = starter.material_category;
        newCalc.concept = starter.material;
        newCalc.concept_type = 'Material';
        newCalc.id_concept_type = concept_types_material;
        newCalc.cost = starter.cost;
        newCalc.coverage = starter.coverage_lf;
        newCalc.coverage_description = this.general.getCoverageDescription(starter);
        newCalc.id_material_type = starter.id_material_type;
        newCalc.id_concept = starter.id;
        newCalc.is_final = true;
        newCalc.unit = starter.unit;
        newCalc.unit_abbrevation = starter.abbreviation;
        newCalc.value = starter.cost * newCalc.qty;
        newCalc.id_material_price_list = starter.id_material_price_list;
        newCalc.id_price_list = starter.id_price_list;
        newCalc.id_trademark = starter.id_trademark;
        newCalc.sqlf = lfStarters;
        newCalc.id_material_type_shingle = shingle.id_material_type;
        starterCalculations.push(newCalc);
      }
    }
    return starterCalculations;
  };

  /**
   *
   * @returns
   */
  async getStarters() {
    const category_starters = await this.general.getConstValue('category_starters');
    const category_presidential_starters = await this.general.getConstValue('category_presidential_starters');
    const starters = this.materialList
      .filter(
        (material) =>
          material?.id_material_category == category_starters ||
          material?.id_material_category == category_presidential_starters
      );
    return starters;
  };
}
