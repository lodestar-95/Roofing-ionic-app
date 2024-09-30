import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA, ERRORS } from '../const';
import { GeneralService } from './general.service';
import { ShinglesService } from './shingles.service';
import { NotFoundMaterialException } from '../not-found-material.exception';

@Injectable({
  providedIn: 'root',
})
export class INWShieldUnderlaymentsService {
  private materialList: any;

  constructor(
    private shingle: ShinglesService,
    private catalogs: CatalogsService,
    private general: GeneralService
  ) { }

  public setMaterialList(value: any) {
    this.materialList = value;
  }

  async calculateInWShieldMeasures(building: Building) {
    if (building.psb_measure.psb_slopes == null) {
      return ERRORS.NO_SLOPE;
    }
    let measures = building.psb_measure;

    const wasting = measures.wasting;
    let totalInWSQ;
    let totalUnderlayment;
    let inwShieldCalculation = await this.calculateInWShield(
      measures,
      wasting,
      totalInWSQ
    );
    let underlaymentCalculation = await this.calculateUnderlayment(
      measures,
      wasting,
      inwShieldCalculation
    );

    if (measures.id_inwshield_rows == 4) { //complete roof
      underlaymentCalculation = underlaymentCalculation.map(x => ({ ...x, sq: 0, qty: 0, value: 0, sqlf: 0 }));
    }

    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');

    if(building.id_job_type == job_types_overlay){
      inwShieldCalculation = inwShieldCalculation.map(x => ({ ...x, sq: 0, qty: 0, value: 0, sqlf: 0 }));
      underlaymentCalculation = underlaymentCalculation.map(x => ({ ...x, sq: 0, qty: 0, value: 0, sqlf: 0 }));
    }

    let protectionCalculation = [].concat(
      inwShieldCalculation,
      underlaymentCalculation
    );
    return protectionCalculation;
  };

  async calculateUnderlayment(measures, wasting, inwShieldCalculation) {
    let shingles = await this.shingle.getShingles();
    //wasting = wasting + 1;
    let plasticCapsCalculation;
    const materials = this.materialList;

    const category_plastic_caps = await this.general.getConstValue('category_plastic_caps');
    const plasticCapsMaterial = this.general.getFirstMaterial(materials,category_plastic_caps);
    if (!plasticCapsMaterial) throw new NotFoundMaterialException('Retrofit Pipe Flashing');

    let stepSlopeUnderlaymentCalculation = [];
    let steepSlopeToRestCalculation = [];
    let underlaymentCalculation = [];

    const category_underlayment = await this.general.getConstValue('category_underlayment');
    const concept_types_underlayment_partial_calc = await this.general.getConstValue('concept_types_underlayment_partial_calc');
    let calculations = [];

    for (let shingle of shingles) {
      let steepSlopeSQ = this.calculateSteepSlopeUnderlaymentSQ(
        measures.psb_slopes,
        wasting
      );

      let categoryMaterials = this.general.getMaterial(
        materials,
        category_underlayment
      );
      //if(categoryMaterials.lenght == 0){
      //  continue;
      //}
      let materialSelected = this.general.getSelectedMaterial(
        categoryMaterials,
        measures,
        category_underlayment,
        shingle
      );
      if (!materialSelected || materialSelected.length == 0) {
        //TODO: verificar si se quita este contiunue por ya tener un material para material no encontrado.
        continue;
      }

      materialSelected = materialSelected[0];
      stepSlopeUnderlaymentCalculation = this.addPartialCalcule(
        steepSlopeSQ,
        'Underlayment Steep Slope',
        shingle,
        measures,
        category_underlayment,
        concept_types_underlayment_partial_calc,
        materialSelected
      );

      const isInWShieldDeclined = measures.id_inwshield_rows == 3;
      let steepSlopeToRestSQ = isInWShieldDeclined ? 0 : await this.calculateSteepSlopeInWShieldSQToRest(
        measures,
        wasting,
        shingle
      );

      steepSlopeToRestCalculation = this.addPartialCalcule(
        steepSlopeToRestSQ,
        'InW Shield to Rest in Steep Slope',
        shingle,
        measures,
        category_underlayment,
        concept_types_underlayment_partial_calc,
        materialSelected
      );

      let totalUnderlayment = steepSlopeSQ - steepSlopeToRestSQ;
      underlaymentCalculation = await this.calculateCost(
        totalUnderlayment,
        measures,
        category_underlayment,
        shingle
      );

      //TODO: getTrademark(id_material_type_shingle)
      let totalInWSQ = inwShieldCalculation.filter(async (x) => {
        const idTrademark = await this.getTrademark(x.id_material_type_shingle);
        return idTrademark == shingle.id_trademark;
      });
      if (totalInWSQ && totalInWSQ.length > 0) {
        totalInWSQ = totalInWSQ[0];
      } else {
        totalInWSQ = 0;
      }
      let totalInwAndUnderlayment = totalUnderlayment ? totalUnderlayment : 0 + totalInWSQ;
      let flatRoof = this.general.calculateFlatRoofSQ(
        measures.psb_slopes,
        measures.wasting
      );

      let totalPlasticCaps = this.calculatePlasticCapQty(
        flatRoof,
        totalInwAndUnderlayment,
        plasticCapsMaterial
      );

      plasticCapsCalculation = await this.general.calculatePiecesCostJustOneShingle(
        totalPlasticCaps,
        plasticCapsMaterial,
        shingle,
        (1 * flatRoof) + (1 * totalInwAndUnderlayment)
      ); //Como ya se calcularon las SQ, el precio se calcula como si fueran piezas
      const calculation = [].concat(
        stepSlopeUnderlaymentCalculation,
        steepSlopeToRestCalculation,
        underlaymentCalculation,
        plasticCapsCalculation
      );

      calculations = [...calculations, ...calculation];
    }

    return calculations;
  };

  async getTrademark(idMaterialType) {
    return (await this.catalogs.getMaterialPrices()).data.filter(x => x.id = idMaterialType)[0].id_trademark;
  };

  calculatePlasticCapQty = (
    flatRoof,
    totalInwAndUnderlayment,
    material
  ) => {
    let plasticCaps = 0
    if (flatRoof > 0) {
      plasticCaps = flatRoof / material.coverage_sq;
    }
    plasticCaps += (totalInwAndUnderlayment - flatRoof) / material.coverage_sq
    return plasticCaps;
  };

  async calculateInWShield(measures, wasting, totalInWSQ) {
    let shingles = await this.shingle.getShingles();
    //wasting = wasting + 1;
    let materials = this.materialList;

    let flatInWCalculation = [];
    let lowSlopeInWCalculation = [];
    let steepSlopeInWCalculation = [];
    let inwCalculation = [];
    let calculations = [];

    const category_inw_shield = await this.general.getConstValue('category_inw_shield');
    const concept_types_inwshield_partial_calc = await this.general.getConstValue('concept_types_inwshield_partial_calc');
    let rows = await this.getSelectedInWShieldRows(measures);
    const isCompleteRoof = (rows?.id ?? 0) == 4;
    const isDeclined = (rows?.id ?? 0) == 3;

    for (let shingle of shingles) {
      let material = this.general.getMaterial(
        materials,
        category_inw_shield
      )[0];

      let categoryMaterials = this.general.getMaterial(
        materials,
        category_inw_shield
      );

      let materialSelected = this.general.getSelectedMaterial(
        categoryMaterials,
        measures,
        category_inw_shield,
        shingle
      );

      if (!materialSelected || materialSelected.length == 0) {
        continue;
      }
      materialSelected = materialSelected[0];

      if(!isDeclined){
        const flatRoofSQ = this.calculateFlatRoofInWShieldSQ(measures, wasting);

        flatInWCalculation = this.addPartialCalcule(
          flatRoofSQ,
          'InW Shield in Flat Roof',
          shingle,
          measures,
          category_inw_shield,
          concept_types_inwshield_partial_calc,
          materialSelected
        );

        let lowSlopeSQ = this.calculateLowSlopeInWShieldSQ(measures, wasting);
        lowSlopeInWCalculation = this.addPartialCalcule(
          lowSlopeSQ,
          'InW Shield in Low Slope',
          shingle,
          measures,
          category_inw_shield,
          concept_types_inwshield_partial_calc,
          materialSelected
        );




        /*
              let valleysLowSlopeLF = measures.valleys_lf_steep_slope;
              let evesStartersStepSlopesLF = measures.eves_starters_lf_steep_slope * (await this.getSelectedInWShieldRows(measures)).rows_eves;
              let evesValleysLF = (valleysLowSlopeLF + evesStartersStepSlopesLF) * (1+(wasting/100));
              let evesValleysLFCvg = evesValleysLF/
        */



        let steepSlopeSQ = isDeclined ? 0 : await this.calculateSteepSlopeInWShieldSQ(
          measures,
          wasting,
          shingle
        );

        steepSlopeInWCalculation = this.addPartialCalcule(
          steepSlopeSQ,
          'InW Shield in Steep Slope',
          shingle,
          measures,
          category_inw_shield,
          concept_types_inwshield_partial_calc,
          materialSelected
        );
        totalInWSQ = flatRoofSQ + steepSlopeSQ + lowSlopeSQ;

        const inWmaterial = this.general.getFirstMaterial(materials, category_inw_shield);
        if (!inWmaterial) throw new NotFoundMaterialException('InW Shield');
        totalInWSQ += this.getCricketsInWS(measures, inWmaterial);
        totalInWSQ += this.getChimneyInWS(measures, inWmaterial);
        totalInWSQ += this.getSkylightInWS(measures, inWmaterial);

        inwCalculation = await this.calculateCost(
          totalInWSQ,
          measures,
          category_inw_shield,
          shingle
        );
        let calculation = inwCalculation;
        calculation.push(flatInWCalculation);
        calculation.push(lowSlopeInWCalculation);
        calculation.push(steepSlopeInWCalculation);
        calculations = calculations.concat(calculation);
      }
    }
    return calculations;
  };

  getCricketsInWS(measures: PsbMeasures, material) {
    const areas = measures?.psb_crickets?.filter(x => x.pitch >= 3 && !x.deletedAt)?.map(x => x.area) ?? [];
    if (areas.length == 0) {
      return 0;
    } else {
      const lf = areas.reduce((previous, current) => previous + current, 0);
      return lf * material.coverage_sq;
    }
  }

  getChimneyInWS(measures: PsbMeasures, material) {
    const inWShield = measures?.psb_chimneys
      ?.filter(x => !x.deletedAt)
      ?.map(x => (x.width * 2) + (x.lenght * 2))
      ?.reduce((previous, current) => previous + current, 0) ?? 0;

    if (inWShield == 0) {
      return 0;
    }

    return ((inWShield / 12) / material.coverage_lf) * material.coverage_sq;
  }

  getSkylightInWS(measures: PsbMeasures, material) {
    const inWShield = measures?.psb_skylights
      ?.filter(x => !x.deletedAt)
      ?.map(x => (x.width * 2) + (x.lenght * 2))
      ?.reduce((previous, current) => previous + current, 0) ?? 0;

    if (inWShield == 0) {
      return 0;
    }

    return ((inWShield / 12) / material.coverage_lf) * material.coverage_sq;
  }

  async calculateCost (sq, measures, category, shingle)  {
    let materials = this.materialList;
    let material = this.general.getMaterial(materials, category)[0];
    let categoryMaterials = this.general.getMaterial(materials, category);
    let materialSelected = this.general.getSelectedMaterial(
      categoryMaterials,
      measures,
      category,
      shingle
    )[0];
    let materialCalculations = await this.general.calculateCostJustOneShingle(
      sq,
      materialSelected,
      shingle
    );
    return materialCalculations;
  };

  calculateFlatRoofInWShieldSQ = (measures, wasting) => {
    let flatRoof = this.general.calculateFlatRoofSQ(
      measures.psb_slopes,
      wasting
    );
    return flatRoof;
  }

  calculateSteepSlopeInWShieldSQCompleteRoof = (measures,wasting)=>{
    return this.general.calculateSteepLsopesSQ(measures.psb_slopes,wasting);
  }

  async calculateSteepSlopeInWShieldSQ(measures, wasting, shingle) {
    let valleysStepSlopesLF = measures.valleys_lf_steep_slope;
    let evesStartersStepSlopesLF = measures.eves_starters_lf_steep_slope;

    let rows = await this.getSelectedInWShieldRows(measures);
    if(!rows){
      return 0;
    }

    if(rows.id == 4){
      return this.calculateSteepSlopeInWShieldSQCompleteRoof(measures, wasting);
    }
    const category_inw_shield = await this.general.getConstValue('category_inw_shield');
    let inwSteepSlopeLF =
      (valleysStepSlopesLF + (evesStartersStepSlopesLF * rows.rows_eves)) *
      (1 + (wasting / 100));
    let materials = this.materialList;
    let inwShieldsMaterials = this.general.getMaterial(
      materials,
      category_inw_shield
    );
    let inwMaterial = this.general.getSelectedMaterial(
      inwShieldsMaterials,
      measures,
      category_inw_shield,
      shingle
    )[0];
    return (
      (inwSteepSlopeLF / inwMaterial.coverage_lf) * inwMaterial.coverage_sq
    );
  };

  calculateLowSlopeInWShieldSQ = (measures, wasting) => {
    let lowSlope = this.general.calculateLowSlopeSQ(
      measures.psb_slopes,
      wasting
    );
    return lowSlope;
  };

  async getSelectedInWShieldRows(measures) {
    let idInWShieldRows = measures.id_inwshield_rows;
    let InWShieldRows = await this.catalogs
      .getInwshieldRows()
      .then(inws => inws.data.filter((inw) => (inw.id == idInWShieldRows)));
    return InWShieldRows[0];
  };

  addPartialCalcule = (
    sq,
    concept,
    shingle,
    measures,
    category,
    idConceptType,
    materialSelected
  ) => {
    let calc = [];
    //if(!pieces) return null;
    let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
    newCalc.sq = sq;
    newCalc.qty = sq;
    newCalc.calculation_type = 'Calculo parcial de ' + concept;
    newCalc.id_concept_type = idConceptType;
    newCalc.concept = concept;
    newCalc.concept_type = 'Material';
    newCalc.is_final = false;
    newCalc.value = sq;
    let materials = this.materialList;
    let inwShieldsMaterials = this.general.getMaterial(materials, category);
    let inwMaterial = this.general.getSelectedMaterial(
      inwShieldsMaterials,
      measures,
      category,
      shingle
    )[0];
    newCalc.id_concept = inwMaterial.id;
    newCalc.id_material_type = materialSelected.id_material_type;
    newCalc.id_material_type_shingle = shingle.id_material_type;
    newCalc.id_trademark = inwMaterial.id_trademark;
    return newCalc;
  };

  calculateSteepSlopeUnderlaymentSQ = (slopes, wasting) => this.general.calculateSteepLsopesSQ(slopes, wasting);

  async calculateSteepSlopeInWShieldSQToRest(measures, wasting, shingle) {
    let evesStartersStepSlopesLF = measures.eves_starters_lf_steep_slope;
    let rows = await this.getSelectedInWShieldRows(measures);
    if(!rows){
      return 0;
    }

    const inwRows = JSON.parse(JSON.stringify(rows));
    let inwSteepSlopeLF = evesStartersStepSlopesLF * inwRows.rows_eves * (1 + (wasting / 100));
    let materials = this.materialList;
    const category_inw_shield = await this.general.getConstValue('category_inw_shield');
    let inwShieldsMaterials = this.general.getMaterial(
      materials,
      category_inw_shield
    );
    let inwMaterial = this.general.getSelectedMaterial(
      inwShieldsMaterials,
      measures,
      category_inw_shield,
      shingle
    )[0];
    return (
      (inwSteepSlopeLF / inwMaterial.coverage_lf) * inwMaterial.coverage_sq
    );
  };
}
