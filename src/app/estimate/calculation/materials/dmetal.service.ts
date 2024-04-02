import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class DmetalService {
  private materialList: any;

  constructor(
    private general: GeneralService,
    private shingles: ShinglesService
  ) { }

  public setMaterialList(value: any) {
    this.materialList = value;
  }

  /**
   *
   * @param building
   * @returns
   */

  async calculateDMetalMeasures(building: Building) {
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');
    let calculations = await this.calculateDMetalCost(building.psb_measure);
    
    if(building.id_job_type == job_types_overlay){
      calculations = calculations.map(x => ({ ...x, sq: 0, qty: 0, value: 0, sqlf: 0 }));
    }

    return calculations;
  }

  /**
   *
   * @param measures
   * @returns
   */
  async calculateDMetalCost(measures, includeFlatRoof = true) {
    let dMetalCalculations = [];
    let shingles = await this.shingles.getShingles();
    const category_drip_metal = await this.general.getConstValue('category_drip_metal');
    let dmetals = this.general.getMaterial(this.materialList, category_drip_metal);

    if (!dmetals || dmetals.lenght==0)
      throw new NotFoundMaterialException('Drip Metal');

    let dmetalsLF = [];
    dmetals.forEach((dmetal) => {
      dmetalsLF[dmetal.id_material_type] = 0;
    });

    if (includeFlatRoof) {
      dmetalsLF[measures.id_metal_eves_rakes_flat_roof] +=
        measures.eves_rakes_lf_flat_roof ?? 0;
    }
    dmetalsLF[measures.id_metal_eves_starters_low_slope] +=
      (measures.eves_starters_lf_low_slope ?? 0) +
      (measures.eves_starters_lf_steep_slope ?? 0);
    dmetalsLF[measures.id_metal_rakes_low_steep_slope] += 1* (measures.rakes_lf_low_steep_slope ?? 0) 
    dmetalsLF[measures.id_metal_rakes_low_steep_slope] += 1* (measures.rakes_lf_steep_slope ?? 0);
    const general = this.general;
    let dmetalLong = 0;
    for (let [key, dmetalLF] of dmetalsLF.entries()) {
      if (dmetalLF && dmetalLF > 0) {
        dmetalLong = dmetalLF * (1 + (measures.wasting * 0.01));
        let dmetal = dmetals.find((dmetal) => dmetal.id_material_type == key);
        if(dmetal){
          let newDmetal = await general.calculateLFCoverageCost(dmetalLong, dmetal, shingles);
          dMetalCalculations = [].concat(dMetalCalculations, newDmetal);
        }
      }
    }
    return dMetalCalculations;
  };
}
