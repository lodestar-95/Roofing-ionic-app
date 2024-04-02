import { Injectable } from '@angular/core';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
@Injectable({
  providedIn: 'root',
})
export class RidgeventsService {
  constructor(private catalogs: CatalogsService) { }

  /**
   *
   * @param material
   * @param concept
   * @param conceptType
   * @param idConceptType
   * @returns
   */
  async calcRidgeventLabor(material, concept, conceptType, idConceptType) {
    let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    const units = (await this.catalogs.getMaterialUnits()).data;
    const units_hours = await this.getConstDecimalValue('units_hours');
    const generals_ridgevents_cutin_labor = await this.getConstDecimalValue('generals_ridgevents_cutin_labor');
    const laborPrice = (await this.catalogs.getLaborPrices()).data
      .filter((x) => x.id == generals_ridgevents_cutin_labor)[0];

    newCalc.concept_type = material.concept_type;

    newCalc.lf = material.lf;
    newCalc.qty = Math.ceil(material.lf);
    newCalc.calculation_type = concept + material.material;
    newCalc.concept = concept;
    newCalc.concept_type = conceptType;
    newCalc.id_concept_type = idConceptType;
    newCalc.id_concept = material.id;
    newCalc.cost = laborPrice.price;
    newCalc.id_material_type = material.id_material_type;
    newCalc.is_final = true;
    let unit = units.filter((x) => x.id == units_hours)[0];
    newCalc.unit = unit.unit;
    newCalc.unit_abbrevation = unit.abbreviation;
    newCalc.value = newCalc.cost * newCalc.qty;
    newCalc.id_material_price_list = material.id_material_price_list;
    newCalc.id_price_list = material.id_price_list;
    newCalc.id_material_type_shingle = material.id_material_type_shingle;
    return newCalc;
  }

  async getConstDecimalValue(key) {
    return +(await (this.getConstValue(key)));
  }

  async getConstValue(key) {
    return await this.catalogs.getGeneral().then(result => result.data.find(x => x.key = key).value);
  }
}
