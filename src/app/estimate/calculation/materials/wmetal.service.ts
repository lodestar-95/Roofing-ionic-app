import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
    providedIn: 'root',
})
export class WMetalService {
    private materialList: any;

    constructor(private catalog: CatalogsService,
        private shingle: ShinglesService,
        private general: GeneralService) {
    }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building) {
        const upgrade_w_metal = await this.general.getConstDecimalValue('upgrade_w_metal');
        const wMetalUpgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_w_metal);

        const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
        const isWMetalBuiltin = (wMetalUpgrade?.id_cost_integration ?? 0) == cost_integration_built_in;

        const category_w_metal = await this.general.getConstValue('category_w_metal');
        const material = this.general.getFirstMaterial(this.materialList, category_w_metal);
        if (!material) throw new NotFoundMaterialException('W Metal');
        
        let allShingles = await this.shingle.getShingles();
        let shingles = [...allShingles];

        const category_architectural_thick = await this.general.getConstValue('category_architectural_thick_shingle');
        const category_presidential_shingle = await this.general.getConstValue('category_presidential_shingle');
        const category_presidential_tl_shingle = await this.general.getConstValue('category_presidential_tl_shingle');

        if (!isWMetalBuiltin) {
            shingles = allShingles.filter((material) =>
                material?.id_material_category == category_architectural_thick
                || material?.id_material_category == category_presidential_shingle
                || material?.id_material_category == category_presidential_tl_shingle);
        }
        let lf = (building?.psb_measure?.valleys_lf_low_slope ?? 0) + (building?.psb_measure?.valleys_lf_steep_slope ?? 0);
        lf += 1*(+this.getCricketsValleyMetal(building));

        let calculations = [];
        for (const shingle of allShingles) {
            if (shingles.some(x => x.id_material_type == shingle.id_material_type)) {
                const calculation = await this.general.calculateLFCoverageCostJustOneShingle(lf, material, shingle);
                calculations.push(calculation);
            } else {
                const calculation = await this.general.calculateLFCoverageCostJustOneShingle(0, material, shingle);
                calculations.push(calculation);
            }
        }

        return calculations;
    }

    private getCricketsValleyMetal(building: Building) {
        let x = building?.psb_measure?.psb_crickets
            ?.map(x => (1*(x.first_valley_lf ?? 0)) + (1*(x.second_valley_lf ?? 0)))
            ?.reduce((previous, current) => previous + (1*current), 0) ?? 0;
            return x;
    }
}