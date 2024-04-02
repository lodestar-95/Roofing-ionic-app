import { Injectable } from '@angular/core';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';

@Injectable({
    providedIn: 'root',
})
export class RidgeCapUpgradeService {
    private materialList: any[];
    private upgrade_ridgecap: number;
    private concept_types_ridgecap_upgrade: number;

    constructor(private general: GeneralService,
        private shingle: ShinglesService,
        private catalogs: CatalogsService) {
    }

    public setMaterialList(value: any[]) {
        this.materialList = value;
    }

    async calculate(building: any, calculations: any[], costTypeId: any, inspectorTypeId: any) {
        const category_ridgecap = await this.general.getConstValue('category_ridgecap');
        const tax_percentage = await this.general.getConstDecimalValue('tax_percentage');
        const costIntegrationId = await this.getUpgradeCostIntegration(building);
        const material_type_hp_ridgecap = await this.general.getConstDecimalValue('material_type_hp_ridgecap');

        if (costIntegrationId == 3)
            return [];

        this.upgrade_ridgecap = await this.general.getConstDecimalValue('upgrade_ridgecap');
        this.concept_types_ridgecap_upgrade = await this.general.getConstDecimalValue('concept_types_ridgecap_upgrade');

        const inspectorCostType = (await this.catalogs.getInspectorCostTypes())?.data
            ?.find(cost => cost.id_cost_type == costTypeId && cost.id_inspector_type == inspectorTypeId);


        const shingles = await this.shingle.getShingles();

        const ridgecapCalculations = calculations.filter(x => x.id_material_category == category_ridgecap);
        let upgradeCalculations = [];
        for (const shingle of shingles) {
            let newMaterial;
            let ridgecapFlat;
            let ridgecapHP;
            let details = [];
            if (costIntegrationId == 1) {
                newMaterial = this.materialList.find(x => x.id_material_category == category_ridgecap &&
                    x.id_trademark == shingle.id_trademark && x.id_material_type == 22);

                ridgecapHP = ridgecapCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
                if (!ridgecapHP) continue;
                ridgecapFlat = { ...ridgecapHP };

                ridgecapFlat.concept = newMaterial.material;
                ridgecapFlat.cost = newMaterial.cost;
                ridgecapFlat.coverage_lf = newMaterial.coverage_lf;
                ridgecapFlat.qty = Math.ceil(ridgecapHP.sqlf / newMaterial.coverage_lf);
                ridgecapFlat.value = (ridgecapFlat.qty * ridgecapFlat.cost);
            } else {
                newMaterial = this.materialList.find(x => x.id_material_category == category_ridgecap &&
                    x.id_trademark == shingle.id_trademark && x.id_material_type == material_type_hp_ridgecap);

                ridgecapFlat = ridgecapCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
                if (!ridgecapFlat) continue;
                ridgecapHP = { ...ridgecapFlat };

                ridgecapHP.concept = newMaterial.material;
                ridgecapHP.cost = newMaterial.cost;
                ridgecapHP.coverage_lf = newMaterial.coverage_lf;
                ridgecapHP.qty = Math.ceil(ridgecapFlat.sqlf / newMaterial.coverage_lf);
                ridgecapHP.value = (ridgecapHP.qty * ridgecapHP.cost);
            }
            details.push(ridgecapHP);
            details.push(ridgecapFlat);
            details.push({ concept: 'RidgeCap HP Cost', value: ridgecapHP.value });
            details.push({ concept: 'RidgeCap Flat Cost', value: ridgecapFlat.value });

            const difference = ridgecapHP.value - ridgecapFlat.value;
            details.push({ concept: 'Material Difference', value: difference });

            const taxes = difference * tax_percentage / 100;
            details.push({ concept: 'Taxes', value: taxes });

            let total = difference + taxes;
            const extra = this.general.calculateProfitComissionOverhead(total, inspectorCostType);
            details.push({ concept: 'Profit Commision Overhead', value: extra });

            total += extra;
            details.push({ concept: 'Total', value: total });

            const upgrade = this.getUpgradeCalculation(total, shingle, costIntegrationId);
            upgrade.details = details;
            upgradeCalculations.push(upgrade);
        }

        return upgradeCalculations;
    }

    getUpgradeCostIntegration(building: any) {
        const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == this.upgrade_ridgecap);
        return upgrade && upgrade.id_cost_integration;
    }

    private getUpgradeCalculation(total, shingle, costIntegrationId) {
        const calculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        calculation.calculation_type = 'Costo de Upgrade';
        calculation.category = this.upgrade_ridgecap;
        calculation.concept = 'RidgeCap Upgrade';
        calculation.concept_type = 'RidgeCap Upgrade';
        calculation.id_concept_type = this.concept_types_ridgecap_upgrade;
        calculation.id_concept = null;
        calculation.cost = null;
        calculation.coverage = null;
        calculation.id_labor_type = null;
        calculation.is_final = true;
        calculation.unit = null;
        calculation.unit_abbrevation = null;
        calculation.value = total;
        calculation.id_material_price_list = null;
        calculation.id_price_list = null;
        calculation.id_material_type_shingle = shingle.id_material_type;
        calculation.id_cost_integration = costIntegrationId;

        return calculation;
    }
}