import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { PsbMeasures } from 'src/app/models/psb-measures.model';

@Injectable({
    providedIn: 'root',
})
export class cMetalService {
    private materialList: any;

    constructor(private general: GeneralService,
        private shingles: ShinglesService) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculateCMetalMeasures(building: Building) {
        let calculations = await this.calculateCMetalCost(building.psb_measure);

        const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');
        if (building.id_job_type != job_types_overlay)
            calculations = calculations.map(x => ({ ...x, sq: 0, qty: 0, value: 0, sqlf: 0 }));

        return calculations;
    }

    private async calculateCMetalCost(measures: PsbMeasures) {
        let cMetalCalculations = [];
        const shingles = await this.shingles.getShingles();
        const category_c_metal = await this.general.getConstValue('category_c_metal');

        const cMetalMaterials = this.general.getMaterial(this.materialList, category_c_metal);
        const cMetalMaterial = cMetalMaterials && cMetalMaterials.length > 0 ? cMetalMaterials[0] : null;
        if (!cMetalMaterial)
            return;

        let cMetalsLF = [];
        cMetalsLF[cMetalMaterial.id_material_type] = this.general.parseNumber(measures.eves_starters_lf_steep_slope)
            + this.general.parseNumber(measures.rakes_lf_steep_slope);

        let cMetalLong = 0;
        for (let [key, cMetalLF] of cMetalsLF.entries()) {
            if (cMetalLF && cMetalLF > 0) {
                cMetalLong = cMetalLF * (1 + (measures.wasting * 0.01));
                const cMetal = cMetalMaterials.find(cMetal => cMetal.id_material_type == key);
                if (cMetal) {
                    let newDMetal = await this.general.calculateLFCoverageCost(cMetalLong, cMetal, shingles);
                    cMetalCalculations = [].concat(cMetalCalculations, newDMetal);
                }
            }
        }
        return cMetalCalculations;
    };
}
