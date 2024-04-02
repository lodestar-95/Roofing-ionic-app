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
        const smallSkylightCalculations = await this.getSmallSkylightCalculations(materialCalculations);
        const largeSkylightCalculations = await this.getLargeSkylightCalculations(materialCalculations);

        return [...smallSkylightCalculations, ...largeSkylightCalculations];
    }

    private async getSmallSkylightCalculations(materialCalculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const category_skylight_small = await this.general.getConstValue('category_skylight_small');
        const labor_category_skylight_small = await this.general.getConstDecimalValue('labor_category_skylight_small');
        const labor_price_skylight_small = await this.general.getConstDecimalValue('labor_price_skylight_small');

        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const laborPrice = laborPrices.find(price => price.id == labor_price_skylight_small);

        console.log(category_skylight_small);
        console.log('materialCalculations');
        console.log(materialCalculations);
        for (const shingle of shingles) {
            const skylights = materialCalculations.filter(material => material?.id_material_category == category_skylight_small
                && material.id_material_type_shingle == shingle.id_material_type
            );
            console.log(skylights);
            const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
            laborCalculation.qty = 0;
            if (skylights && skylights.length > 0 && skylights[0].qty>0){
                skylights.forEach(skylight => {
                  laborCalculation.qty += skylight.qty;
                });
            }
            console.log('LABOR::::::::::::::::SMALL SKYLIGHTS');
            console.log('LABOR::::::::::::::::SMALL SKYLIGHTS');
            console.log('LABOR::::::::::::::::SMALL SKYLIGHTS');
            console.log('LABOR::::::::::::::::SMALL SKYLIGHTS');
            console.log('LABOR::::::::::::::::SMALL SKYLIGHTS');
            console.log(laborCalculation);
            laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
            laborCalculation.category = labor_category_skylight_small;
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
            laborCalculation.value = +laborPrice.price * laborCalculation.qty;
            laborCalculation.id_material_price_list = null;
            laborCalculation.id_price_list = null;
            laborCalculation.id_material_type_shingle = shingle.id_material_type;
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }

    private async getLargeSkylightCalculations(materialCalculations) {
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

        for (const shingle of shingles) {
            const skylights = materialCalculations.filter(material => material?.id_material_category == category_skylight_large
                && material.id_material_type_shingle == shingle.id_material_type
            );
            console.log(skylights);
            const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
            laborCalculation.qty = 0;
            if (skylights && skylights.length > 0 && skylights[0].qty>0){
                skylights.forEach(skylight => {
                  laborCalculation.qty += skylight.qty;
                });
            }
            laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
            laborCalculation.category = labor_category_skylight_large;
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
            laborCalculation.value = +laborPrice.price * laborCalculation.qty;
            laborCalculation.id_material_price_list = null;
            laborCalculation.id_price_list = null;
            laborCalculation.id_material_type_shingle = shingle.id_material_type;
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }


    private async getCustomSkylightCalculations(materialCalculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const category_skylight_custom = await this.general.getConstValue('category_skylight_custom');
        const labor_category_skylight_small = await this.general.getConstDecimalValue('labor_category_skylight_small');
        const labor_price_skylight_small = await this.general.getConstDecimalValue('labor_price_skylight_small');
        const labor_category_skylight_large = await this.general.getConstDecimalValue('labor_category_skylight_large');
        const labor_price_skylight_large = await this.general.getConstDecimalValue('labor_price_skylight_large');

        const laborPrices = (await this.catalogs.getLaborPrices()).data;

        for (const shingle of shingles) {
            const skylights = materialCalculations.filter(material => material?.id_material_type == category_skylight_custom
                && material.id_material_type_shingle == shingle.id_material_type
            );

            if (skylights && skylights.length > 0){
                for(const skylight of skylights){
                    let laborPrice : LaborPrice;
                    if(skylight.width * skylight.length >= 530){
                        laborPrice = laborPrices.find(price => price.id == labor_price_skylight_large)[0];
                    }else{
                        laborPrice = laborPrices.find(price => price.id == labor_price_skylight_small)[0];
                    }

                    const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
                    laborCalculation.qty = skylights.length;
                    laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
                    laborCalculation.category = labor_category_skylight_small;
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
                    laborCalculation.value = +laborPrice.price * laborCalculation.qty;
                    laborCalculation.id_material_price_list = null;
                    laborCalculation.id_price_list = null;
                    laborCalculation.id_material_type_shingle = shingle.id_material_type;
                    laborCalculationList.push(laborCalculation);
                }
            }
        }
        return laborCalculationList;
    }

}
