import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { ERRORS } from '../const';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
    providedIn: 'root',
})
export class SaddleMetalService {
    private materialList: any;

    constructor(
        private shingleService: ShinglesService,
        private general: GeneralService
    ) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        let lf = this.getSkylightsSaddleMetalLF(building.psb_measure);
        lf += this.getChimneysSaddleMetalLF(building.psb_measure);

        const category_saddle_metal = await this.general.getConstValue('category_saddle_metal');
        const material = this.general.getFirstMaterial(this.materialList, category_saddle_metal);
        if (!material) throw new NotFoundMaterialException('Saddle Metal');

        const shingles = await this.shingleService.getShingles();

        return await this.general.calculateLFCoverageCost(lf, material, shingles);
    }

    private getSkylightsSaddleMetalLF(psbMeasure: PsbMeasures) {
        return psbMeasure?.psb_skylights
            ?.filter(x => !x.deletedAt)
            ?.map(x => this.general.convertFractionalToDecimal(x.width, x.f_width))
            ?.filter(x => this.general.parseNumber(x) < 30)
            ?.reduce((previous, current) => (previous + current) + 3, 0) ?? 0;
    }

    private getChimneysSaddleMetalLF(measure: PsbMeasures) {
        return measure?.psb_chimneys
            ?.filter(x => !x.deletedAt)
            ?.map(x => this.general.convertFractionalToDecimal(x.width, x.f_width))
            ?.filter(x => this.general.parseNumber(x) < 30)
            ?.reduce((previous, current) => (previous + current) + 3, 0) ?? 0;
    }
}
