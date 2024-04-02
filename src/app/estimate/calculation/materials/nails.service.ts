import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { ERRORS } from '../const';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class NailsService {
  private materialList: any;

  constructor(
    private shingle: ShinglesService,
    private general: GeneralService,
    private catalogs: CatalogsService
  ) { }


  public setMaterialList(value: any) {
    this.materialList = value;
  }

  async getConstValue(key) {
    return await this.catalogs.getGeneral().then(result => result.data.find(x => x.key == key).value);
  }

  async calculateNailsMeasures(building: Building) {
    const measures = building.psb_measure;

    const eves_lf = measures.eves_starters_lf_low_slope +
      measures.eves_starters_lf_steep_slope;
    const rakes_lf = measures.rakes_lf_steep_slope + measures.rakes_lf_low_steep_slope;
    const wasting = measures.wasting;
//    let nails1SF = (measures.vent_soffit_eves_in / 12) * eves_lf;
//    nails1SF += (measures.vent_soffit_rakes_in / 12) * rakes_lf;
    let nailsExpossedSoffit = measures.vent_additional_soffit_eves_sf;
    const nailsExpossedSoffitSQ = this.general.plusWasting(nailsExpossedSoffit / 100, wasting);
    if (measures.psb_slopes == null) {
      return ERRORS.NO_SLOPE;
    }

    let nails114SQ = this.general.calculateLowAndSteepLsopesSQ(measures.psb_slopes, wasting);
    nails114SQ += nailsExpossedSoffitSQ / 1000;

    let ridgevent_upgrade;
    const upgrade_ridgevents = await this.getConstValue('upgrade_ridgevents');
    const cost_integration_built_in = await this.getConstValue('cost_integration_built_in');
    const cost_integration_upgrade = await this.getConstValue('cost_integration_upgrade');
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');

    let x = upgrade_ridgevents;
    const upgrade = measures.psb_upgrades?.filter((upgrade) => {
      return (
        upgrade.id_upgrade + "" == x &&
        (upgrade.id_cost_integration + "" == cost_integration_built_in ||
          upgrade.id_cost_integration + "" == cost_integration_upgrade)
      );
    });
    if (upgrade.length > 0) {
      ridgevent_upgrade = upgrade[0].id_cost_integration;
    }

    const hipsLF = this.general.parseNumber(measures.hips_lf) * (1 + ((measures.wasting * 0.01) / 2));
    nails114SQ += hipsLF / 50;

    let nails112SQ = 0;
    let ridgeLF = 0;
    let ridgeSQ = 0;
    if (measures.vent_is_ridgevent_in_place || ridgevent_upgrade != null) {
      ridgeLF = (measures.ridge_lf) * (1 + ((measures.wasting * 0.01) / 2));
      ridgeSQ = ridgeLF / 50;
    } else {
      const ridge = (measures.ridge_lf) * (1 + ((measures.wasting * 0.01) / 2));
      nails114SQ += ridge / 50;
    }

    if (building.id_job_type == job_types_overlay) {
      nails112SQ = nails114SQ;
      nails114SQ = 0;
    }

    //nails134SQ
    let nails134SQ = 0;
    const hpRidgeCap = measures.psb_upgrades.filter(x=>x.id_upgrade==7 && x.id_cost_integration==1);
    if(hpRidgeCap.length > 0){
        nails134SQ = measures.hips_lf + measures.ridge_lf;
    }
    //const lowSteepEvesStartersLF = (measures.eves_starters_lf_low_slope
    //  + measures.eves_starters_lf_steep_slope)
    //  * ((measures.wasting * 0.01) / 2);

    //TODO: identificar el tamaño de clavo dependiendo del size del ridgevent. Si el ridgevent está declinado lleva clavos de 1 1/4".
    //const nailsRidgevent = ridge;
    //const nails114LF = lowSteepSlopesSQ;
    const paramsCalc = {
        building : building,
        nails1SQ : 0,
        nails114SQ : nails114SQ,
        nails112SQ : nails112SQ,
        nails134SQ: nails134SQ,
        ridgeLF : ridgeLF,
        ridgeSQ : ridgeSQ,
        ridgevent_upgrade : ridgevent_upgrade,
        vent_is_ridgevent_in_place : measures.vent_is_ridgevent_in_place
    }
    const nailsCalculation = await this.calculateNailsCost(paramsCalc);

    return nailsCalculation;
  };

  async calculateNailsCost(paramsCalc) {
    const {building, nails1SQ, nails114SQ,nails112SQ, nails134SQ, ridgeLF, ridgeSQ, ridgevent_upgrade, vent_is_ridgevent_in_place} = paramsCalc;
    const shingles = await this.shingle.getShingles();

    const category_coil_nails_1 = await this.general.getConstValue('category_coil_nails_1');
    const nails1 = this.general.getFirstMaterial(this.materialList, category_coil_nails_1);
    if (!nails1) throw new NotFoundMaterialException('Coil Nails 1');

    const category_coil_nails_1_1_4 = await this.general.getConstValue('category_coil_nails_1_1_4');
    const nails114 = this.general.getFirstMaterial(this.materialList, category_coil_nails_1_1_4);
    if (!nails114) throw new NotFoundMaterialException('Coil Nails 1 1/4');

    const category_coil_nails_1_1_2 = await this.general.getConstValue('category_coil_nails_1_1_2');
    const nails112 = this.general.getFirstMaterial(this.materialList, category_coil_nails_1_1_2);
    if (!nails112) throw new NotFoundMaterialException('Coil Nails 1 1/2');

    const category_coil_nails_1_3_4 = await this.general.getConstValue('category_coil_nails_1_3_4');
    const nails134 = this.general.getFirstMaterial(this.materialList, category_coil_nails_1_3_4);
    if (!nails134) throw new NotFoundMaterialException('Coil Nails 1 3/4');

    const category_coil_nails_sidding = await this.general.getConstDecimalValue('category_coil_nails_sidding');
    const nailsSidding = this.general.getFirstMaterial(this.materialList, category_coil_nails_sidding);
    if (!nailsSidding) throw new NotFoundMaterialException('Coil Nails Sidding');

    const isWindWarrantyBuiltIn = await this.verifyWindWarrantyBultin(building);

    const coverage_nails_wind_warranty = await this.general.getConstDecimalValue('coverage_nails_wind_warranty');

    if (isWindWarrantyBuiltIn) {
      nails1.coverage_sq = coverage_nails_wind_warranty;
      nails114.coverage_sq = coverage_nails_wind_warranty;
      nails112.coverage_sq = coverage_nails_wind_warranty;
      nails134.coverage_sq = coverage_nails_wind_warranty;
    }

    const costNails1 = await this.general.calculateSQCoverageCost(nails1SQ, nails1, shingles);
    const costNails114 = await this.general.calculateSQCoverageCost(nails114SQ, nails114, shingles);
    const costNails112 = await this.general.calculateSQCoverageCost(nails112SQ, nails112, shingles);
    const costNails134 = await this.general.calculateLFCoverageCost(nails134SQ, nails134, shingles); //usar LF

    const cost_integration_built_in = await this.getConstValue('cost_integration_built_in');
    const cost_integration_upgrade = await this.getConstValue('cost_integration_upgrade');
    const upgrade_ridgevents = parseInt(await this.getConstValue('upgrade_ridgevents'));

    let costNailsSidding = [];
    if (ridgevent_upgrade == cost_integration_built_in || vent_is_ridgevent_in_place) {
      costNailsSidding = await this.general.calculateSQCoverageCost(ridgeSQ, nailsSidding, shingles);
    } else if (ridgevent_upgrade == cost_integration_upgrade) {
      costNailsSidding = await this.general.calculateSiddingNailsCostUpgrade(ridgeLF, this.materialList, shingles, upgrade_ridgevents, building.psb_measure);
    }

//    let nailsCalculations = [].concat(costNails1, costNails114, costNails112, costNailsSidding);
    let nailsCalculations = [].concat(costNails114, costNails112, costNails134, costNailsSidding);
    return nailsCalculations;
  }

  async verifyWindWarrantyBultin(building: Building) {
    const upgrade_wind_warranty = await this.general.getConstDecimalValue('upgrade_wind_warranty');
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');

    const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_wind_warranty);
    return upgrade && upgrade.id_cost_integration == cost_integration_built_in;
  }
}
