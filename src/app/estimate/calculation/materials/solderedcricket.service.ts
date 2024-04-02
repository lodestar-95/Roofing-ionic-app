import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
    providedIn: 'root',
})
export class SolderedCricketService {
    private materialList: any;

    constructor(
        private general: GeneralService,
        private shingle: ShinglesService
    ) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        const hasCrickets = (building.psb_measure.psb_crickets?.filter(x => !x.deletedAt)?.length ?? 0) > 0;
        const chimney30Count = !hasCrickets ? 0 : building?.psb_measure?.psb_chimneys?.filter(x =>{
            return x.width >= 30 
            && !x.cricket_exists 
            && !x.deletedAt
        })?.length ?? 0;

        const category_soldered_cricket = await this.general.getConstValue('category_soldered_cricket');
        const material = this.general.getMaterial(this.materialList, category_soldered_cricket)[0];
        if (!material) throw new NotFoundMaterialException('Soldered Cricket');

        const shingles = await this.shingle.getShingles();

        return await this.general.calculatePiecesCost(chimney30Count, material, shingles,false);
    }

}