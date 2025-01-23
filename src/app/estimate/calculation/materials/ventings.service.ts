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

    const category_soffit_vents_6_16 = await this.general.getConstValue('category_soffit_vents_6_16');
    const soffitVents616 = this.general.getFirstMaterial(this.materialList, category_soffit_vents_6_16);
    if (!soffitVents616) throw new NotFoundMaterialException('Soffit vents 6 16');

    const category_soffit_vents_4_16 = await this.general.getConstValue('category_soffit_vents_4_16');
    const soffitVents416 = this.general.getFirstMaterial(this.materialList, category_soffit_vents_4_16);
    if (!soffitVents416) throw new NotFoundMaterialException('Soffit vents 4 16');

    const category_soffit_vents_2 = await this.general.getConstValue('category_soffit_vents_2');
    const soffitVents2 = this.general.getFirstMaterial(this.materialList, category_soffit_vents_2);
    if (!soffitVents2) throw new NotFoundMaterialException('Soffit vents 2');

    const category_soffit_vents_3 = await this.general.getConstValue('category_soffit_vents_3');
    const soffitVents3 = this.general.getFirstMaterial(this.materialList, category_soffit_vents_3);
    if (!soffitVents3) throw new NotFoundMaterialException('Soffit vents 3');

    const category_soffit_vents_4 = await this.general.getConstValue('category_soffit_vents_4');
    const soffitVents4 = this.general.getFirstMaterial(this.materialList, category_soffit_vents_4);
    if (!soffitVents4) throw new NotFoundMaterialException('Soffit vents 4');

    const category_louvre_vents_4_with_ext = await this.general.getConstValue('category_louvre_vents_4_with_ext');
    const louvreVents4Ext = this.general.getFirstMaterial(this.materialList, category_louvre_vents_4_with_ext);
    if (!louvreVents4Ext) throw new NotFoundMaterialException('Louvre Vents 4 with ext');


    const category_louvre_vents_6_without_ext = await this.general.getConstValue('category_louvre_vents_6_without_ext');
    const louvreVents6WithoutExt = this.general.getFirstMaterial(this.materialList, category_louvre_vents_6_without_ext);
    if (!louvreVents6WithoutExt) throw new NotFoundMaterialException('Louvre Vents 6 without ext');

    const category_louvre_vents_6_with_ext = await this.general.getConstValue('category_louvre_vents_6_with_ext');
    const louvreVents6Ext = this.general.getFirstMaterial(this.materialList, category_louvre_vents_6_with_ext);
    if (!louvreVents6Ext) throw new NotFoundMaterialException('Louvre Vents 6 with ext');

    const category_louvre_vents_4_without_ext = await this.general.getConstValue('category_louvre_vents_4_without_ext');
    const louvreVents4WithoutExt = this.general.getFirstMaterial(this.materialList, category_louvre_vents_4_without_ext);
    if (!louvreVents4WithoutExt) throw new NotFoundMaterialException('Louvre Vents 4 without ext');

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

    const costLouvreVents4Ext = await this.general.calculatePiecesCost(
      measures.psb_louvrevents?.louveredVent4WithExtensionsAdd || 0,
      louvreVents4Ext,
      shingles
    );

    const costLouvreVents4WithoutExt = await this.general.calculatePiecesCost(
      measures.psb_louvrevents?.louveredVent4WithoutExtensionsAdd || 0,
      louvreVents4WithoutExt,
      shingles
    );

    const costLouvreVents6Ext = await this.general.calculatePiecesCost(
      measures.psb_louvrevents?.louveredVent6WithExtensionsAdd || 0,
      louvreVents6Ext,
      shingles
    );

    const costLouvreVents6WithoutExt = await this.general.calculatePiecesCost(
      measures.psb_louvrevents?.louveredVent6WithoutExtensionsAdd || 0,
      louvreVents6WithoutExt,
      shingles
    );

    const costSoffitvents2 = await this.general.calculatePiecesCost(
      measures.psb_soffitvents?.soffitVent2Add || 0,
      soffitVents2,
      shingles
    );

    const costSoffitvents3 = await this.general.calculatePiecesCost(
      measures.psb_soffitvents?.soffitVent3Add || 0,
      soffitVents3,
      shingles
    );

    const costSoffitvents4 = await this.general.calculatePiecesCost(
      measures.psb_soffitvents?.soffitVent4Add || 0,
      soffitVents4,
      shingles
    );

    const costSoffitvents416 = await this.general.calculatePiecesCost(
      measures.psb_soffitvents?.soffitVent416Add || 0,
      soffitVents416,
      shingles
    );

    const costSoffitvents616 = await this.general.calculatePiecesCost(
      measures.psb_soffitvents?.soffitVent616Add || 0,
      soffitVents616,
      shingles
    );


      let ridgeVentLF = 0;

      const isRidgeVentApplicable =
        measures.vent_is_ridgevent_in_place ||
        measures.vent_is_ridgevent_be_replace ||
        measures.vent_is_ridgevent_add;

      if (isRidgeVentApplicable) {
        ridgeVentLF = measures.vent_is_ridgevent_in_place
          ? measures.vent_ridgevent_lf ?? measures.ridge_lf
          : measures.ridge_lf ?? measures.vent_ridgevent_lf;
      }
    ridgeVentLF = ridgeVentLF * (1 + ((measures.wasting * 0.01) / 2))
    let u = await this.general.calculateRidgeventsCost(
      ridgeVentLF,
      ridgevents,
      measures,
      category_ridgevents,
      shingles
    );
    ventilationCalculations = [].concat(
      x,
      y,
      z,
      w,
      v,
      u,
      costLouvreVents4Ext,
      costLouvreVents4WithoutExt,
      costLouvreVents6Ext,
      costLouvreVents6WithoutExt,
      costSoffitvents2,
      costSoffitvents3,
      costSoffitvents4,
      costSoffitvents416,
      costSoffitvents616
      );
    ventilationCalculations = ventilationCalculations.filter(Boolean);
    return ventilationCalculations;
  }
}
