import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
@Injectable({
    providedIn: 'root',
})
export class TravelService {

    constructor(private catalogs: CatalogsService,
        private general: GeneralService,
        private shingle: ShinglesService) { }

    async calculateLabor(building: Building, calculations) {
        const laborCalculationList = [];
        const totalHrs = building.psb_measure.out_estimated_roofers_qty * building.psb_measure.out_travel_time_hrs * 2;
        let hrs = totalHrs;
        if (hrs < 1) {
            hrs = 0;
        }

        const shingles = await this.shingle.getShingles();
        const labor_category_travel_hour = await this.general.getConstDecimalValue('labor_category_travel_hour');
        const labor_price_travel_hour = await this.general.getConstDecimalValue('labor_price_travel_hour');

        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const laborPrice = laborPrices.find(price => price.id == labor_price_travel_hour);

        for (const shingle of shingles) {
            const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
            laborCalculation.qty = hrs;
            laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
            laborCalculation.category = labor_category_travel_hour;
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
            laborCalculation.value = +laborPrice.price * hrs;
            laborCalculation.id_material_price_list = null;
            laborCalculation.id_price_list = null;
            laborCalculation.id_material_type_shingle = shingle.id_material_type;
            laborCalculation.sqlf = totalHrs;
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }
}
