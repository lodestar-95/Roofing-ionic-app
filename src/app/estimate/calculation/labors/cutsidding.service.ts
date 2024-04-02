import { Injectable } from '@angular/core';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
@Injectable({
    providedIn: 'root',
})
export class CutSiddingService {

    constructor(private catalogs: CatalogsService,
        private general: GeneralService,
        private shingle: ShinglesService) { }

    async calculateLabor(building, calculations) {
        const laborCalculationList = [];
        const shingles = await this.shingle.getShingles();
        const labor_category_cut_siding = await this.general.getConstDecimalValue('labor_category_cut_siding');
        const wall_material_sidding = await this.general.getConstDecimalValue('wall_material_sidding');
        const labor_price_cut_siding = await this.general.getConstDecimalValue('labor_price_cut_siding');
        let quantity = 1 * (building?.psb_measure?.vent_cut_sidding_walls_lf ?? 0);
        for (let cricket of building?.psb_measure?.psb_crickets ?? []) {
            if (cricket.id_wall_material_sw == wall_material_sidding) {
                quantity += 1 * cricket.sidewall_lf
            }
            if (cricket.id_wall_material_ew == wall_material_sidding) {
                quantity += 1 * cricket.endwall_lf
            }
        }
        for (let chimney of building?.psb_measure?.psb_chimneys ?? []) {
            if (chimney.need_cutsidding) {
                quantity += (this.general.convertFractionalToDecimal(chimney.width, chimney.f_width) * 2) / 12;
                quantity += (this.general.convertFractionalToDecimal(chimney.lenght, chimney.f_lenght) * 2) / 12;
            }
        }
        const laborPrices = (await this.catalogs.getLaborPrices()).data;
        const laborPrice = laborPrices.find(price => price.id == labor_price_cut_siding);

        for (const shingle of shingles) {
            const laborCalculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
            laborCalculation.qty = quantity;
            laborCalculation.calculation_type = 'Costo de ' + laborPrice.labor;
            laborCalculation.category = labor_category_cut_siding;
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
