import { Injectable } from '@angular/core';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { Building } from 'src/app/models/building.model';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class FlashingService {
  private materialList: any;
  private isOverlayJob = false;

  constructor(
    private shingle: ShinglesService,
    private general: GeneralService,
    private catalog: CatalogsService
  ) { }

  public setMaterialList(value: any) {
    this.materialList = value;
  }

  async calculateFlashingMeasures(building: Building) {
    const overlayJobId = await this.general.getConstDecimalValue('job_types_overlay');
    this.isOverlayJob = building.id_job_type == overlayJobId;
    return await this.calculateFlashingCost(building.psb_measure);
  }

  private async calculateFlashingCost(measures) {
    const shingles = await this.shingle.getShingles();

    const category_step_flashing4x4x8 = await this.general.getConstValue('category_step_flashing4x4x8');
    const step4x4x8 = this.general.getFirstMaterial(this.materialList, category_step_flashing4x4x8);
    if (!step4x4x8) throw new NotFoundMaterialException('Step Flashing 4x4x8');
    
    const category_step_flashing4x4x12 = await this.general.getConstValue('category_step_flashing4x4x12');
    const step4x4x12 = this.general.getFirstMaterial(this.materialList, category_step_flashing4x4x12);
    if (!step4x4x12) throw new NotFoundMaterialException('Step Flashing 4x4x12');
    
    const category_rolled_metal = await this.general.getConstValue('category_rolled_metal');
    const rolledMetal = this.general.getFirstMaterial(this.materialList, category_rolled_metal);
    if (!rolledMetal) throw new NotFoundMaterialException('Rolled Metal');
    
    const category_pipe_flashing3in1 = await this.general.getConstValue('category_pipe_flashing3in1');
    const pipe3in1 = this.general.getFirstMaterial(this.materialList, category_pipe_flashing3in1)
    if (!pipe3in1) throw new NotFoundMaterialException('Pipe Flashing 3 in 1');
    
    const category_pipe_flashing2in1 = await this.general.getConstValue('category_pipe_flashing2in1');
    const pipe2in1 = this.general.getFirstMaterial(this.materialList, category_pipe_flashing2in1);
    if (!pipe2in1) throw new NotFoundMaterialException('Pipe Flashing 2 in 1');
    
    const category_retrofit_pipe_flashing = await this.general.getConstValue('category_retrofit_pipe_flashing');
    const retrofit = this.general.getFirstMaterial(this.materialList, category_retrofit_pipe_flashing);
    if (!retrofit) throw new NotFoundMaterialException('Retrofit Pipe Flashing');

    const pipe3in1Cost = await this.general.calculatePiecesCost(measures.flash_pipe_3_in_1_pc, pipe3in1, shingles);
    const pipe2in1Cost = await this.general.calculatePiecesCost(measures.flash_pipe_2_in_1_pc, pipe2in1, shingles);
    const retrofitCost = await this.general.calculatePiecesCost(measures.flash_retrofit_pipe_pc, retrofit, shingles);

    let stepFlashing448LF = (measures.flash_step_4_4_8_lf ?? 0) * 1;
    let stepFlashing4412LF = (measures.flash_step_4_4_12_lf ?? 0) * 1;
    //TODO: validar que calcule ambos valores porque parece que solo suma 1 (chimney o skylight, no sé cual)
    if (stepFlashing448LF && stepFlashing448LF > 0) {
      stepFlashing448LF += this.getStepFlashingChimneyLF(measures);
      stepFlashing448LF += this.isOverlayJob ? 0 : this.getStepFlashingSkylightLF(measures);
    } else if (stepFlashing4412LF && stepFlashing4412LF > 0) {
      stepFlashing4412LF += this.getStepFlashingChimneyLF(measures);
      stepFlashing4412LF += this.isOverlayJob ? 0 : this.getStepFlashingSkylightLF(measures);
    }

    stepFlashing448LF = this.general.plusWasting(stepFlashing448LF, measures.wasting);
    stepFlashing4412LF = this.general.plusWasting(stepFlashing4412LF, measures.wasting);

    const flashing4x4x8Cost = await this.general.calculateLFCoverageCost(stepFlashing448LF, step4x4x8, shingles);
    const flashing4x4x12Cost = await this.general.calculateLFCoverageCost(stepFlashing4412LF, step4x4x12, shingles);

    let rolledMetalLF = 1 * measures.flash_rolled_metal_20_50_lf;
    rolledMetalLF += await this.getCricketsRollMetalLF(measures);
    rolledMetalLF += await this.getChimneyRollMetalLF(measures);

    const rolledMetalCost = await this.general.calculateLFCoverageCost(rolledMetalLF, rolledMetal, shingles);

    let flashingCalculations = [].concat(pipe3in1Cost, pipe2in1Cost, retrofitCost, flashing4x4x8Cost, flashing4x4x12Cost, rolledMetalCost);
    flashingCalculations = flashingCalculations.filter(Boolean);
    return flashingCalculations;
  }

  private async getCricketsRollMetalLF(psbMeasure: PsbMeasures) {
    const generals = (await this.catalog.getGeneral()).data;
    const rollMetalCrickets = generals.find(x => x.key == 'rolled_metal_crickets').value;
    return (psbMeasure?.psb_crickets?.filter(x => !x.deletedAt)?.length ?? 0) * (+rollMetalCrickets);
  }

  private async getChimneyRollMetalLF(psbMeasure: PsbMeasures) {
    const generals = (await this.catalog.getGeneral()).data;
    const rollMetalChimneys = generals.find(x => x.key == 'rolled_metal_chimneys').value;
    return (psbMeasure?.psb_chimneys?.filter(x => (x.cricket_exists == true || x.width < 30) && !x.deletedAt)?.length ?? 0) * (+rollMetalChimneys);
  }

  private getStepFlashingChimneyLF(psbMeasure: PsbMeasures) {
    const stepFlash = psbMeasure?.psb_chimneys
      ?.filter(x => !x.deletedAt)
      ?.map(x => (this.general.convertFractionalToDecimal(x.lenght, x.f_lenght) * 2) / 12)
      ?.reduce((previous, current) => previous + current, 0) ?? 0;

    if (stepFlash == 0) {
      return 0;
    }
    return (stepFlash / 12);
  }

  private getStepFlashingSkylightLF(psbMeasure: PsbMeasures) {
    const stepFlashing = psbMeasure?.psb_skylights
      ?.filter(x => !x.deletedAt)
      ?.map(x => (this.general.convertFractionalToDecimal(x.lenght, x.f_lenght) * 2) / 12)
      ?.reduce((previous, current) => previous + current, 0) ?? 0;
    if (stepFlashing == 0) {
      return 0;
    }
    return stepFlashing;
  }
}
