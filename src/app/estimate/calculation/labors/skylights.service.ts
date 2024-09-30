import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { LaborPrice } from 'src/app/models/labor-price.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
@Injectable({
    providedIn: 'root',
})
export class SkylightService {

    constructor(private catalogs: CatalogsService,
        private general: GeneralService,
        private shingle: ShinglesService) { }

    async calculateLabor(building: Building, materialCalculations) {
        const slSmall = building.psb_measure.psb_skylights.filter(x => !x.deletedAt && x.need_replace && x.id_skylight_size == 1);
        const slSmallN = building.psb_measure.psb_skylights.filter(x => !x.deletedAt && !x.need_replace && x.id_skylight_size == 1);

        const slLarge = building.psb_measure.psb_skylights.filter(x => !x.deletedAt && x.need_replace && x.id_skylight_size == 2);
        const slLargeN = building.psb_measure.psb_skylights.filter(x => !x.deletedAt && !x.need_replace && x.id_skylight_size == 2);

        const skylights = building.psb_measure.psb_skylights.filter(x => !x.deletedAt && x.id_skylight_size == 3);

        const smallSkylightCalculations = await this.getSmallSkylightCalculations(slSmall, materialCalculations);
        const smallSkylightCalculationsN = await this.getSmallSkylightCalculations(slSmallN, materialCalculations);

        const largeSkylightCalculations = await this.getLargeSkylightCalculations(slLarge, materialCalculations);
        const largeSkylightCalculationsN = await this.getLargeSkylightCalculations(slLargeN, materialCalculations);

       const customSkylightCalculations = await this.getCustomSkylightCalculations(skylights, materialCalculations);

        return [
            ...smallSkylightCalculations, 
            ...smallSkylightCalculationsN, 
            ...largeSkylightCalculations, 
            ...largeSkylightCalculationsN, 
            ...customSkylightCalculations
        ];
    }

    private async getSmallSkylightCalculations(skylights, materialCalculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const category_skylight_small = await this.general.getConstValue('category_skylight_small');
        const labor_category_skylight_small = await this.general.getConstDecimalValue('labor_category_skylight_small');
        const labor_price_skylight_small = await this.general.getConstDecimalValue('labor_price_skylight_small');

        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const laborPrice = laborPrices.find(price => price.id == labor_price_skylight_small);

        for (const skylight of skylights) {
            for (const shingle of shingles) {
                const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));

                /*const skylights = materialCalculations.filter(material => material?.id_material_category == category_skylight_small
                    && material.id_material_type_shingle == shingle.id_material_type
                );
                if (skylights && skylights.length > 0 && skylights[0].qty>0){
                    skylights.forEach(skylight => {
                        console.log('labor skylight', skylight)
                      laborCalculation.qty += skylight.qty;
                    });
                }*/

                let priceSkylight = laborPrice.price;
                let labelSkylight = (!skylight.need_replace)?" - Don't need a replace":"";

                laborCalculation.qty = skylight.custom_qty;
                laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
                laborCalculation.category = labor_category_skylight_small;
                laborCalculation.concept =  `${laborPrice.labor} ${labelSkylight}`;
                laborCalculation.concept_type = laborPrice.labor;
                laborCalculation.id_concept_type = laborPrice.id;
                laborCalculation.id_concept = null;
                laborCalculation.cost = laborPrice.price;
                laborCalculation.coverage = null;
                laborCalculation.id_labor_type = null;
                laborCalculation.is_final = true;
                laborCalculation.unit = null;
                laborCalculation.unit_abbrevation = null;
                laborCalculation.value = Number(priceSkylight) * laborCalculation.qty;
                laborCalculation.id_material_price_list = null;
                laborCalculation.id_price_list = null;
                laborCalculation.id_material_type_shingle = shingle.id_material_type;
                laborCalculationList.push(laborCalculation);
            }
        }
        return laborCalculationList;
    }

    private async getLargeSkylightCalculations(skylights, materialCalculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const category_skylight_large = await this.general.getConstValue('category_skylight_large');
        const labor_category_skylight_large = await this.general.getConstDecimalValue('labor_category_skylight_large');
        const labor_price_skylight_large = await this.general.getConstDecimalValue('labor_price_skylight_large');

        if (!materialCalculations.some(material => material?.id_material_category == category_skylight_large)) {
            return laborCalculationList;
        }

        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const laborPrice = laborPrices.find(price => price.id == labor_price_skylight_large);

        for (const skylight of skylights) {
            for (const shingle of shingles) {
                const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));

                /*const skylights = materialCalculations.filter(material => material?.id_material_category == category_skylight_large
                    && material.id_material_type_shingle == shingle.id_material_type
                );
                laborCalculation.qty = 0;
                if (skylights && skylights.length > 0 && skylights[0].qty>0){
                    skylights.forEach(skylight => {
                    laborCalculation.qty += skylight.qty;
                    });
                }
                */

                let priceSkylight = laborPrice.price;
                let labelSkylight = (!skylight.need_replace)?" - Don't need a replace":"";

                laborCalculation.qty = skylight.custom_qty;
                laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
                laborCalculation.category = labor_category_skylight_large;
                laborCalculation.concept = `${laborPrice.labor} ${labelSkylight}`;
                laborCalculation.concept_type = laborPrice.labor;
                laborCalculation.id_concept_type = laborPrice.id;
                laborCalculation.id_concept = null;
                laborCalculation.cost = laborPrice.price;
                laborCalculation.coverage = null;
                laborCalculation.id_labor_type = null;
                laborCalculation.is_final = true;
                laborCalculation.unit = null;
                laborCalculation.unit_abbrevation = null;
                laborCalculation.value = Number(priceSkylight) * laborCalculation.qty;
                laborCalculation.id_material_price_list = null;
                laborCalculation.id_price_list = null;
                laborCalculation.id_material_type_shingle = shingle.id_material_type;
                laborCalculationList.push(laborCalculation);
            }
        }
        return laborCalculationList;
    }


    private async getCustomSkylightCalculations(skylights, materialCalculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const labor_category_skylight_small = await this.general.getConstDecimalValue('labor_category_skylight_small');
        const labor_price_skylight_small = await this.general.getConstDecimalValue('labor_price_skylight_small');
        const labor_category_skylight_large = await this.general.getConstDecimalValue('labor_category_skylight_large');
        const labor_price_skylight_large = await this.general.getConstDecimalValue('labor_price_skylight_large');

        const laborPrices = (await this.catalogs.getLaborPrices()).data;

        for (const skylight of skylights) {
            for (const shingle of shingles) {
                let laborPrice : LaborPrice;
                laborPrice = laborPrices.find(price => price.id == labor_price_skylight_small);
                let laborCategory = labor_category_skylight_small

                if(skylight.width * skylight.length >= 530){
                    laborPrice = laborPrices.find(price => price.id == labor_price_skylight_large);
                    laborCategory = labor_category_skylight_large;
                }

                let priceSkylight = laborPrice.price;
                let labelSkylight = (!skylight.need_replace)?" - Don't need a replace":"";

                const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
                laborCalculation.qty = skylight.custom_qty;
                laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
                laborCalculation.category = laborCategory;
                laborCalculation.concept = `${skylight.skylights} ${skylight.width} x ${skylight.lenght} ${labelSkylight}`;
                laborCalculation.concept_type = laborPrice.labor;
                laborCalculation.id_concept_type = laborPrice.id;
                laborCalculation.id_concept = null;
                laborCalculation.cost = laborPrice.price;
                laborCalculation.coverage = null;
                laborCalculation.id_labor_type = null;
                laborCalculation.is_final = true;
                laborCalculation.unit = null;
                laborCalculation.unit_abbrevation = null;
                laborCalculation.value = Number(priceSkylight) * Number(laborCalculation.qty);
                laborCalculation.id_material_price_list = null;
                laborCalculation.id_price_list = null;
                laborCalculation.id_material_type_shingle = shingle.id_material_type;
                laborCalculationList.push(laborCalculation);
            }
        }
        return laborCalculationList;
    }

}
