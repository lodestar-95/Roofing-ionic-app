import { Injectable } from '@angular/core';
import { ERRORS } from '../const';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class OsbService {
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
  async calculateOsbMeasures(building) {
    let measures = building.psb_measure;
    const wasting = building.psb_measure.wasting * 0.01;
    if (building.psb_measure.psb_slopes == null) return ERRORS.NO_SLOPE;
    let osbSQ = this.calculateOsbSQ(building.psb_measure.psb_slopes, wasting);
    let sacapCalculation = await this.calculateOsbCost(measures, osbSQ);
    return sacapCalculation;
  };

  /**
   *
   * @param measures
   * @param obsSQ
   * @returns
   */
  async calculateOsbCost(measures, obsSQ) {
    let shingles = await this.shingle.getShingles();

    const category_osb = await this.general.getConstValue('category_osb');
    const osb = this.general.getFirstMaterial(this.materialList, category_osb);
    if (!osb) throw new NotFoundMaterialException('OSB');
    
    const category_staples = await this.general.getConstValue('category_staples');
    const staples = this.general.getFirstMaterial(this.materialList, category_staples);
    if (!staples) throw new NotFoundMaterialException('Staples');

    const category_clips = await this.general.getConstValue('category_clips')
    const clips = this.general.getFirstMaterial(this.materialList, category_clips);
    if (!clips) throw new NotFoundMaterialException('Clips');

    let obsCalculations = await this.general.calculateSQCoverageCost(
      obsSQ,
      osb,
      shingles
    );
    let staplesCalculations = await this.general.calculateSQCoverageCost(
      obsSQ,
      staples,
      shingles
    );
    let clipsCalculations = await this.general.calculateSQCoverageCost(
      obsSQ,
      clips,
      shingles
    );
    return [].concat(
      obsCalculations,
      staplesCalculations,
      clipsCalculations
    );
  }

  /**
   *
   * @param slopes
   * @param wasting
   * @returns
   */
  calculateOsbSQ = (slopes, wasting) => {
    if (slopes == null) return ERRORS.NO_SLOPE;

    let osbSlopesSQ = 0;

    for (let slope of slopes) {
      if(slopes.deletedAt == null){
        osbSlopesSQ += this.general.calculateSlopesSQObs(slope, wasting);
      }
    }
    return osbSlopesSQ;
  };
}
