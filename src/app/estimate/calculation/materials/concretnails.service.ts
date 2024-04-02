import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class ConcretNailsService {
  private materialList: any;

  constructor(
    private general: GeneralService,
    private shingles: ShinglesService
  ) { }

  public setMaterialList(value: any) {
    this.materialList = value;
  }

  async calculate(building: Building) {
    const lf = this.getChimneyConcretNails(building.psb_measure) + this.getCricketSideWallConcretNails(building.psb_measure) + this.getCricketEndWallConcretNails(building.psb_measure);
    const category_concret_nails = await this.general.getConstValue('category_concret_nails');
    const material = this.general.getFirstMaterial(this.materialList, category_concret_nails);
    
    if (!material)
      throw new NotFoundMaterialException('Concret Nails');

    const shingles = await this.shingles.getShingles();

    return await this.general.calculateLFCoverageCost(lf, material, shingles);
  }

  private getChimneyConcretNails(psbMeasure: PsbMeasures) {
    let lf = 1 * psbMeasure?.psb_chimneys
      ?.filter(x => x.need_ridglet == true && !x.deletedAt)
      ?.map(x => x.ridglet_lf)
      ?.reduce((previous, current) => previous + current, 0) ?? 0;
    lf = (!lf || lf == 0) ? 0 : lf + 1;
    return isNaN(lf) ? 0 : lf;
  }

  private getCricketSideWallConcretNails(psbMeasure: PsbMeasures) {
    let lf = 1 * psbMeasure?.psb_crickets
      ?.filter(x => x.is_ridglet_sw == true && !x.deletedAt)
      ?.map(x => x.sidewall_lf)
      ?.reduce((previous, current) => previous + current, 0) ?? 0;
    lf = (!lf || lf == 0) ? 0 : lf + 1;
    return isNaN(lf) ? 0 : lf;
  }

  private getCricketEndWallConcretNails(psbMeasure: PsbMeasures) {
    let lf = 1 * psbMeasure?.psb_crickets
      ?.filter(x => x.is_ridglet_ew == true && !x.deletedAt)
      ?.map(x => x.endwall_lf)
      ?.reduce((previous, current) => previous + current, 0) ?? 0;
    lf = (!lf || lf == 0) ? 0 : lf + 1;
    return isNaN(lf) ? 0 : lf;
  }
}
