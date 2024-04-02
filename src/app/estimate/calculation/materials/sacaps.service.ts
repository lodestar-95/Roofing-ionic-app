import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { ERRORS } from '../const';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class SacapsService {
  private materialList: any;

  constructor(
    private shingle: ShinglesService,
    private general: GeneralService
  ) { }

  public setMaterialList(value: any) {
    this.materialList = value;
  }

  /**
   *
   * @param building
   * @returns
   */
  async calculateSACapsMeasures (building) {
    const measures = building.psb_measure;
    const wasting = building.psb_measure.wasting;
    if (building.psb_measure.psb_slopes == null) {
      return ERRORS.NO_SLOPE
    };

    let sacapSQ = this.general.calculateFlatRoofSQ(building.psb_measure.psb_slopes, wasting);
    sacapSQ += this.getCricketsSACap(building);

    const sacapCalculation = await this.calculateSACapsCost(measures, sacapSQ);
    return sacapCalculation;
  };

  getCricketsSACap(building: Building) {
    const areas = building?.psb_measure?.psb_crickets?.filter(x => x.pitch < 3 && !x.deletedAt)?.map(x => x.area) ?? [];
    if (areas.length == 0) {
      return 0;
    }
    else {
      return areas.reduce((previous, current) => previous + (1*current), 0);
    }
  }

  /**
   *
   * @param building
   * @returns
   */
  async calculateSACapsCost(measures, sacapSQ) {
    const shingles = await this.shingle.getShingles();
    const category_sa_cap = await this.general.getConstValue('category_sa_cap');
    let sacapCalculations = [];
    shingles.forEach(async (shingle) => {
      const sacap = this.general.getMaterial(this.materialList, category_sa_cap).filter(x => x.id_trademark == shingle.id_trademark)[0];
      if (!sacap) throw new NotFoundMaterialException('SA Cap');
      console.log('>>>>SA CAP');
      console.log(sacap);
      console.log(shingle);
      sacapCalculations.push(await this.general.calculateSQCoverageCostJustOneShingle(
        sacapSQ,
        sacap,
        shingle
      ));
    });
    console.log('>>>>>>>>>>>>>>>>>>>++++++++++++++++sacapCalculations');
    console.log(sacapCalculations);
    return sacapCalculations;
  };
}
