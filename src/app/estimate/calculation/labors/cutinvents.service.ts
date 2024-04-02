import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
@Injectable({
    providedIn: 'root',
})
export class CutInVentService {

    constructor(private catalogs: CatalogsService,
        private general: GeneralService,
        private shingle: ShinglesService) { }

    async calculateLabor(building, calculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const labor_category_cut_in_new_vents = await this.general.getConstDecimalValue('labor_category_cut_in_new_vents');
        const labor_price_cut_in_new_vents = await this.general.getConstDecimalValue('labor_price_cut_in_new_vents');
        const quantity = building?.psb_measure?.vent_metal_artict_cut_in_pc ?? 0;
    
        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const laborPrice = laborPrices.find(price => price.id == labor_price_cut_in_new_vents);

        for (const shingle of shingles) {
            const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
            laborCalculation.qty = quantity;
            laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
            laborCalculation.category = labor_category_cut_in_new_vents;
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
