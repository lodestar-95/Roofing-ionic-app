import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA, ERRORS } from '../const';
import { DmetalService } from '../materials/dmetal.service';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
import { StartersService } from '../materials/starters.service';

@Injectable({
    providedIn: 'root',
})
export class WindWarrantyService {

    constructor(
        private shingle: ShinglesService,
        private general: GeneralService,
        private dmetal: DmetalService,
        private catalogs: CatalogsService,
        private starterService: StartersService
    ) { }

    async calculate(building: Building, materialCalculations, costTypeId, inspectorTypeId) {
        const category_coil_nails_1 = await this.general.getConstValue('category_coil_nails_1');
        const category_coil_nails_1_1_4 = await this.general.getConstValue('category_coil_nails_1_1_4');
        const nailsCalculations = materialCalculations.filter(x => x.id_material_category == category_coil_nails_1 || x.id_material_category == category_coil_nails_1_1_4)

        return await this.calculateWindWarrantyUpgrade(building, nailsCalculations, costTypeId, inspectorTypeId);
    }

    private async calculateWindWarrantyUpgrade(building: Building, nailsCalculations, costTypeId, inspectorTypeId) {
        const costIntegrationId = await this.getCostIntegration(building);

        let calculations = [];
        const coverage_nails_wind_warranty = await this.general.getConstDecimalValue('coverage_nails_wind_warranty');
        const upgrade_wind_warranty_id = await this.general.getConstValue('upgrade_wind_warranty');
        const concept_types_wind_warranty_upgrade = await this.general.getConstValue('concept_types_wind_warranty_upgrade');
        const tax_percentage = await this.general.getConstDecimalValue('tax_percentage');

        const inspectorCostType = (await this.catalogs.getInspectorCostTypes())?.data
            ?.find(cost => cost.id_inspector_type == inspectorTypeId && cost.id_cost_type == costTypeId);

        const starters = await this.calculateStarters(building);

        const shingles = await this.shingle.getShingles();
        for (const shingle of shingles) {
            let details = [];

            let material = nailsCalculations
                ?.filter(x => x.id_material_type_shingle == shingle.id_material_type)
                ?.map(nail => {
                    details.push(nail);
                    const newQty = Math.ceil((this.parseNumber(nail.sqlf)) / (this.parseNumber(coverage_nails_wind_warranty)));
                    const newTotal = ((this.parseNumber(nail.cost)) * newQty);

                    const newNailCost = { ...nail, coverage: coverage_nails_wind_warranty, value: newTotal, qty: newQty };
                    details.push(newNailCost);

                    return newTotal - (this.parseNumber(nail.value));
                })
                ?.reduce((previous, current) => (this.parseNumber(previous)) + (this.parseNumber(current)), 0) ?? 0;

            const starterShingle = starters.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(starterShingle);

            material += starterShingle.value;
            details.push({ concept: 'Material', value: material });

            const difference = material * (100 + tax_percentage) / 100;
            details.push({ concept: 'Material + Taxes', value: material });

            const extra = this.general.calculateProfitComissionOverhead(difference, inspectorCostType);
            details.push({ concept: 'Profit Comission Overhead', value: extra });

            const total = difference + extra;
            details.push({ concept: 'Total', value: total });

            const upgradeCalculation = this.getUpgradeCalculation(total, shingle,
                upgrade_wind_warranty_id, concept_types_wind_warranty_upgrade);

            upgradeCalculation.id_cost_integration = costIntegrationId;
            upgradeCalculation.details = details;

            calculations.push(upgradeCalculation);
        }

        return calculations;
    }

    private async calculateStarters(building: Building) {
        const lowSlope = building?.psb_measure?.rakes_lf_low_steep_slope ?? 0;
        const steepSlope = building?.psb_measure?.rakes_lf_steep_slope ?? 0;
        const lfStarters = this.general.parseNumber(lowSlope) + this.general.parseNumber(steepSlope);
        //const lf = lfStarters * (1 + (building.psb_measure.wasting * 0.01));
        return await this.starterService.calculatestarterCalculation(lfStarters);
    }

    private parseNumber(value): number {
        if (value && !isNaN(value)) {
            return parseFloat(value);
        }
        return 0;
    }

    private async getCostIntegration(building: Building) {
        const upgrade_wind_warranty = await this.general.getConstDecimalValue('upgrade_wind_warranty');

        const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_wind_warranty);
        return upgrade && upgrade.id_cost_integration;
    }

    private getUpgradeCalculation(total, shingle, upgrade_wind_warranty_id, concept_types_wind_warranty_upgrade) {
        const calculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        calculation.calculation_type = 'Costo de Upgrade';
        calculation.category = upgrade_wind_warranty_id;
        calculation.concept = 'Wind Warranty Upgrade';
        calculation.concept_type = 'Wind Warranty Upgrade';
        calculation.id_concept_type = concept_types_wind_warranty_upgrade;
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

        return calculation;
    }
}
