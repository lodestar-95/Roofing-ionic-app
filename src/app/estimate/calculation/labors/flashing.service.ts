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
export class FlashingService {

    constructor(private catalogs: CatalogsService,
        private general: GeneralService,
        private shingle: ShinglesService) { }

    async calculateLabor(building: Building, calculations) {
        const shingles = await this.shingle.getShingles();
        const laborPrices = (await this.catalogs.getLaborPrices()).data;

        const stepFlashingLF = this.general.parseNumber(building?.psb_measure?.flash_step_4_4_8_lf) + this.general.parseNumber(building?.psb_measure?.flash_step_4_4_12_lf);
        const flashingCalculations = await this.calculateFlashing(stepFlashingLF, shingles, laborPrices);

        const chimney_flashing_small_size_limit = await this.general.getConstDecimalValue('chimney_flashing_small_size_limit');

        const smallChimneyFlashing = this.getFlashingSmallChimneyLF(building.psb_measure, chimney_flashing_small_size_limit);
        const shimneySmallCalculations = await this.calculateSmallChimney(smallChimneyFlashing, shingles, laborPrices);

        const largeChimneyFlashing = this.getFlashingLargeChimneyLF(building.psb_measure, chimney_flashing_small_size_limit);
        const shimneyLargeCalculations = await this.calculateLargeChimney(largeChimneyFlashing, shingles, laborPrices);


        return [...flashingCalculations, ...shimneySmallCalculations, ...shimneyLargeCalculations];
    }

    private async calculateFlashing(quantity, shingles, laborPrices) {
        const laborCalculationList = [];

        const labor_category_step_flashing = await this.general.getConstDecimalValue('labor_category_step_flashing');
        const labor_price_step_flashing = await this.general.getConstDecimalValue('labor_price_step_flashing');
        const laborPrice = laborPrices.find(price => price.id == labor_price_step_flashing);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category_step_flashing, shingle);
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }

    private async calculateSmallChimney(quantity, shingles, laborPrices) {
        const laborCalculationList = [];

        const labor_category_chimney_small = await this.general.getConstDecimalValue('labor_category_chimney_small');
        const labor_price_chimney_small = await this.general.getConstDecimalValue('labor_price_chimney_small');
        const laborPrice = laborPrices.find(price => price.id == labor_price_chimney_small);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category_chimney_small, shingle);
            laborCalculationList.push(laborCalculation);
        }
        return laborCalculationList;
    }

    private getFlashingSmallChimneyLF(psbMeasure: PsbMeasures, limit) {
        return psbMeasure?.psb_chimneys
            ?.filter(x => !x.deletedAt && ((+x.lenght) + this.getFractionValue(x.f_lenght)) < limit)
            ?.length ?? 0;
    }

    private getFlashingLargeChimneyLF(psbMeasure: PsbMeasures, limit) {
        return psbMeasure?.psb_chimneys
            ?.filter(x => !x.deletedAt && ((+x.lenght) + this.getFractionValue(x.f_lenght)) >= limit)
            ?.length ?? 0;
    }

    private getFractionValue(fraction) {
        switch (fraction) {
            case '1/8': return 1 / 8;
            case '1/4': return 1 / 4;
            case '3/8': return 3 / 8;
            case '1/2': return 1 / 2;
            case '5/8': return 5 / 8;
            case '3/4': return 3 / 4;
            case '7/8': return 7 / 8;
            default: return 0;
        }
    }

    private async calculateLargeChimney(quantity, shingles, laborPrices) {
        const laborCalculationList = [];
        const labor_category_chimney_large = await this.general.getConstDecimalValue('labor_category_chimney_large');
        const labor_price_chimney_large = await this.general.getConstDecimalValue('labor_price_chimney_large');
        const laborPrice = laborPrices.find(price => price.id == labor_price_chimney_large);

        for (const shingle of shingles) {
            const laborCalculation = this.getCalculationObj(quantity, laborPrice, labor_category_chimney_large, shingle);
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
