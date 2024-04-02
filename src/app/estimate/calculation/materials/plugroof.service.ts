import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
    providedIn: 'root',
})
export class PlugRoofService {
    private materialList: any;

    constructor(private shingle: ShinglesService,
        private general: GeneralService) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        const quantity = building?.psb_measure?.vent_metal_artict_remove_pc??0;

        const category_smart_plug_roof_patch = await this.general.getConstValue('category_smart_plug_roof_patch');
        const material = this.general.getFirstMaterial(this.materialList, category_smart_plug_roof_patch);
        if (!material) throw new NotFoundMaterialException('Smart Plug Roof Patch');

        const shingles = await this.shingle.getShingles();

        return await this.general.calculatePiecesCost(quantity, material, shingles);
    }
}
