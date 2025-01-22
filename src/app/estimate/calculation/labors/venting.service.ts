import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
import { PsbSoffitVent } from 'src/app/models/psb-soffitvents.model';
import { PsbLouveredVent } from 'src/app/models/psb-louvrevents.model';
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
        const psb_soffitvents: PsbSoffitVent = building?.psb_measure?.psb_soffitvents;
        const psb_louvrevents: PsbLouveredVent = building?.psb_measure.psb_louvrevents;

        const pluginVent = this.safetySum(building.psb_measure.vent_metal_artict_replace, building.psb_measure.vent_metal_artict);
        const pluginVentCalculations = await this.calculateLaborVent(pluginVent, shingles, laborPrices, 'labor_category_plug_in_exiting_vents', 'labor_price_plug_in_exiting_vents');

        const isRidgeventBuiltin = await this.isRidgeventBultin(building);
        const ridgeVent = isUpgrade || isRidgeventBuiltin || building.psb_measure.vent_is_ridgevent_in_place
            ? this.getRidgeVent(building.psb_measure)
            : 0;

        const ridgeVentCalculations = building.psb_measure.vent_is_ridgevent_in_place
            ? await this.calculateRidgeVentInstallOnly(ridgeVent, shingles, laborPrices)
            : await this.calculateRidgeVentCutIn(ridgeVent, shingles, laborPrices);

        const powerVent = this.safetySum(building?.psb_measure?.vent_power_vent_pc, building?.psb_measure?.vent_power_vent_pc_add);
        const powerVentCalculations = await this.calculateLaborVent(powerVent, shingles, laborPrices, 'labor_category_install_power_vent', 'labor_price_install_power_vent');

        const solarPowerVent = this.safetySum(building?.psb_measure?.vent_solar_power_vent_pc, building?.psb_measure?.vent_solar_power_vent_pc_add);
        const solarPowerVentCalculations = await this.calculateLaborVent(solarPowerVent, shingles, laborPrices, 'labor_category_install_solar_power_vent', 'labor_price_install_solar_power_vent');

        const soffitVents2 = this.safetySum(psb_soffitvents?.soffitVent2Add, psb_soffitvents?.soffitVent2);
        const soffitVents2Calculations = await this.calculateLaborVent(soffitVents2, shingles, laborPrices, 'labor_category_install_soffit_2_vents', 'labor_price_install_2_soffit_vents');

        const soffitVents3 = this.safetySum(psb_soffitvents?.soffitVent3Add, psb_soffitvents?.soffitVent3);
        const soffitVents3Calculations = await this.calculateLaborVent(soffitVents3, shingles, laborPrices, 'labor_category_install_soffit_3_vents', 'labor_price_install_3_soffit_vents');

        const soffitVents4 = this.safetySum(psb_soffitvents?.soffitVent4Add, psb_soffitvents?.soffitVent4);
        const soffitVents4Calculations = await this.calculateLaborVent(soffitVents4, shingles, laborPrices, 'labor_category_install_soffit_4_vents', 'labor_price_install_4_soffit_vents');

        const soffitVents416 = this.safetySum(psb_soffitvents?.soffitVent416Add, psb_soffitvents?.soffitVent416);
        const soffitVents416Calculations = await this.calculateLaborVent(soffitVents416, shingles, laborPrices, 'labor_category_install_soffit_4_x_16_vents', 'labor_price_install_4_X_16_soffit_vents');

        const soffitVents616 = this.safetySum(psb_soffitvents?.soffitVent616Add, psb_soffitvents?.soffitVent616);
        const soffitVents616Calculations = await this.calculateLaborVent(soffitVents616, shingles, laborPrices, 'labor_category_install_soffit_6_x_16_vents', 'labor_price_install_6_X_16_soffit_vents');
        
        const louvreVents4WithExtension = this.safetySum(psb_louvrevents?.vent_louveredVent4WithExtensions_add, psb_louvrevents?.vent_louveredVent4WithExtensions);
        const louvreVents4WithExtensionCalculations = await this.calculateLaborVent(louvreVents4WithExtension, shingles, laborPrices, 'labor_category_install_4_louvre_vents_with_extension', 'labor_price_install_4_louvre_vents_with_extensions');

        const louvreVents6WithExtension = this.safetySum(psb_louvrevents?.vent_louveredVent6WithExtensions_add, psb_louvrevents?.vent_louveredVent6WithExtensions);
        const louvreVents6WithExtensionCalculations = await this.calculateLaborVent(louvreVents6WithExtension, shingles, laborPrices, 'labor_category_install_6_louvre_vents_with_extension', 'labor_price_install_6_louvre_vents_with_extensions');

        const louvreVents4WithoutExtension = this.safetySum(psb_louvrevents?.vent_louveredVent4WithoutExtensions_add, psb_louvrevents?.vent_louveredVent4WithoutExtensions);
        const louvreVents4WithoutExtensionCalculations = await this.calculateLaborVent(louvreVents4WithoutExtension, shingles, laborPrices, 'labor_category_install_4_louvre_vents_without_extension', 'labor_price_install_4_louvre_vents_without_extensions');

        const louvreVents6WithoutExtension = this.safetySum(psb_louvrevents?.vent_louveredVent6WithoutExtensions_add, psb_louvrevents?.vent_louveredVent6WithoutExtensions);
        const louvreVents6WithoutExtensionCalculations = await this.calculateLaborVent(louvreVents6WithoutExtension, shingles, laborPrices, 'labor_category_install_6_louvre_vents_without_extension', 'labor_price_install_6_louvre_vents_without_extensions');


        const jvents4Install = this.safetySum(building?.psb_measure.vent_j_vent_4_add, building?.psb_measure.vent_j_vent_4_pc);
        const jvents4CalculationsInstall = await this.calculateLaborVent(jvents4Install, shingles, laborPrices, 'labor_category_install_4_jvents', 'labor_price_install_4_jvents');

        const jvents6Install = this.safetySum(building?.psb_measure.vent_j_vent_6_add, building?.psb_measure.vent_j_vent_6_pc);
        const jvents6CalculationsInstall = await this.calculateLaborVent(jvents6Install, shingles, laborPrices, 'labor_category_install_6_jvents', 'labor_price_install_6_jvents');


        // REMOVE
        const louvreVents4WithExtensionRemove = psb_louvrevents?.vent_louveredVent4WithExtensions_remove ?? 0;
        const louvreVents4WithExtensionCalculationsRemove = await this.calculateLaborVent(louvreVents4WithExtensionRemove, shingles, laborPrices, 'labor_category_remove_4_louvre_vents_with_extension', 'labor_price_remove_louvre_4_vents_with_extension');

        const louvreVents6WithExtensionRemove = psb_louvrevents?.vent_louveredVent6WithExtensions_remove ?? 0;
        const louvreVents6WithExtensionCalculationsRemove = await this.calculateLaborVent(louvreVents6WithExtensionRemove, shingles, laborPrices, 'labor_category_remove_6_louvre_vents_with_extension', 'labor_price_remove_louvre_6_vents_with_extension');

        const louvreVents4WithoutExtensionRemove = psb_louvrevents?.vent_louveredVent4WithoutExtensions_remove ?? 0;
        const louvreVents4WithoutExtensionCalculationsRemove = await this.calculateLaborVent(louvreVents4WithoutExtensionRemove, shingles, laborPrices, 'labor_category_remove_4_louvre_vents_without_extension', 'labor_price_remove_louvre_4_vents_without_extension');

        const louvreVents6WithoutExtensionRemove = psb_louvrevents?.vent_louveredVent6WithoutExtensions_remove ?? 0;
        const louvreVents6WithoutExtensionCalculationsRemove = await this.calculateLaborVent(louvreVents6WithoutExtensionRemove, shingles, laborPrices, 'labor_category_remove_6_louvre_vents_without_extension', 'labor_price_remove_louvre_6_vents_without_extension');

        const jvents6Remove = building?.psb_measure.vent_j_vent_6_remove ?? 0;
        const jvents6CalculationsRemove = await this.calculateLaborVent(jvents6Remove, shingles, laborPrices, 'labor_category_remove_6_jvents', 'labor_price_remove_6j_vents');

        const jvents4Remove = building?.psb_measure.vent_j_vent_4_remove ?? 0;
        const jvents4CalculationsRemove = await this.calculateLaborVent(jvents4Remove, shingles, laborPrices, 'labor_category_remove_4_jvents', 'labor_price_remove_4j_vents');

        const metalAtticVentsRemove = building?.psb_measure.vent_metal_artict_remove ?? 0;
        const metalAtticVentsCalculationsRemove = await this.calculateLaborVent(metalAtticVentsRemove, shingles, laborPrices, 'labor_category_remove_metal_attic_vents', 'labor_price_remove_metal_attic_vents');

        const powerVentsRemove = building?.psb_measure.vent_power_vent_pc_remove ?? 0;
        const powerVentsCalculationsRemove = await this.calculateLaborVent(powerVentsRemove, shingles, laborPrices, 'labor_category_remove_power_vents', 'labor_price_remove_power_vents');
        
        const solarPowerVentsRemove = building?.psb_measure.vent_solar_power_vent_pc_remove ?? 0;
        const solarPowerVentsCalculationsRemove = await this.calculateLaborVent(solarPowerVentsRemove, shingles, laborPrices, 'labor_category_remove_solar_power_vents', 'labor_category_remove_solar_power_vents');
 
        // CUT
        const louvreVents4WithExtensionCut = psb_louvrevents?.vent_louveredVent4WithExtensions_add ?? 0;
        const louvreVents4WithExtensionCalculationsCut = await this.calculateLaborVent(louvreVents4WithExtensionCut, shingles, laborPrices, 'labor_category_cut_in_4_louvre_vents_with_extension', 'labor_price_cut_in_4_louvre_vents_with_extension');

        const louvreVents6WithExtensionCut = psb_louvrevents?.vent_louveredVent6WithExtensions_remove?? 0;
        const louvreVents6WithExtensionCalculationsCut = await this.calculateLaborVent(louvreVents6WithExtensionCut, shingles, laborPrices, 'labor_category_cut_in_6_louvre_vents_with_extension', 'labor_price_cut_in_6_louvre_vents_with_extension');


        const louvreVents6WithoutExtensionCut = psb_louvrevents?.vent_louveredVent6WithoutExtensions_remove?? 0;
        const louvreVents6WithoutExtensionCalculationsCut = await this.calculateLaborVent(louvreVents6WithoutExtensionCut, shingles, laborPrices, 'labor_category_cut_in_6_louvre_vents_without_extension', 'labor_price_cut_in_6_louvre_vents_without_extension');

        const louvreVents4WithoutExtensionCut = psb_louvrevents?.vent_louveredVent4WithoutExtensions_add ?? 0;
        const louvreVents4WithoutExtensionCalculationsCut = await this.calculateLaborVent(louvreVents4WithoutExtensionCut, shingles, laborPrices, 'labor_category_cut_in_4_louvre_vents_without_extension', 'labor_price_cut_in_4_louvre_vents_without_extension');
        
        const soffit616Cut = psb_soffitvents.soffitVent616Add ?? 0;
        const soffit616CalculationsCut = await this.calculateLaborVent(soffit616Cut, shingles, laborPrices, 'labor_category_cut_in_soffit_6_x_16_vents', 'labor_price_cut_in_6_16_soffit_vents');

        const soffit416Cut = psb_soffitvents.soffitVent416Add ?? 0;
        const soffit416CalculationsCut = await this.calculateLaborVent(soffit416Cut, shingles, laborPrices, 'labor_category_cut_in_soffit_4_x_16_vents', 'labor_price_cut_in_4_16_soffit_vents');

        const soffit4Cut = psb_soffitvents.soffitVent4Add ?? 0;
        const soffit4CalculationsCut = await this.calculateLaborVent(soffit4Cut, shingles, laborPrices, 'labor_category_cut_in_soffit_4_vents', 'labor_price_cut_in_4_soffit_vents');

        const soffit2Cut = psb_soffitvents.soffitVent2Add ?? 0;
        const soffit2CalculationsCut = await this.calculateLaborVent(soffit2Cut, shingles, laborPrices, 'labor_category_cut_in_soffit_2_vents', 'labor_price_cut_in_2_soffit_vents');

        const soffit3Cut = psb_soffitvents.soffitVent3Add ?? 0;
        const soffit3CalculationsCut = await this.calculateLaborVent(soffit3Cut, shingles, laborPrices, 'labor_category_cut_in_soffit_3_vents', 'labor_price_cut_in_3_soffit_vents');

        const metalAtticVentsCut = building?.psb_measure.vent_metal_artict_replace ?? 0;
        const metalAtticVentsCalculationsCut = await this.calculateLaborVent(metalAtticVentsCut, shingles, laborPrices, 'labor_category_cut_in_metal_attic_vents', 'labor_price_cut_in_new_vents');

        const powerVentCut = building?.psb_measure.vent_power_vent_pc_add ?? 0;
        const powerVentCalculationsCut = await this.calculateLaborVent(powerVentCut, shingles, laborPrices, 'labor_category_cut_in_power_vent', 'labor_category_cut_in_power_vent');
        
        const solarPowerVentCut = building?.psb_measure.vent_solar_power_vent_pc_add ?? 0;
        const solarPowerVentCalculationsCut = await this.calculateLaborVent(solarPowerVentCut, shingles, laborPrices, 'labor_category_cut_in_solar_power_vent', 'labor_price_cut_in_solar_power_vents');




        return [
            ...pluginVentCalculations, 
            ...ridgeVentCalculations, 
            ...powerVentCalculations, 
            ...solarPowerVentCalculations,

            ...soffitVents2Calculations,
            ...soffitVents3Calculations,
            ...soffitVents4Calculations,
            ...soffitVents416Calculations,
            ...louvreVents4WithExtensionCalculations,
            ...louvreVents6WithExtensionCalculations,
            ...louvreVents4WithoutExtensionCalculations,
            ...louvreVents6WithoutExtensionCalculations,
            ...soffitVents616Calculations,
            ...jvents4CalculationsInstall,
            ...jvents6CalculationsInstall,
            ...louvreVents4WithExtensionCalculationsRemove,
            ...louvreVents6WithExtensionCalculationsRemove,
            ...louvreVents4WithoutExtensionCalculationsRemove,
            ...louvreVents6WithoutExtensionCalculationsRemove,
            ...metalAtticVentsCalculationsRemove,
            ...powerVentsCalculationsRemove,
            ...solarPowerVentsCalculationsRemove,
            ...jvents6CalculationsRemove,
            ...jvents4CalculationsRemove,
            ...metalAtticVentsCalculationsCut,
            ...louvreVents4WithExtensionCalculationsCut,
            ...louvreVents6WithExtensionCalculationsCut,
            ...louvreVents6WithoutExtensionCalculationsCut,
            ...louvreVents4WithoutExtensionCalculationsCut,
            ...soffit616CalculationsCut,
            ...soffit416CalculationsCut,
            ...soffit4CalculationsCut,
            ...soffit2CalculationsCut,
            ...soffit3CalculationsCut,
            ...powerVentCalculationsCut,
            ...solarPowerVentCalculationsCut
        ];
    }

    private async isRidgeventBultin(building: Building) {
        const cost_integration_builtin = await this.general.getConstDecimalValue('cost_integration_built_in');
        const upgrade_ridgevents = await this.general.getConstDecimalValue('upgrade_ridgevents');

        const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_ridgevents);
        return upgrade && upgrade.id_cost_integration == cost_integration_builtin;
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

    private safetySum(a = 0, b= 0):number {
        return a+b;
    }

    private async calculateLaborVent(
        quantity, shingles, laborPrices, keyCategory: string, keyLaborPrice:string) {
        const laborCalculationList = [];

        const labor_category = await this.general.getConstDecimalValue(keyCategory);
        const labor_price_category = await this.general.getConstDecimalValue(keyLaborPrice);
        const laborPrice = laborPrices.find(price => price.id == labor_price_category);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category, shingle);
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
