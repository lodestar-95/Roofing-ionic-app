import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class VentingsService {
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
  async calculateVentingMeasures(building) {
    return await this.calculateVentingCost(building.psb_measure);
  };

  /**
   *
   * @param building
   * @returns
   */
  async calculateVentingCost(measures) {
    let ventilationCalculations = [];
    const shingles = await this.shingle.getShingles();

    const category_jvent4 = await this.general.getConstValue('category_jvent4');
    const jVent4 = this.general.getFirstMaterial(this.materialList, category_jvent4);
    if (!jVent4) throw new NotFoundMaterialException('Jvent 4');

    const category_jvent6 = await this.general.getConstValue('category_jvent6');
    const jVent6 = this.general.getFirstMaterial(this.materialList, category_jvent6);
    if (!jVent6) throw new NotFoundMaterialException('Jvent 6');

    const category_metal_artict_vents = await this.general.getConstValue('category_metal_artict_vents');
    const metalArtictVent = this.general.getFirstMaterial(this.materialList,category_metal_artict_vents);
    if (!metalArtictVent) throw new NotFoundMaterialException('Metal Artict Vents');

    const category_solar_power_vents = await this.general.getConstValue('category_solar_power_vents');
    const solarPowerVent = this.general.getFirstMaterial(this.materialList,category_solar_power_vents);
    if (!solarPowerVent) throw new NotFoundMaterialException('Solar Power Vents');

    const category_power_vents = await this.general.getConstValue('category_power_vents');
    const powerVent = this.general.getFirstMaterial(this.materialList, category_power_vents);
    if (!powerVent) throw new NotFoundMaterialException('Power Vents');

    const category_ridgevents = await this.general.getConstValue('category_ridgevents');
    const ridgevents = this.general.getMaterial(this.materialList, category_ridgevents);

    const x = await this.general.calculatePiecesCost(
      measures.vent_j_vent_4_pc,
      jVent4,
      shingles
    );
    const y = await this.general.calculatePiecesCost(
      measures.vent_j_vent_6_pc,
      jVent6,
      shingles
    );
    const metal_artict_vent_pc = (measures.vent_metal_artict_replace_pc
      ? measures.vent_metal_artict_replace_pc
      : 0) + (measures.vent_metal_artict_cut_in_pc
        ? measures.vent_metal_artict_cut_in_pc
        : 0);

    const z = await this.general.calculatePiecesCost(
      metal_artict_vent_pc,
      metalArtictVent,
      shingles
    );
    const w = await this.general.calculatePiecesCost(
      measures.vent_solar_power_vent_pc,
      solarPowerVent,
      shingles
    );
    const v = await this.general.calculatePiecesCost(
      measures.vent_power_vent_pc,
      powerVent,
      shingles
    );

//In place
//In place and to be replaced
//Add new
//Ridgevent as upgrade

    let ridgeVentLF = measures.vent_is_ridgevent_in_place ? measures.vent_ridgevent_lf ?? measures.ridge_lf : measures.ridge_lf ?? measures.vent_ridgevent_lf;
    if(!measures.vent_is_ridgevent_in_place){
      ridgeVentLF = 0;
    }

    ridgeVentLF = ridgeVentLF * (1 + ((measures.wasting * 0.01) / 2))
    let u = await this.general.calculateRidgeventsCost(
      ridgeVentLF,
      ridgevents,
      measures,
      category_ridgevents,
      shingles
    );
    ventilationCalculations = [].concat(x, y, z, w, v, u);
    ventilationCalculations = ventilationCalculations.filter(Boolean);
    return ventilationCalculations;
  }
}
