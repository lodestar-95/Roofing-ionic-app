import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';

@Injectable({
    providedIn: 'root',
})
export class WMetalWarrantyService {

    private materialList: any;

    constructor(
        private shingle: ShinglesService,
        private general: GeneralService,
        private catalogs: CatalogsService
    ) { }


    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building, calculations: any[], costTypeId, inspectorTypeId) {
        let upgradeCalculations = [];
        const upgrade_w_metal = await this.general.getConstValue('upgrade_w_metal');
        const concept_types_wmetal_upgrade = await this.general.getConstValue('concept_types_wmetal_upgrade');
        const category_w_metal = await this.general.getConstValue('category_w_metal');
        const costIntegrationId = await this.getCostIntegration(building);

        const wmetalCalculations = calculations.filter(x => x.id_material_category == category_w_metal);
        const baseCalculation = wmetalCalculations.find(x => x.sqlf > 0) ?? wmetalCalculations[0];
        const tax_percentage = await this.general.getConstDecimalValue('tax_percentage');

        const labor_category_w_metal = await this.general.getConstDecimalValue('labor_category_w_metal');
        const laborCalculations = calculations.filter(x => x.category == labor_category_w_metal);
        const baseLaborCalculation = laborCalculations.find(x => x.qty > 0) ?? laborCalculations[0];
        const labor_tax_percentage = await this.general.getConstDecimalValue('labor_tax_percentage');

        const inspectorCostType = (await this.catalogs.getInspectorCostTypes())?.data
            ?.find(cost => cost.id_inspector_type == inspectorTypeId && cost.id_cost_type == costTypeId);

        const category_architectural_regular = await this.general.getConstValue('category_architectural_regular_shingle');
        const allShingles = await this.shingle.getShingles();
        const shingles = allShingles.filter( x => x.id_material_category == category_architectural_regular);
        for (const shingle of shingles) {
            let difference = 0;
            let details = [];

            const materialCalculation = wmetalCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
            const previousCost = costIntegrationId == 1 ? 0 : (+materialCalculation.value ?? 0);
            const newCost = ((+baseCalculation.cost) * Math.ceil((+baseCalculation.sqlf) / (+baseCalculation.coverage)));

            //details.push({...materialCalculation, value: (materialCalculation.value ?? 0)});
            details.push(baseCalculation);

            details.push({ concept: 'Material Previous Cost', value: previousCost });
            details.push({ concept: 'Material New Cost', value: newCost });

            let materialDiff = newCost - previousCost;
            details.push({ concept: 'Material Difference', value: materialDiff });

            materialDiff = materialDiff * (100 + tax_percentage) / 100;
            details.push({ concept: 'Material + Taxes', value: materialDiff });

            const laborCalculation = laborCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
            const previosLaborCost = costIntegrationId == 1 ? 0 : (+laborCalculation.value ?? 0);
            const newLaborCost = (+baseLaborCalculation.value ?? 0);

            details.push({ concept: 'Labor Previous Cost', value: previosLaborCost });
            details.push({ concept: 'Labor New Cost', value: newLaborCost });

            let laborDiff = newLaborCost - previosLaborCost;
            details.push({ concept: 'Labor Difference', value: laborDiff });

            laborDiff = laborDiff * (100 + labor_tax_percentage) / 100;
            details.push({ concept: 'Labor + Taxes', value: laborDiff });

            difference = materialDiff + laborDiff;
            details.push({ concept: 'Total Material + Labor', value: difference });

            const extras = this.general.calculateProfitComissionOverhead(difference, inspectorCostType);
            details.push({ concept: 'Profit Commision Overhead', value: extras });

            difference += extras;
            details.push({ concept: 'Total', value: difference });

            const upgradeCalculation = this.getUpgradeCalculation(difference, shingle, upgrade_w_metal, concept_types_wmetal_upgrade);
            upgradeCalculation.id_cost_integration = costIntegrationId;
            upgradeCalculation.details = details;
            upgradeCalculations.push(upgradeCalculation);
        }

        return upgradeCalculations;
    }

    private async getCostIntegration(building: Building) {
        const upgrade_w_metal = await this.general.getConstDecimalValue('upgrade_w_metal');

        const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_w_metal);
        return upgrade && upgrade.id_cost_integration;
    }

    private getUpgradeCalculation(difference, shingle, upgrade_w_metal, concept_types_wmetal_upgrade) {
        const calculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        calculation.calculation_type = 'Costo de Upgrade';
        calculation.category = upgrade_w_metal;
        calculation.concept = 'WMetal Upgrade';
        calculation.concept_type = 'WMetal Upgrade';
        calculation.id_concept_type = concept_types_wmetal_upgrade;
        calculation.id_concept = null;
        calculation.cost = null;
        calculation.coverage = null;
        calculation.id_labor_type = null;
        calculation.is_final = true;
        calculation.unit = null;
        calculation.unit_abbrevation = null;
        calculation.value = difference;
        calculation.id_material_price_list = null;
        calculation.id_price_list = null;
        calculation.id_material_type_shingle = shingle.id_material_type;

        return calculation;
    }
}
