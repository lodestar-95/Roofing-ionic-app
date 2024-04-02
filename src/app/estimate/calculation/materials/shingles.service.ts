import { Injectable } from '@angular/core';
import { CALCULATION_SCHEMA, ERRORS } from '../const';
import { GeneralService } from './general.service';

@Injectable({
  providedIn: 'root',
})
export class ShinglesService {
  private materialList: any;

  constructor(
    private general: GeneralService
  ) {}

  public setMaterialList(value: any) {
    this.materialList = value;
  }

  /**
   *
   * @param building
   * @returns
   */
  async calculateShingles (building) {
    const wasting = building.psb_measure.wasting;
    if (building.psb_measure.psb_slopes == null) return ERRORS.NO_SLOPE;
    let lowSteepSlopesQS = this.general.calculateLowAndSteepLsopesSQ(
      building.psb_measure.psb_slopes,
      wasting
    );
    let shingleCalculation = await this.calculateShingleSlopes(lowSteepSlopesQS);
    return shingleCalculation;
  };

  /**
   *
   * @param sq
   * @returns
   */
  async calculateShingleSlopes (sq) {
    sq = Math.ceil(sq);
    const shingleCalculations = [];
    const shingles: any = await this.getShingles();
    const concept_types_material = await this.general.getConstValue('concept_types_material');
    for (const shingle of shingles) {
      const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
      //newCalc.id = "ASASASASAS";
      newCalc.qty = sq;
      newCalc.calculation_type = 'Costo de shingles';
      newCalc.category = shingle.material_category;
      newCalc.id_material_category = shingle.id_material_category;
      newCalc.concept = shingle.material;
      newCalc.concept_type = 'Material';
      newCalc.id_concept_type = concept_types_material;
      newCalc.cost = shingle.cost;
      newCalc.coverage = shingle.coverage_sq;
      newCalc.coverage_description = this.general.getCoverageDescription(shingle);
      newCalc.id_material_type = shingle.id_material_type;
      newCalc.id_material_type_shingle = shingle.id_material_type;
      newCalc.id_concept = shingle.id;
      newCalc.is_final = true;
      newCalc.unit = shingle.unit;
      newCalc.unit_abbrevation = shingle.abbreviation;
      newCalc.value = shingle.cost * newCalc.qty;
      newCalc.id_material_price_list = shingle.id_material_price_list;
      newCalc.id_price_list = shingle.id_price_list;
      newCalc.id_trademark = shingle.id_trademark;
      newCalc.sqlf = sq;

      shingleCalculations.push(newCalc);
    }
    return shingleCalculations;
  };

  /**
   *
   * @returns
   */
  async getShingles () {
    const category_architectural_regular_shingle = await this.general.getConstValue('category_architectural_regular_shingle');
    const category_architectural_thick_shingle = await this.general.getConstValue('category_architectural_thick_shingle');
    const category_presidential_shingle = await this.general.getConstValue('category_presidential_shingle');
    const category_presidential_tl_shingle = await this.general.getConstValue('category_presidential_tl_shingle');
    const shingles = this.materialList
      .filter(
        (material) =>
          material?.id_material_category == category_architectural_regular_shingle
          || material?.id_material_category == category_architectural_thick_shingle
          || material?.id_material_category == category_presidential_shingle
          || material?.id_material_category == category_presidential_tl_shingle
      );
    return shingles;
  };

  async getShinglesByType(idShingleCategory: string) {
    const category_architectural_regular_shingle = await this.general.getConstValue('category_architectural_regular_shingle');
    const category_architectural_thick_shingle = await this.general.getConstValue('category_architectural_thick_shingle');
    const category_presidential_shingle = await this.general.getConstValue('category_presidential_shingle');
    const category_presidential_tl_shingle = await this.general.getConstValue('category_presidential_tl_shingle');
    const shingles = this.materialList
      .filter(
        (material) =>
          material?.id_material_category === idShingleCategory
      );
    return shingles;
  };
}
