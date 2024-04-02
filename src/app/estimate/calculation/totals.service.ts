import { Injectable } from '@angular/core';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { GeneralService } from './materials/general.service';
import { ShinglesService } from './materials/shingles.service';

@Injectable({
  providedIn: 'root',
})
export class TotalsService {
  constructor(private shingle: ShinglesService,
    private catalogs: CatalogsService,
    private general: GeneralService) { }

  /**
   *
   * @param calculations
   * @param idConceptType
   * @returns
   */
  getSum(array, key, id_material_type, idConceptType) {
    let calcsByShingle = array.filter(
      (calc) => {
        return calc?.id_material_type_shingle == id_material_type &&
          calc?.id_concept_type == idConceptType
      }
    );
    return calcsByShingle.reduce((a, b) => (+a) + (+(b[key] || 0)), 0);
  };

  async calculateTotals(id_psb_measure, calculations, idConceptType, id_upgrade = null, tax_percentage = null) {
    let shingles = await this.shingle.getShingles();
    let totalsPerShingle = [];
    const id_cost_integration = calculations.find(x => x?.id_concept_type == idConceptType)?.id_cost_integration;

    for (let shingle of shingles) {
      let total = {
        subtotal: this.getSum(calculations,
          'value',
          shingle.id_material_type,
          idConceptType
        ),
        taxes: null,
        total: null,
        id_concept_type: idConceptType,
        id_material_type_shingle: shingle.id_material_type,
        id_psb_measure: id_psb_measure,
        id_upgrade: id_upgrade,
        id_cost_integration
      };

      const taxes_porcentage = tax_percentage != null ? tax_percentage : await this.general.getConstDecimalValue('generals_taxes_porcentage');
      total.taxes = total.subtotal * (taxes_porcentage / 100);
      total.total = total.taxes + total.subtotal;
      totalsPerShingle.push(total);
    }
    return totalsPerShingle;
  };

  getTotal = (totales: any, id_material_type_shingle) => {
    const registro = totales.filter(material => material.id_material_type_shingle == id_material_type_shingle);
    if (registro.length > 0) {
      return registro[0].total
    }
    return 0;
  };


  /**
   *
   * @param totals
   * @param id_version
   * @returns
   */
  async calculateFinalTotals(idPsbMeasure, materialTotals, laborTotals, expensesTotals, upgradesTotals, optionsTotal, id_version, inspectorTypeId: number) {
    let grandTotal = [];
    let total;
    let shingles = await this.shingle.getShingles();
    const labor_burdon_percentage = await this.general.getConstDecimalValue('labor_burdon_percentage');

    for (let shingle of shingles) {
      const materialTotal = this.getTotal(materialTotals, shingle.id_material_type);
      total = materialTotal;
      const laborTotal = this.getTotal(laborTotals, shingle.id_material_type);
      total += laborTotal;
      const laborBurdon = laborTotal * (labor_burdon_percentage / 100);
      total += laborBurdon;
      const otherExpenses = this.getTotal(expensesTotals, shingle.id_material_type);
      total += otherExpenses;
      total += this.getTotal(upgradesTotals, shingle.id_material_type);
      total += optionsTotal;
      //TODO: Reemplazar con el valor que venga en el usuario actual
      let extras = await this.calculateExtras(total, inspectorTypeId);
      for (let extra of extras) {
        const newTotal = {
          id: 1,
          material_total: materialTotal,
          labor_total: laborTotal,
          labor_burdon: laborBurdon,
          other_expenses: otherExpenses,
          subtotal: extra.subtotal,
          profit: extra.profit,
          commission: extra.commission,
          overhead: extra.overhead,
          options: optionsTotal,
          total: extra.total,
          id_cost_type: extra.id_cost_type,
          id_material_type_shingle: shingle.id_material_type,
          id_version: id_version,
          id_psb_measure: idPsbMeasure
        };
        grandTotal.push(newTotal);
      }
    }
    return grandTotal;
  };

  /**
   *
   * @param building
   * @returns
   */
  calculateOptions = (building) => {
    let options = building.psb_measure.psb_options;
    let id_psb_measure = building.psb_measure.id;
    return options?.filter((opt) => opt.id_psb_measure == id_psb_measure) ?? [];
  };

  async calculateExtras(subtotal: number, idInspectorType: number) {
    const inspectorCostTypes = (await this.catalogs.getInspectorCostTypes())?.data
      ?.filter(cost => cost.id_inspector_type == idInspectorType);

    let extras = []
    for (let cost of inspectorCostTypes) {
      const general_porcentage = 100 - ((+cost.commision_porcentage) + (+cost.profit_porcentage) + (+cost.overhead_porcentage));
      let totalCost = {
        subtotal: subtotal,
        commission: (+cost.commision_porcentage / general_porcentage) * subtotal,
        profit: (+cost.profit_porcentage / general_porcentage) * subtotal,
        overhead: (+cost.overhead_porcentage / general_porcentage) * subtotal,
        total: 0,
        id_cost_type: cost.id_cost_type
      };
      totalCost.total = totalCost.subtotal + totalCost.commission + totalCost.profit + totalCost.overhead;
      extras.push(totalCost);
    }
    return extras;

  }
}
