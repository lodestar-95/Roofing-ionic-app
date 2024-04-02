import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
    providedIn: 'root',
})
export class SkylightsService {
    private materialList: any;

    constructor(
        private shingleService: ShinglesService,
        private general: GeneralService
    ) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        let skylights = [];
        const small = this.getQuantitySmallSkylights(building.psb_measure);
        const large = this.getQuantityLargeSkylights(building.psb_measure);
        const shingles = await this.shingleService.getShingles();

        const category_skylight_small = await this.general.getConstValue('category_skylight_small');
        console.log('materials.category_skylight_small');
        console.log(category_skylight_small);
        const materialSmall = this.general.getFirstMaterial(this.materialList, category_skylight_small);
        if (!materialSmall) throw new NotFoundMaterialException('Skylight Small');

        const calculationsSmall = await this.general.calculatePiecesCost(small, materialSmall, shingles);
        skylights.push(...calculationsSmall);

        const category_skylight_large = await this.general.getConstValue('category_skylight_large');
        const materialLarge = this.general.getFirstMaterial(this.materialList, category_skylight_large);
        if (!materialLarge) throw new NotFoundMaterialException('Skylight Large');

        const calculationsLarge = await this.general.calculatePiecesCost(large, materialLarge, shingles);
        skylights = [...skylights, ...calculationsLarge];

        return skylights;
    }

    private getQuantitySmallSkylights(psbMeasure: PsbMeasures) {
        return psbMeasure?.psb_skylights
            ?.filter(x => !x.deletedAt && x.id_skylight_size == 1)
            ?.length ?? 0;
    }

    private getQuantityLargeSkylights(psbMeasure: PsbMeasures) {
        return psbMeasure?.psb_skylights
            ?.filter(x => !x.deletedAt && x.id_skylight_size == 2)
            ?.length ?? 0;
    }
}
