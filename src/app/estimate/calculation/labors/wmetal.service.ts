import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
@Injectable({
    providedIn: 'root',
})
export class WMetalService {
    constructor(private catalogs: CatalogsService,
        private general: GeneralService,
        private shingle: ShinglesService) { }

    async calculateLabor(building, materialCalculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const category_w_metal = await this.general.getConstValue('category_w_metal');
        const labor_category_w_metal = await this.general.getConstDecimalValue('labor_category_w_metal');
        const labor_price_w_metal = await this.general.getConstDecimalValue('labor_price_w_metal');

        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const laborPrice = laborPrices.find(price => price.id == labor_price_w_metal);

        for (const shingle of shingles) {
            const materialCalculation = materialCalculations.filter(material => material?.id_material_category == category_w_metal
                && material.id_material_type_shingle == shingle.id_material_type
            );

            if (materialCalculation.length==0) {
                continue;
            }

            const quantity = materialCalculation[0].lf;

            const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
            laborCalculation.qty = quantity;
            laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
            laborCalculation.category = labor_category_w_metal;
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
            laborCalculation.value = +laborPrice.price * quantity;
            laborCalculation.id_material_price_list = null;
            laborCalculation.id_price_list = null;
            laborCalculation.id_material_type_shingle = shingle.id_material_type;
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }
}
