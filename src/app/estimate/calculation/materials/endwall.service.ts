import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
    providedIn: 'root',
})
export class EndWallService {
    private materialList: any;

    constructor(
        private general: GeneralService,
        private shingle: ShinglesService
    ) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        let lf = 1 * this.getChimneyEndWallLF(building.psb_measure);
        lf += 1 * this.getSlylightEndWallLF(building.psb_measure);
        lf += 1 * this.getFlashEndWall(building.psb_measure);

        const category_end_wall_metal = await this.general.getConstValue('category_end_wall_metal');
        const material = this.general.getFirstMaterial(this.materialList, category_end_wall_metal);
        if (!material)
            throw new NotFoundMaterialException('End Wall Metal');
        const shingles = await this.shingle.getShingles();

        return await this.general.calculateLFCoverageCost(lf, material, shingles);
    }



    private getChimneyEndWallLF(measures: PsbMeasures) {
        return measures.psb_chimneys
            ?.filter(x => !x.deletedAt)
            ?.map(x => this.general.convertFractionalToDecimal(x.width, x.f_width) / 12)
            ?.reduce((previous, current) => previous + (1 * current), 0) ?? 0;
    }

    private getSlylightEndWallLF(measures: PsbMeasures) {
        return measures.psb_skylights
            ?.filter(x => !x.deletedAt)
            ?.map(x => this.general.convertFractionalToDecimal(x.width, x.f_width) / 12)
            ?.reduce((previous, current) => previous + (1 * current), 0) ?? 0;
    }

    private getFlashEndWall(measures: PsbMeasures) {
        const lf = 1 * (measures?.flash_end_wall_metal_3_5_10_lf ?? 0);
        return lf == 0
            ? lf
            : lf < 10
                ? (lf + 1)
                : (lf + 0.5);
    }
}