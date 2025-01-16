import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
@Injectable({
    providedIn: 'root',
})
export class VentingService {

    constructor(private catalogs: CatalogsService,
        private general: GeneralService,
        private shingle: ShinglesService) { }

    async calculateLabor(building: Building, calculations, isUpgrade=false) {
        const shingles = await this.shingle.getShingles();
        const laborPrices = (await this.catalogs.getLaborPrices()).data;

        const pluginVent = building.psb_measure.vent_metal_artict_replace;
        const pluginVentCalculations = await this.calculatePluginVent(pluginVent, shingles, laborPrices);

        const isRidgeventBuiltin = await this.isRidgeventBultin(building);
        const ridgeVent = isUpgrade || isRidgeventBuiltin || building.psb_measure.vent_is_ridgevent_in_place
            ? this.getRidgeVent(building.psb_measure)
            : 0;

        const ridgeVentCalculations = building.psb_measure.vent_is_ridgevent_in_place
            ? await this.calculateRidgeVentInstallOnly(ridgeVent, shingles, laborPrices)
            : await this.calculateRidgeVentCutIn(ridgeVent, shingles, laborPrices);

        const powerVent = building?.psb_measure?.vent_power_vent_pc ?? 0;
        const powerVentCalculations = await this.calculatePowerVent(powerVent, shingles, laborPrices);

        const solarPowerVent = building?.psb_measure?.vent_solar_power_vent_pc ?? 0;
        const solarPowerVentCalculations = await this.calculateSolarPowerVent(solarPowerVent, shingles, laborPrices);

        return [...pluginVentCalculations, ...ridgeVentCalculations, ...powerVentCalculations, ...solarPowerVentCalculations];
    }

    private async isRidgeventBultin(building: Building) {
        const cost_integration_builtin = await this.general.getConstDecimalValue('cost_integration_built_in');
        const upgrade_ridgevents = await this.general.getConstDecimalValue('upgrade_ridgevents');

        const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_ridgevents);
        return upgrade && upgrade.id_cost_integration == cost_integration_builtin;
    }

    async calculatePluginVent(quantity, shingles, laborPrices) {
        const laborCalculationList = [];
        const labor_category_plug_in_exiting_vents = await this.general.getConstDecimalValue('labor_category_plug_in_exiting_vents');
        const labor_price_plug_in_exiting_vents = await this.general.getConstDecimalValue('labor_price_plug_in_exiting_vents');
        const laborPrice = laborPrices.find(price => price.id == labor_price_plug_in_exiting_vents);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category_plug_in_exiting_vents, shingle);
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }

    private getRidgeVent(measures: PsbMeasures) {
        const ridge = measures.vent_is_ridgevent_in_place ? measures.vent_ridgevent_lf : measures.ridge_lf;
        return ridge * (1 + ((measures.wasting * 0.01) / 2));
    }

    async calculateRidgeVentCutIn(quantity, shingles, laborPrices) {
        const laborPrice = await this.general.getConstDecimalValue('labor_price_ridge_vent');
        return await this.calculateRidgeVent(quantity, shingles, laborPrices, laborPrice);
    }

    async calculateRidgeVentInstallOnly(quantity, shingles, laborPrices) {
        const laborPrice = await this.general.getConstDecimalValue('labor_price_ridgevent_install_only');
        return await this.calculateRidgeVent(quantity, shingles, laborPrices, laborPrice);
    }

    private async calculateRidgeVent(quantity, shingles, laborPrices, laborPriceId) {
        const laborCalculationList = [];

        const labor_category_ridge_vent = await this.general.getConstDecimalValue('labor_category_ridge_vent');
        const laborPrice = laborPrices.find(price => price.id == laborPriceId);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category_ridge_vent, shingle);
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }


    private async calculatePowerVent(quantity: number, shingles, laborPrices) {
        const laborCalculationList = [];

        const labor_category_install_power_vent = await this.general.getConstDecimalValue('labor_category_install_power_vent');
        const labor_price_install_power_vent = await this.general.getConstDecimalValue('labor_price_install_power_vent');
        const laborPrice = laborPrices.find(price => price.id == labor_price_install_power_vent);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category_install_power_vent, shingle);
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }

    private async calculateSolarPowerVent(quantity: number, shingles, laborPrices) {
        const laborCalculationList = [];

        const labor_category_install_solar_power_vent = await this.general.getConstDecimalValue('labor_category_install_solar_power_vent');
        const labor_price_install_solar_power_vent = await this.general.getConstDecimalValue('labor_price_install_solar_power_vent');
        const laborPrice = laborPrices.find(price => price.id == labor_price_install_solar_power_vent);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category_install_solar_power_vent, shingle);
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }

    private getCalculationObj(quantity, laborPrice, category, shingle) {
        const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        laborCalculation.qty = quantity;
        laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
        laborCalculation.category = category;
        laborCalculation.concept = laborPrice.labor;
        laborCalculation.concept_type = laborPrice.labor;
        laborCalculation.id_concept_type = laborPrice.id;
        laborCalculation.id_concept = null;
        laborCalculation.cost = laborPrice.price;
        laborCalculation.coverage = null;
        laborCalculation.id_labor_type = null;
        laborCalculation.is_final = true;
        laborCalculation.unit = null;
        laborCalculation.unit_abbrevation = null;
        laborCalculation.value = laborPrice.price * quantity;
        laborCalculation.id_material_price_list = null;
        laborCalculation.id_price_list = null;
        laborCalculation.id_material_type_shingle = shingle.id_material_type;
        return laborCalculation;
    }
}
