import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
    providedIn: 'root',
})
export class BaseSheetService {
    private materialList: any;

    constructor(private shingle: ShinglesService,
        private general: GeneralService) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        const quantity = this.getCricketsBaseSheet(building.psb_measure)
                          + this.getFlatAreaOnCompleteRoof(building.psb_measure);
        const category_base_sheet = await this.general.getConstValue('category_base_sheet');
        const materials = this.general.getMaterial(this.materialList, category_base_sheet);
        const shingles = await this.shingle.getShingles();

        let calculations = [];
        for (const shingle of shingles) {
            const material = materials.find(x => x.id_trademark == shingle.id_trademark);

            if (!material)
                throw new NotFoundMaterialException('Base Sheet');

            const calculation = await this.general.calculateSQCoverageCostJustOneShingle(quantity, material, shingle);
            calculations.push(calculation);
        }

        return calculations;
    }

    getCricketsBaseSheet(measures) {
        const areas = measures?.psb_crickets?.filter(x => x.pitch < 3 && !x.deletedAt)?.map(x => x.area) ?? [];
        if (areas.length == 0) {
            return 0;
        } else {
            const sq = areas.reduce((previous, current) => previous + current, 0);
            return this.general.parseNumber(sq);
        }
    }

    getFlatAreaOnCompleteRoof(measure: PsbMeasures) {
        const isCompleteRoof = measure.id_inwshield_rows == 4;
        if (!isCompleteRoof) return 0;

        const sq = this.general.calculateFlatRoofSQ(
            measure.psb_slopes,
            measure.wasting
        );

        return this.general.parseNumber(sq);
    }
}
