import { Injectable } from '@angular/core';
import { InspectorCostType } from 'src/app/models/inspector-cost-type.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { PsbSelectedMaterial } from 'src/app/models/psb_selected_material.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {

  constructor(
    private catalogs: CatalogsService
  ) { }

  async calculateSiddingNailsCostUpgrade(lf: any, materialList: any, shingles: any, id_upgrade: any, measures: any): Promise<any> {
    let concept = 'Costo de Upgrade ';
    let concept_type = 'Upgrade';
    const concept_types_upgrade = await this.getConstValue('concept_types_upgrade');
    const category_coil_nails_sidding = await this.getConstValue('category_coil_nails_sidding');
    const category_coil_nails_1_1_4 = await this.getConstValue('category_coil_nails_1_1_4');
    let idConceptType = concept_types_upgrade;
    concept = 'Costo de Clavos para Upgrade ';
    let calc = [];
    const category = parseInt(await this.getConstValue('category_ridgevents'));
    for (const shingle of shingles) {
      let material = this.getSelectedMaterial(
        materialList,
        measures,
        category,
        shingle
      );
      if (!material || material.length == 0) {
        continue;
      } else {
        material = material[0];
      }
      if (material.size < 10) {
        material = this.getMaterial(materialList, category_coil_nails_1_1_4);
      } else {
        material = this.getMaterial(materialList, category_coil_nails_sidding);
      }

      if (!material || material.length == 0) {
        continue;
      } else {
        material = material[0];
      }

      const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
      newCalc.lf = this.parseNumber(lf);
      newCalc.coverage = this.parseNumber(material.coverage_lf);
      newCalc.coverage_description = this.getCoverageDescription(material);
      newCalc.qty = Math.ceil(lf / newCalc.coverage);
      newCalc.calculation_type = concept + material.material;
      newCalc.category = material.category;
      newCalc.id_material_category = material.id_material_category;
      newCalc.concept = material.material;
      newCalc.concept_type = concept_type;
      newCalc.id_concept_type = idConceptType;
      newCalc.id_concept = material.id;
      newCalc.cost = material.cost;
      newCalc.id_material_type = material.id_material_type;
      newCalc.is_final = true;
      newCalc.unit = material.unit;
      newCalc.unit_abbrevation = material.abbreviation;
      newCalc.value = material.cost * newCalc.qty;
      newCalc.id_material_price_list = material.id_material_price_list;
      newCalc.id_price_list = material.id_price_list;
      newCalc.id_upgrade = id_upgrade;
      newCalc.sqlf = lf;
      const newMaterial = JSON.parse(JSON.stringify(newCalc));
      newMaterial.id_material_type_shingle = shingle.id_material_type;
      calc.push(newMaterial);

    }
    return calc;
  }

  getCoverageDescription(material: any): string {
    const sq = (material.coverage_sq ? `${material.coverage_sq} sq` : '');
    const lf = (material.coverage_lf ? `${material.coverage_lf} lf` : '');
    if (sq == '' || lf == '') {
      return sq + lf;
    } else {
      return `${sq}/${lf}`;
    }
  }

  async calculatePiecesCostJustOneShingle(pieces, material, shingle, sqlf) {
    const calc = [];
    const concept_types_material = await this.getConstValue('concept_types_material');
    //if (!pieces) return null;
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.qty = Math.ceil(pieces);
    newCalc.calculation_type = 'Costo de ' + material.material;
    newCalc.category = material.category;
    newCalc.id_material_category = material.id_material_category;
    //newCalc.material = material.material;
    newCalc.concept = material.material;
    newCalc.concept_type = 'Material';
    newCalc.id_concept_type = concept_types_material;
    newCalc.id_concept = material.id;
    newCalc.cost = material.cost;
    newCalc.coverage = material.coverage_sq;
    newCalc.coverage_description = this.getCoverageDescription(material);
    newCalc.id_material_type = material.id_material_type;
    //newCalc.id_material = material.id;
    newCalc.is_final = true;
    newCalc.unit = material.unit;
    newCalc.unit_abbrevation = material.abbreviation;
    newCalc.value = material.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.id_trademark = material.id_trademark;
    newCalc.sqlf = sqlf;
    newCalc.sq = sqlf;
    const newMaterial = JSON.parse(JSON.stringify(newCalc));
    newMaterial.id_material_type_shingle = shingle.id_material_type;
    calc.push(newMaterial);
    return calc;
  };

  async calculatePiecesCost(pieces, material, shingles, addCoverageUnit = true) {
    const calc = [];
    const concept_types_material = await this.getConstValue('concept_types_material');
    //if (!pieces) return null;
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.qty = Math.ceil(pieces);
    newCalc.calculation_type = 'Costo de ' + material.material;
    newCalc.category = material.category;
    newCalc.id_material_category = material.id_material_category;
    //newCalc.material = material.material;
    newCalc.concept = material.material;
    newCalc.concept_type = 'Material';
    newCalc.id_concept_type = concept_types_material;
    newCalc.id_concept = material.id;
    newCalc.cost = material.cost;
    newCalc.coverage = material.coverage_sq;
    newCalc.coverage_description = addCoverageUnit ? this.getCoverageDescription(material) : material.coverage_sq ?? material.coverage_lf;
    newCalc.id_material_type = material.id_material_type;
    //newCalc.id_material = material.id;
    newCalc.is_final = true;
    newCalc.unit = material.unit;
    newCalc.unit_abbrevation = material.abbreviation;
    newCalc.value = material.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.id_trademark = material.id_trademark;
    for (const shingle of shingles) {
      const newMaterial = JSON.parse(JSON.stringify(newCalc));
      newMaterial.id_material_type_shingle = shingle.id_material_type;
      calc.push(newMaterial);
    }
    return calc;
  };

  async calculatePiecesCostCustom(skylights, material, shingles, addCoverageUnit = true) {
    const calc = [];
    const concept_types_material = await this.getConstValue('concept_types_material');
    for (const skylight of skylights) {
        const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        newCalc.qty = skylight.custom_qty;
        newCalc.calculation_type = 'Costo de ' + material.material;
        newCalc.category = material.category;
        newCalc.id_material_category = material.id_material_category;
        newCalc.concept = `${skylight.skylights} ${skylight.width} x ${skylight.lenght}`;
        newCalc.concept_type = 'Material';
        newCalc.id_concept_type = concept_types_material;
        newCalc.id_concept = material.id;
        newCalc.cost = skylight.custom_cost;
        newCalc.coverage = 1;
        newCalc.coverage_description = '1 pc';
        newCalc.id_material_type = material.id_material_type;
        //newCalc.id_material = material.id;
        newCalc.is_final = true;
        newCalc.unit = material.unit;
        newCalc.unit_abbrevation = material.abbreviation;
        newCalc.value = Number(skylight.custom_qty)*Number(skylight.custom_cost);
        newCalc.id_material_price_list = null;
        newCalc.id_price_list = null;
        newCalc.id_trademark = null;
        for (const shingle of shingles) {
        const newMaterial = JSON.parse(JSON.stringify(newCalc));
        newMaterial.id_material_type_shingle = shingle.id_material_type;
        calc.push(newMaterial);
        }
    }

    return calc;
  };

  async calculateLFCoverageCost(lf, material, shingles) {
    const calc = [];
    const concept_types_material = await this.getConstValue('concept_types_material');
    //if (!pieces) return null;
    if (!material) return [];
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.lf = lf;
    newCalc.coverage = material.coverage_lf;
    newCalc.coverage_description = this.getCoverageDescription(material);
    newCalc.qty = Math.ceil(lf / newCalc.coverage);
    newCalc.calculation_type = 'Costo de ' + material.material;
    newCalc.category = material.category;
    newCalc.id_material_category = material.id_material_category;
    //newCalc.material = material.material;
    newCalc.concept = material.material;
    newCalc.concept_type = 'Material';
    newCalc.id_concept_type = concept_types_material;
    newCalc.id_concept = material.id;
    newCalc.cost = material.cost;
    newCalc.id_material_type = material.id_material_type;
    //newCalc.id_material = material.id;
    newCalc.is_final = true;
    newCalc.unit = material.unit;
    newCalc.unit_abbrevation = material.abbreviation;
    newCalc.value = material.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.id_trademark = material.id_trademark;
    newCalc.sqlf = lf;
    for (const shingle of shingles) {
      const newMaterial = JSON.parse(JSON.stringify(newCalc));
      newMaterial.id_material_type_shingle = shingle.id_material_type;
      calc.push(newMaterial);
    }
    return calc;
  }

  async calculateLFCoverageCostJustOneShingle(lf, material, shingle) {
    const concept_types_material = await this.getConstValue('concept_types_material');
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.lf = lf;
    newCalc.coverage = material.coverage_lf;
    newCalc.coverage_description = this.getCoverageDescription(material);
    newCalc.qty = Math.ceil(lf / newCalc.coverage);
    newCalc.calculation_type = 'Costo de ' + material.material;
    newCalc.category = material.category;
    newCalc.id_material_category = material.id_material_category;
    newCalc.concept = material.material;
    newCalc.concept_type = 'Material';
    newCalc.id_concept_type = concept_types_material;
    newCalc.id_concept = material.id;
    newCalc.cost = material.cost;
    newCalc.id_material_type = material.id_material_type;
    newCalc.is_final = true;
    newCalc.unit = material.unit;
    newCalc.unit_abbrevation = material.abbreviation;
    newCalc.value = material.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.sqlf = lf;
    newCalc.id_trademark = material.id_trademark;
    newCalc.id_material_type_shingle = shingle.id_material_type;
    return newCalc;
  };

  async calculateSQCoverageCost(sq, material, shingles) {
    const calc = [];
    const concept_types_material = await this.getConstValue('concept_types_material');
    //if (!pieces) return null;
    if (!material) return [];
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.sq = sq;
    newCalc.coverage = material.coverage_sq;
    newCalc.coverage_description = this.getCoverageDescription(material);
    newCalc.qty = Math.ceil(sq / newCalc.coverage);
    newCalc.calculation_type = 'Costo de ' + material.material;
    newCalc.category = material.category;
    newCalc.id_material_category = material.id_material_category;
    //newCalc.material = material.material;
    newCalc.concept = material.material;
    newCalc.concept_type = 'Material';
    newCalc.id_concept_type = concept_types_material;
    newCalc.id_concept = material.id;
    newCalc.cost = material.cost;
    newCalc.id_material_type = material.id_material_type;
    //newCalc.id_material = material.id;
    newCalc.is_final = true;
    newCalc.unit = material.unit;
    newCalc.unit_abbrevation = material.abbreviation;
    newCalc.value = material.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.sqlf = sq;
    newCalc.id_trademark = material.id_trademark;
    for (const shingle of shingles) {
      const newMaterial = JSON.parse(JSON.stringify(newCalc));
      newMaterial.id_material_type_shingle = shingle.id_material_type;
      calc.push(newMaterial);
    }
    return calc;
  };

  async calculateSQCoverageCostJustOneShingle(sq, material, shingle) {
    const concept_types_material = await this.getConstValue('concept_types_material');
    if (!material) return null;
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.sq = sq;
    newCalc.coverage = material.coverage_sq;
    newCalc.coverage_description = this.getCoverageDescription(material);
    newCalc.qty = Math.ceil(sq / newCalc.coverage);
    newCalc.calculation_type = 'Costo de ' + material.material;
    newCalc.category = material.category;
    newCalc.id_material_category = material.id_material_category;
    newCalc.concept = material.material;
    newCalc.concept_type = 'Material';
    newCalc.id_concept_type = concept_types_material;
    newCalc.id_concept = material.id;
    newCalc.cost = material.cost;
    newCalc.id_material_type = material.id_material_type;
    newCalc.is_final = true;
    newCalc.unit = material.unit;
    newCalc.unit_abbrevation = material.abbreviation;
    newCalc.value = material.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.sqlf = sq;
    newCalc.id_trademark = material.id_trademark;
    newCalc.id_material_type_shingle = shingle.id_material_type;

    return newCalc;
  };

  getMaterial = (materials, category) => {
    const selectedMaterial = materials.filter(
      (material) => {
        return (+material?.id_material_category) == (+category)
      }
    );
    return selectedMaterial;
  };

  getFirstMaterial = (materials, category) => {
    return materials.find(material => (+material?.id_material_category) == (+category));
  };

  async addExpense(cost, idExpense, expenses, shingles) {
    const calc = [];
    const concept_types_expenses = await this.getConstValue('concept_types_expenses');
    const expense = this.getExpense(expenses, idExpense)[0];
    //if (!pieces) return null;
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.qty = 1;
    newCalc.calculation_type = 'Costo de ' + expense.concept;
    newCalc.concept = expense.concept;
    newCalc.concept_type = 'Expense';
    newCalc.id_concept_type = concept_types_expenses;
    newCalc.id_concept = expense.id;
    newCalc.cost = cost;
    newCalc.is_final = true;
    newCalc.value = cost;
    newCalc.unit_abbrevation = 'DLL';
    newCalc.unit = 'DOLLARS';
    for (const shingle of shingles) {
      const newExpense = JSON.parse(JSON.stringify(newCalc));
      newExpense.id_material_type_shingle = shingle.id_material_type;
      calc.push(newExpense);
    }
    return calc;
  };

  getExpense = (expenses, id) => {
    const selectedExpenses = expenses.filter((expense) => expense.id == id);
    return selectedExpenses;
  };

  calculateLowAndSteepLsopesSQ = (slopes, wasting) => {
    if (slopes == null) return 0;

    //let onlySlopesLowSteep = slopes.filter(getOnlySlopesLowSteep);
    let lowSteepSlopesSQ = 0;

    const onlySlopesLowSteep = slopes.filter(this.getOnlySlopesLowSteep);

    for (const slope of onlySlopesLowSteep) {
      lowSteepSlopesSQ += this.calculateSlopesSQ(slope, wasting);
    }
    return lowSteepSlopesSQ;
  };

  calculateFlatRoofSQ = (slopes, wasting) => {
    if (slopes == null) return 0;
    let flatRoofSQ = 0;
    const onlyFlatRoof = slopes.filter(this.getOnlyFlatRoof);
    for (const slope of onlyFlatRoof) {
      flatRoofSQ += this.calculateSlopesSQ(slope, wasting);
    }
    return flatRoofSQ;
  };

  calculateSlopesSQObs = (slope, wasting) => {
    const res = (1 + wasting) * slope.osb_area;
    return parseFloat(res.toFixed(2));
  };
  calculateSlopesSQ = (slope, wasting) => {
    let res = (1 + (wasting / 100));
    res = res * slope.shingle_area;
    return parseFloat(res.toFixed(2));
  };

  getOnlySlopesLowSteep = (slope) => {
    return slope.pitch >= 3 && slope.deletedAt == null;
  };

  getOnlySteepSlopes = (slope) => {
    return slope.pitch >= 4 && slope.deletedAt == null;
  };

  getOnlyFlatRoof = (slope) => {
    return slope.pitch < 3 && slope.deletedAt == null;
  };

  getOnlyLowSlopes = (slope) => {
    return slope.pitch >=3 && slope.pitch < 4.0 && slope.deletedAt == null;
  };

  calculateLowSlopeSQ = (slopes, wasting) => {
    if (slopes == null) return 0;

    //let onlySlopesLowSteep = slopes.filter(getOnlySlopesLowSteep);
    let lowSlopesSQ = 0;

    const onlySlopesLowSlopes = slopes.filter(this.getOnlyLowSlopes);
    for (const slope of onlySlopesLowSlopes) {
      lowSlopesSQ += this.calculateSlopesSQ(slope, wasting);
    }
    return lowSlopesSQ;
  };

  calculateSteepLsopesSQ = (slopes, wasting) => {
    if (slopes == null) return 0;

    let steepSlopesSQ = 0;

    const onlySteepSlopes = slopes.filter(this.getOnlySteepSlopes);

    for (const slope of onlySteepSlopes) {
      steepSlopesSQ += this.calculateSlopesSQ(slope, wasting);
    }
    return steepSlopesSQ;
  };

  async calculateCostJustOneShingle(sq, material, shingle) {
    const calc = [];
    const concept_types_material = await this.getConstValue('concept_types_material');
    //if (!pieces) return null;
    const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.sq = sq;
    newCalc.coverage = material.coverage_sq;
    newCalc.coverage_description = this.getCoverageDescription(material);
    newCalc.qty = Math.ceil(sq / newCalc.coverage);
    newCalc.calculation_type = 'Costo de ' + material.material;
    newCalc.category = material.category;
    newCalc.id_material_category = material.id_material_category;
    //newCalc.material = material.material;
    newCalc.concept = material.material;
    newCalc.concept_type = 'Material';
    newCalc.id_concept_type = concept_types_material;
    newCalc.id_concept = material.id;
    newCalc.cost = material.cost;
    newCalc.id_material_type = material.id_material_type;
    //newCalc.id_material = material.id;
    newCalc.is_final = true;
    newCalc.unit = material.unit;
    newCalc.unit_abbrevation = material.abbreviation;
    newCalc.value = material.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.sqlf = sq;
    newCalc.id_trademark = material.id_trademark;
    newCalc.id_material_type_shingle = shingle.id_material_type;
    calc.push(newCalc);
    return calc;
  };

  async calculateRidgeventsCost(lf, materials, measures, category, shingles) {
    const calc = [];
    const upgrade_ridgevents = await this.getConstValue('upgrade_ridgevents');
    const cost_integration_built_in = await this.getConstValue('cost_integration_built_in');
    const cost_integration_upgrade = await this.getConstValue('cost_integration_upgrade');
    const concept_types_upgrade = await this.getConstValue('concept_types_upgrade');
    const concept_types_material = await this.getConstValue('concept_types_material');

    const psb_upgrade = measures.psb_upgrades?.find((upgrade) => {
      return (
        upgrade.id_upgrade == upgrade_ridgevents &&
        (upgrade.id_cost_integration == cost_integration_built_in ||
          upgrade.id_cost_integration == cost_integration_upgrade)
      );
    });

    const psb_upgrades = measures.psb_upgrades.filter((upgrade) => {
      return (
        upgrade.id_upgrade == upgrade_ridgevents &&
        upgrade.id_cost_integration == cost_integration_upgrade
      );
    });

    let concept = 'Costo de ';
    let concept_type = 'Material';
    let idConceptType = concept_types_material;
    let id_upgrade = null;

    await this.getRidgeCalculations(shingles, materials, measures, category, lf, concept, concept_type, idConceptType, id_upgrade, calc);

    if (psb_upgrades && psb_upgrades.length > 0) {
      concept = 'Costo de Upgrade ';
      concept_type = 'Upgrade';
      idConceptType = concept_types_upgrade;
      id_upgrade = psb_upgrades[0].id_upgrade;
      await this.getRidgeCalculations(shingles, materials, measures, category, lf, concept, concept_type, idConceptType, id_upgrade, calc);
    }

    return calc;
  };

  private async getRidgeCalculations(shingles: any, materials: any, measures: any, category: any, lf: any, concept: string, concept_type: string, idConceptType: string, id_upgrade: any, calc: any[]) {
    for (const shingle of shingles) {
      let material = await this.getSelectedRidgeMaterial(
        materials,
        measures,
        category,
        shingle
      );
      if (!material) {
        continue;
      }

      const newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
      newCalc.lf = lf;
      newCalc.coverage = material.coverage_lf;
      newCalc.coverage_description = this.getCoverageDescription(material);
      newCalc.qty = Math.ceil(lf / newCalc.coverage);
      newCalc.calculation_type = concept + material.material;
      newCalc.category = material.category;
      newCalc.id_material_category = material.id_material_category;
      newCalc.concept = material.material;
      newCalc.concept_type = concept_type;
      newCalc.id_concept_type = idConceptType;
      newCalc.id_concept = material.id;
      newCalc.cost = material.cost;
      newCalc.id_material_type = material.id_material_type;
      newCalc.is_final = true;
      newCalc.unit = material.unit;
      newCalc.unit_abbrevation = material.abbreviation;
      newCalc.value = material.cost * newCalc.qty;
      newCalc.id_material_price_list = material.id_material_price_list;
      newCalc.id_price_list = material.id_price_list;
      newCalc.id_upgrade = id_upgrade;
      newCalc.id_trademark = material.id_trademark;
      newCalc.sqlf = lf;
      const newMaterial = JSON.parse(JSON.stringify(newCalc));
      newMaterial.id_material_type_shingle = shingle.id_material_type;
      calc.push(newMaterial);
      // const newLabor = await this.ridge.calcRidgeventLabor(
      //   newMaterial,
      //   'Costo de Labor Ridgevent ',
      //   'RIDGEVENT UPGRADE',
      //   concept_types_ridgevent_upgrade
      // );
      // calc.push(newLabor);
    }
  }

  async getSelectedRidgeMaterial(materials, measures: PsbMeasures, category, shingle) {
    const category_ridgecap = await this.getConstDecimalValue('category_ridgecap');
    const ridgecap_10 = await this.getConstDecimalValue('ridgecap_10_ridgevent_size_compatibility');
    const ridgecap_12 = await this.getConstDecimalValue('ridgecap_12_ridgevent_size_compatibility');

    if(!measures.psb_selected_materials){
        return null;
    }
    let materialSelected = measures.psb_selected_materials.find(
      (material) => {
        return (1 * material.id_trademark_shingle) == (1 * shingle.id_trademark) &&
          material?.id_material_category == category_ridgecap
      });

    if (!materialSelected) return null;

    const materialTypes = (await this.catalogs.getMeasuresMaterialTypes()).data;
    const materialType = materialTypes.find(x => x.id == materialSelected.id_material_type_selected);
    if (!materialType) return null;

    const ridgeVentSize = materialType.size == 10 ? ridgecap_10 : materialType.size == 12 ? ridgecap_12 : null;
    if (!ridgeVentSize) return null;

    const ridgevents = materials.filter((material) => material?.id_material_category == category);

    for (const ridge of ridgevents) {
      const ridgeType = materialTypes.find(x => x.id == ridge.id_material_type);
      if (ridgeType.size == ridgeVentSize) {
        return ridge;
      }
    }

    return null;
  }



  getSelectedMaterial = (materials, measures, category, shingle) => {
    let materialSelected = measures.psb_selected_materials.filter(
      (material) => {
        return (1 * material.id_trademark_shingle) == (1 * shingle.id_trademark) &&
          material?.id_material_category == category
      }
    );
    if (!materialSelected || materialSelected.length == 0) {
      const isShingleSelected = measures.psb_selected_materials.filter(
        (material) => {
          return (1 * material.id_trademark_shingle) == (1 * shingle.id_trademark)
        });
      if(isShingleSelected.length > 0){
        const inwShield = this.getMaterialNotFound(materials, measures, category, shingle);
        return inwShield;
      }else{
        return null;
      }
      //TODO: Revisar si se regresa el null en lugar del material not found
      //return null;
    } else {
      materialSelected = materialSelected[0];
    }
    let inwShield = materials.filter(
      (material) =>
        material?.id_material_category == category &&
        material.id_material_type == materialSelected.id_material_type_selected
    );
    if(!inwShield || inwShield.length == 0){
      inwShield = this.getMaterialNotFound(materials, measures, category, shingle);
    }
    return inwShield;
  }

  getMaterialNotFound(materials, measures, category, shingle){
    const material = {
      id: uuidv4(),
      id_material_category: category,
      id_material_type_selected: materials[0].id_material_type,
      id_psb_measure: measures.id,
      id_trademark_shingle: shingle.id_trademark,
      isModified: true,
      coverage: 0,
      coverage_description: '',
      qty: 0,
      calculation_type: 'Costo de material DESCONOCIDO',
      category:'',
    //newCalc.material = material.material;
      concept: 'Material no encontrado',
      concept_type: 'Material',
      id_concept_type: -1,
      id_concept: -1,
      cost: 0,
      id_material_type: materials[0].id_material_type,
      //newCalc.id_material = material.id;
      material: 'Material no encontrado',
      is_final: true,
      unit: '',
      unit_abbrevation: '',
      value: -1,
      id_material_price_list: 0,
      id_price_list: 0,
      sqlf: 0,
      id_trademark: shingle.id_trademark,
      id_material_type_shingle: shingle.id_material_type
    };
    return Array(material);
  }

  async getSelectedPriceLists(acceptanceDate) {
    const priceLists = (await this.catalogs.getPriceList())?.data;

    const selectedPriceList = priceLists.filter((priceList) => {
      const listDate = new Date(priceList.start_date);
      const plDate = listDate.getTime();
      return plDate <= acceptanceDate.getTime();
    });

    let result = [];
    const suppliers = (await this.catalogs.getSuppliers()).data;
    for (const supplier of suppliers) {
      let supplierList = selectedPriceList.filter(
        (list) => list.id_supplier == supplier.id
      );

      const maxDate = new Date(
        Math.max(...supplierList.map((o) => new Date(o.start_date).getTime()))
      );

      supplierList = selectedPriceList.filter((list) => {
        const startDate = new Date(list.start_date);
        if (
          list.id_supplier == supplier.id &&
          startDate.getTime() == maxDate.getTime()
        ) {
          return { ...list };
        }
      });
      result = result.concat(supplierList);
    }
    return result;
  };

  async getConstDecimalValue(key) {
    return +(await (this.getConstValue(key)));
  }

  async getConstValue(key) {
    return await this.catalogs.getGeneral().then(result => result.data.find(x => x.key == key).value);
  }

  convertFractionalToDecimal = (integerPart, fractionalPart) => {
    let decimalPart = eval(fractionalPart);
    if (decimalPart > 1) {
      decimalPart = decimalPart / 10;
    }
    return (1 * integerPart) + decimalPart;
  }

  calculateProfitComissionOverhead(value: number, cost: InspectorCostType) {
    const generalPorcentage = 100 - ((+cost.commision_porcentage)
      + (+cost.profit_porcentage)
      + (+cost.overhead_porcentage));

    const commission = (+cost.commision_porcentage / generalPorcentage) * value;
    const profit = (+cost.profit_porcentage / generalPorcentage) * value;
    const overhead = (+cost.overhead_porcentage / generalPorcentage) * value;

    return commission + profit + overhead;
  }

  plusWasting(sq, wasting) {
    const res = parseFloat((sq * (1 + (wasting * 0.01))).toFixed(3));
    return isNaN(res) ? 0 : res;
  }

  parseNumber(value): number {
    if (value && !isNaN(value)) {
      return parseFloat(value);
    }
    return 0;
  }

  truncateDecimals(value: number, decimals = 2) {
    const aux = this.parseNumber(value);
    return parseFloat(aux.toString().match(`^-?\\d+(?:\\.\\d{0,${decimals}})?`)[0]);
  }

  truncateTwoDecimals(value: number) {
    const aux = this.parseNumber(value);
    return parseFloat(aux.toFixed(2).match(`^-?\\d+(?:\\.\\d{0,2})?`)[0]);
  }
}
