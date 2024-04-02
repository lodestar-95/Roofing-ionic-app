import { Injectable } from '@angular/core';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';

@Injectable({
  providedIn: 'root',
})
export class RidgecapsService {
  private materialList: any;

  constructor(
    private shingle: ShinglesService,
    private general: GeneralService
  ) { }

  public setMaterialList(value: any) {
    this.materialList = value;
  }

  async calculateRidgecap(building) {
    const ridgeLf = building.psb_measure.ridge_lf;
    const hipsLf = building.psb_measure.hips_lf;
    const wasting = 1 + ((building.psb_measure.wasting * 0.01) / 2);
    const lfRidgeHips = (ridgeLf + hipsLf) * wasting;
    const builtInUpgrade = await this.getBuiltRidgeCapUpgrade(building);

    const ridgecapCalculation = await this.calculateRidgecapCalculation(
      lfRidgeHips,
      building.psb_measure.psb_selected_materials,
      builtInUpgrade
    );
    return ridgecapCalculation;
  }

  async getBuiltRidgeCapUpgrade(building: any) {
    const upgrade_ridgecap = await this.general.getConstDecimalValue('upgrade_ridgecap');
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');

    const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_ridgecap);
    return upgrade && upgrade.id_cost_integration == cost_integration_built_in;

  }

  async calculateRidgecapCalculation(lfRidgeHips, selectedMaterials, builtInUpgrade) {
    let ridgeCalculations = [];
    const category_ridgecap = await this.general.getConstValue('category_ridgecap');
    const concept_types_material = await this.general.getConstValue('concept_types_material');
    const material_type_hp_ridgecap = await this.general.getConstDecimalValue('material_type_hp_ridgecap');

    let shingles = await this.shingle.getShingles();
    for (let shingle of shingles) {
      let ridgecaps: any = await this.getRidgecapSelected(selectedMaterials, category_ridgecap, shingle, builtInUpgrade, material_type_hp_ridgecap);
      if (!ridgecaps || ridgecaps.length == 0) {
        continue;
      }
      let ridgecap = ridgecaps[0];
      let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
      //newCalc.id = "ASASASASAS";
      newCalc.qty = Math.ceil(lfRidgeHips / ridgecap.coverage_lf);
      newCalc.calculation_type = 'Costo de ridgecap';
      newCalc.id_material_category = ridgecap.id_material_category;
      newCalc.category = ridgecap.category;
      newCalc.concept = ridgecap.material;
      newCalc.concept_type = 'Material';
      newCalc.id_concept_type = concept_types_material;
      newCalc.cost = ridgecap.cost;
      newCalc.coverage = ridgecap.coverage_lf;
      newCalc.coverage_description = this.general.getCoverageDescription(ridgecap);
      newCalc.id_material_type = ridgecap.id_material_type;
      newCalc.id_concept = ridgecap.id;
      newCalc.id_material_category = category_ridgecap;
      newCalc.is_final = true;
      newCalc.unit = ridgecap.unit;
      newCalc.unit_abbrevation = ridgecap.abbreviation;
      newCalc.value = ridgecap.cost * newCalc.qty;
      newCalc.id_material_price_list = ridgecap.id_material_price_list;
      newCalc.id_price_list = ridgecap.id_price_list;
      newCalc.id_trademark = ridgecap.id_trademark;
      newCalc.sqlf = lfRidgeHips;
      let newRidgecap = JSON.parse(JSON.stringify(newCalc));
      try {
        //console.log(ridgecap.id_trademark_shingle + " == " + shingle.id_trademark)
        //if(ridgecap.id_trademark_shingle == shingle.id_trademark){
        newRidgecap.id_material_type_shingle = shingle.id_material_type;
        //selectedMaterials.filter(material => material.id_trademark_shingle == shingle.id_trademark)[0].id_material_type_selected;
        ridgeCalculations.push(newRidgecap);
        //}
      } catch {
        console.log(
          'Ridgecap not found for this shingle: ' + shingle.material
        );
      }
    }
    return ridgeCalculations;
  };

  async getRidgecapSelected(selectedMaterials, category_ridgecap, shingle, builtInUpgrade, material_type_hp_ridgecap) {
    const selectedRidgecaps = selectedMaterials?.filter(
      (material) => material?.id_material_category == category_ridgecap
        && material.id_trademark_shingle == shingle.id_trademark
    );

    if(!selectedRidgecaps){
      return;
    }

    const ids = builtInUpgrade ? [material_type_hp_ridgecap] : selectedRidgecaps.flatMap((ridge) => {
      return ridge.id_material_type_selected;
    });

    const ridgecaps = this.materialList.filter(
      (material) =>
      shingle.id_trademark == material.id_trademark &&
        material?.id_material_category == category_ridgecap &&
        ids.includes(material.id_material_type)
    );
    return ridgecaps;
  };
}
