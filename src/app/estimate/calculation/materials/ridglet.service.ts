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
export class RidgletService {
    private materialList: any;

    constructor(
        private shingle: ShinglesService,
        private general: GeneralService
    ) { }


    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        const lf = this.getRigletLF(building.psb_measure);
        const category_ridglet = await this.general.getConstValue('category_ridglet');
        const material = this.general.getFirstMaterial(this.materialList, category_ridglet);
        if (!material) throw new NotFoundMaterialException('Ridglet');

        const shingles = await this.shingle.getShingles();

        return await this.general.calculateLFCoverageCost(lf, material, shingles);
    }

    getRigletLF(measures: PsbMeasures) {
        const chimneys = (measures?.psb_chimneys?.filter(x => x.need_ridglet == true && !x.deletedAt)
            ?.map(x => x.ridglet_lf)
            ?.reduce((previous, current) => previous + current, 0) ?? 0);
        let lf = 1 * (chimneys?chimneys:0);

        const cricketEw = (measures?.psb_crickets?.filter(x => x.is_ridglet_ew && !x.deletedAt)
            ?.map(x => x.endwall_lf)
            ?.reduce((previous, current) => previous + current, 0) ?? 0);
        lf += 1 * (cricketEw?cricketEw:0);

        const cricketSw = (measures?.psb_crickets?.filter(x => x.is_ridglet_sw && !x.deletedAt)
            ?.map(x => x.sidewall_lf)
            ?.reduce((previous, current) => previous + current, 0) ?? 0);
        lf += 1 * (cricketSw?cricketSw:0);
        return lf;
    }
}
