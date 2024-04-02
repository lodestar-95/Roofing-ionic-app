import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { InspectorCostType } from 'src/app/models/inspector-cost-type.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { VentingService } from '../labors/venting.service';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
import { VentingsService } from '../materials/ventings.service';

@Injectable({
    providedIn: 'root',
})
export class RidgeVentsService {

    private upgrade_ridgevents: any;
    private concept_types_ridgevent_upgrade: any;
    private shingles: any[];

    constructor(private shingeService: ShinglesService,
        private ventingMaterial: VentingsService,
        private ventingLabor: VentingService,
        private general: GeneralService,
        private catalogs: CatalogsService) {
    }

    async calculate(building: Building, calculations: any[], costTypeId, inspectorTypeId) {
        this.shingles = await this.shingeService.getShingles();
        this.upgrade_ridgevents = await this.general.getConstDecimalValue('upgrade_ridgevents');
        this.concept_types_ridgevent_upgrade = await this.general.getConstDecimalValue('concept_types_ridgevent_upgrade');
        const cost_integration_declined = await this.general.getConstDecimalValue('cost_integration_declined')

        const costIntegrationId = await this.getUpgradeCostIntegration(building);
        if (costIntegrationId == cost_integration_declined) {
            return [];
        }
        const hasAdvancedVentilation = this.hasBuildingAdvancedVentilation(building.psb_measure);

        const inspectorCostType = (await this.catalogs.getInspectorCostTypes())?.data
            ?.find(cost => cost.id_cost_type == costTypeId && cost.id_inspector_type == inspectorTypeId);

        if (hasAdvancedVentilation) {
            return await this.calculateRidgeVentWithAdvanceVentilation(building, inspectorCostType, costIntegrationId);
        } else {
            return await this.calculateRidgeVent(calculations, building, inspectorCostType, costIntegrationId);
        }
    }

    private async calculateRidgeVent(calculations: any[], building: Building, inspectorCostType: InspectorCostType, costIntegrationId) {
        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const category_metal_artict_vents = await this.general.getConstValue('category_metal_artict_vents');
        const category_power_vents = await this.general.getConstValue('category_power_vents');
        const category_solar_power_vents = await this.general.getConstValue('category_solar_power_vents');
        const concept_types_material = await this.general.getConstValue('concept_types_material');
        const concept_types_labor = await this.general.getConstValue('concept_types_labor');
        const labor_category_cut_in_new_vents = await this.general.getConstDecimalValue('labor_category_cut_in_new_vents');
        const labor_category_install_power_vent = await this.general.getConstDecimalValue('labor_category_install_power_vent');
        const labor_category_install_solar_power_vent = await this.general.getConstDecimalValue('labor_category_install_solar_power_vent');
        const category_ridgevents = await this.general.getConstValue('category_ridgevents');
        const concept_types_upgrade = await this.general.getConstValue('concept_types_upgrade');
        const category_coil_nails_sidding = await this.general.getConstValue('category_coil_nails_sidding');
        const tax_percentage = await this.general.getConstDecimalValue('tax_percentage');

        const ridgeventCalculations = calculations.filter(x => x.id_material_category == category_ridgevents);
        //&& x.id_concept_type == concept_types_upgrade);

        const ridgeLF = ridgeventCalculations[0]?.sqlf ?? 0;

        const nailsSiddingCalculations = calculations.filter(x => x.id_material_category == category_coil_nails_sidding);
        //&& x.id_concept_type == concept_types_upgrade);

        const ridgeventLaborCalculations = building.psb_measure.vent_is_ridgevent_in_place
            ? await this.ventingLabor.calculateRidgeVentInstallOnly(ridgeLF, this.shingles, laborPrices)
            : await this.ventingLabor.calculateRidgeVentCutIn(ridgeLF, this.shingles, laborPrices);

        const metalAttics = (building.psb_measure?.psb_upgrades_vent?.attic_replace_pc ?? 0);
        const pluginVentCalculations = await this.ventingLabor.calculatePluginVent(metalAttics, this.shingles, laborPrices);

        const cutInMaterial = calculations.filter(x => x.id_material_category == category_metal_artict_vents
            && x.id_concept_type == concept_types_material);
        const cutInLabor = calculations.filter(x => x.category == labor_category_cut_in_new_vents
            && x.id_concept_type == concept_types_labor);

        const powerVentMaterial = calculations.filter(x => x.id_material_category == category_power_vents
            && x.id_concept_type == concept_types_material);

        const powerVentLabor = calculations.filter(x => x.category == labor_category_install_power_vent
            && x.id_concept_type == concept_types_labor);

        const solarPowerVentMaterial = calculations.filter(x => x.id_material_category == category_solar_power_vents
            && x.id_concept_type == concept_types_material);

        const solarPowerVentLabor = calculations.filter(x => x.category == labor_category_install_solar_power_vent
            && x.id_concept_type == concept_types_labor);

        return this.shingles.map(shingle => {
            let details = [];

            if(building.psb_measure.vent_is_ridgevent_in_place){
                return this.getUpgradeCalculation(0, shingle, costIntegrationId, []);
            }

            const plugin = pluginVentCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(plugin);
            const pluginVentCost = plugin?.value ?? 0;

            const cutin = cutInMaterial.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(cutin);
            const cutinMaterialCost = cutin?.value ?? 0;

            const cutinLabor = cutInLabor.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(cutinLabor);
            const cutInLaborCost = cutinLabor?.value ?? 0;

            const power = powerVentMaterial.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(power);
            const powerMaterialCost = power?.value ?? 0;

            const powerLabor = powerVentLabor.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(powerLabor);
            const powerLaborCost = powerLabor?.value ?? 0;

            const solar = solarPowerVentMaterial.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(solar);
            const solarMaterialCost = solar?.value ?? 0;

            const solarLabor = solarPowerVentLabor.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(solarLabor);
            const solarLaborCost = solarLabor?.value ?? 0;

            const removeMaterials = this.parseNumber(cutinMaterialCost)
                + this.parseNumber(powerMaterialCost)
                + this.parseNumber(solarMaterialCost)
                + this.parseNumber(pluginVentCost);
            details.push({ concept: 'Remove Materials', value: removeMaterials });

            const ridge = ridgeventCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(ridge);
            const ridgeVentCost = ridge?.value ?? 0;

            const nails = nailsSiddingCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(nails);
            const nailsSiddingCost = nails?.value ?? 0;

            const ridgeLabor = ridgeventLaborCalculations.find(x => x.id_material_type_shingle == shingle.id_material_type);
            details.push(ridgeLabor);
            const ridgeVentLaborCost = ridgeLabor?.value ?? 0;

            const ridgeVentMaterialCost = ridgeVentCost + nailsSiddingCost;
            details.push({ concept: 'RidgeVent Material', value: ridgeVentMaterialCost });

            let difference = ridgeVentMaterialCost - removeMaterials;
            details.push({ concept: 'Difference Materials', value: difference });

            const taxes = difference * tax_percentage / 100;
            details.push({ concept: 'Taxes', value: taxes });

            difference += taxes;
            details.push({ concept: 'Difference Materials+Taxes', value: difference });

            const removeLabor = this.parseNumber(cutInLaborCost)
                + this.parseNumber(powerLaborCost)
                + this.parseNumber(solarLaborCost);
            details.push({ concept: 'Remove Labor', value: removeLabor });

            details.push({ concept: 'RidgeVent Labor', value: ridgeVentLaborCost });

            const laborDiff = ridgeVentLaborCost - removeLabor;
            details.push({ concept: 'Labor Difference', value: laborDiff });

            difference += laborDiff;
            details.push({ concept: 'Total Difference', value: difference });

            const generalPorcentage = 100 - ((+inspectorCostType.commision_porcentage)
                + (+inspectorCostType.profit_porcentage)
                + (+inspectorCostType.overhead_porcentage));

            const commission = (+inspectorCostType.commision_porcentage / generalPorcentage) * difference;
            details.push({ concept: 'Commission', value: commission });

            const profit = (+inspectorCostType.profit_porcentage / generalPorcentage) * difference;
            details.push({ concept: 'Profit', value: profit });

            const overhead = (+inspectorCostType.overhead_porcentage / generalPorcentage) * difference;
            details.push({ concept: 'Overhead', value: overhead });

            const extras = commission + profit + overhead;

            const total = difference + extras;
            details.push({ concept: 'Total', value: total });

            return this.getUpgradeCalculation(total, shingle, costIntegrationId, details);
        });
    }

    private parseNumber(value): number {
        if (value && !isNaN(value)) {
            return parseFloat(value);
        }
        return 0;
    }

    private async calculateRidgeVentWithAdvanceVentilation(building: Building, inspectorCostType: InspectorCostType, costIntegrationId) {
        let ridgeUpgradeCalculations = [];

        const upgradeBuilding = this.getBuildingWithUpgrades(building);
        const upgradeMaterials = await this.recalculateMaterials(upgradeBuilding);
        const upgradeLabors = await this.recalculateLabors(upgradeBuilding, upgradeMaterials, true);
        const materials = await this.recalculateMaterials(building);
        const labors = await this.recalculateLabors(building, materials, false);

        const tax_percentage = await this.general.getConstDecimalValue('tax_percentage');
        const labor_tax_percentage = await this.general.getConstDecimalValue('labor_tax_percentage');

        for (const shingle of this.shingles) {
            let details = [];
            const upgradeMaterialCost: number = upgradeMaterials
                .filter(x => x.id_material_type_shingle == shingle.id_material_type)
                .map(x => this.parseNumber(x.value))
                .reduce((previous, current) => previous + current, 0);
            details.push({ concept: 'Material Advance Ventilation Cost', value: upgradeMaterialCost });

            const upgradeLaborCost: number = upgradeLabors
                .filter(x => x.id_material_type_shingle == shingle.id_material_type)
                .map(x => this.parseNumber(x.value))
                .reduce((previous, current) => previous + current, 0);
            details.push({ concept: 'Labor Advance Ventilation Cost', value: upgradeLaborCost });

            const materialCost: number = materials
                .filter(x => x.id_material_type_shingle == shingle.id_material_type)
                .map(x => this.parseNumber(x.value))
                .reduce((previous, current) => previous + current, 0);
            details.push({ concept: 'Material Cost', value: materialCost });

            const laborCost: number = labors
                .filter(x => x.id_material_type_shingle == shingle.id_material_type)
                .map(x => this.parseNumber(x.value))
                .reduce((previous, current) => previous + current, 0);
            details.push({ concept: 'Labor Cost', value: laborCost });

            let materialDifference = (upgradeMaterialCost - materialCost);
            details.push({ concept: 'Material difference', value: materialDifference });

            materialDifference = materialDifference * (100 + tax_percentage) / 100;
            details.push({ concept: 'Material difference with tax', value: materialDifference });

            let laborDifference = (upgradeLaborCost - laborCost);
            details.push({ concept: 'Labor difference', value: laborDifference });

            laborDifference = laborDifference * (100 + labor_tax_percentage) / 100;
            details.push({ concept: 'Labor difference with tax', value: laborDifference });

            let totalDifference = materialDifference + laborDifference;
            details.push({ concept: 'Total difference', value: totalDifference });

            const taxes = this.general.calculateProfitComissionOverhead(totalDifference, inspectorCostType);
            details.push({ concept: 'Profit Comission Overhead', value: taxes });

            const total = totalDifference + taxes;
            details.push({ concept: 'Total', value: total });

            const calculation = this.getUpgradeCalculation(total, shingle, costIntegrationId, details);
            ridgeUpgradeCalculations.push(calculation);
        }

        return ridgeUpgradeCalculations;
    }

    private async getUpgradeCostIntegration(building: Building) {
        const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == this.upgrade_ridgevents);
        return upgrade && upgrade.id_cost_integration;
    }

    private getBuildingWithUpgrades(building: Building) {
        return {
            ...building,
            psb_measure: {
                ...building.psb_measure,
                vent_metal_artict_cut_in_pc: this.parseNumber(building.psb_measure.psb_upgrades_vent.attic_cutin_pc),
                vent_metal_artict_remove_pc: this.parseNumber(building.psb_measure.psb_upgrades_vent.attic_remove_pc),
                vent_metal_artict_replace_pc: this.parseNumber(building.psb_measure.psb_upgrades_vent.attic_replace_pc),
                vent_power_vent_pc: this.parseNumber(building.psb_measure.psb_upgrades_vent.pv_new_pc),
                vent_solar_power_vent_pc: this.parseNumber(building.psb_measure.psb_upgrades_vent.solar_pv_new_pc)
            }
        };
    }

    async recalculateMaterials(upgradeBuilding: Building) {
        return await this.ventingMaterial.calculateVentingMeasures(upgradeBuilding);
    }

    async recalculateLabors(upgradeBuilding, calculations, isUpgrade) {
        return await this.ventingLabor.calculateLabor(upgradeBuilding, calculations, isUpgrade);
    }


    hasBuildingAdvancedVentilation(measure: PsbMeasures) {
        const noRequired = measure.psb_no_requireds.find(x => x.id_resource == 23)?.no_required ?? false;
        return !noRequired && measure.psb_upgrades_vent != undefined && measure.psb_upgrades_vent != null;
    }

    private getUpgradeCalculation(total, shingle, costIntegrationId, details) {
        const calculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        calculation.calculation_type = 'Costo de Upgrade';
        calculation.category = this.upgrade_ridgevents;
        calculation.concept = 'RidgeVents Upgrade';
        calculation.concept_type = 'RidgeVents Upgrade';
        calculation.id_concept_type = this.concept_types_ridgevent_upgrade;
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
        calculation.details = details;

        return calculation;
    }

    private getPartialUpgradeCalculation(total, shingle, description) {
        const calculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        calculation.calculation_type = 'Costo parcial de Upgrade';
        calculation.category = this.upgrade_ridgevents;
        calculation.concept = description;
        calculation.concept_type = description;
        calculation.id_concept_type = this.concept_types_ridgevent_upgrade;
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
        calculation.id_cost_integration = null;

        return calculation;
    }
}
