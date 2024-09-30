import { Building } from "src/app/models/building.model";
import { PsbSlope } from "src/app/models/psb-slope.model";
import { Injectable } from '@angular/core';
import { CatalogsService } from '../../../services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { ShinglesService } from "../materials/shingles.service";
import { LaborCost } from "src/app/models/labor-cost.model";
import { GeneralLaborService } from "./general.service";
import { Cost } from "src/app/models/cost.model";
import { GeneralService } from "../materials/general.service";

@Injectable({
    providedIn: 'root',
})
export class OsbLaborService {

    constructor(
        private shingle: ShinglesService,
        private general: GeneralService,
        private catalogs: CatalogsService,
        private generalLabor: GeneralLaborService
    ) { }

    private laborCost: LaborCost = new Object as LaborCost;

    async calcOsbLabor(building: Building, materialsCalc) {
        let slopes = building.psb_measure.psb_slopes;
        const wasting = building.psb_measure.wasting * 0.01;
        //let slopesSQ = this.getShingleSlopesSQTotal(slopes);
        const shingles = await this.shingle.getShingles();
        let calculation  = [];
        for (let shingle of shingles) {
            let osbLabor = [];
            for (let slope of slopes){
                const osbCost = await this.getOsbLaborCost(slope, building.id_job_type, shingle, wasting);
                osbLabor = osbLabor.concat(osbCost);
            }
            const osbTotals = await this.getOsbTotals(osbLabor, shingle);
            calculation = calculation.concat(osbTotals);
            
        }
        calculation = calculation.filter(labor => labor != null);
        return calculation;
    };
   

  /*  

  let install = laborCalculation.tearOff.filter(labor => labor.layer == 1);
  
  calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 1));
  calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 2));
  calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 3));
  calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 4));
  calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 5));
*/
    async getOsbLaborCost (slope: PsbSlope, idJobType, shingle, wasting) {
        let laborPrices = (await this.catalogs.getLaborPitchPrices()).data;
        let obsLabor = [];
        const labor_category_tear_off = await this.general.getConstDecimalValue('labor_category_install');
        const concept_types_labor = await this.general.getConstDecimalValue('concept_types_labor');
        let costs = laborPrices.filter(price => {
            return price.id_material_category == shingle.id_material_category
            && price.id_labor_category == labor_category_tear_off
            && price.id_job_type == idJobType 
            && price.pitch == Math.trunc(slope.pitch)
            && price.floor_slope == slope.floor
        });
        
        for (let cost of costs){
            this.laborCost.total_area = this.general.calculateSlopesSQObs(slope, wasting);
            this.laborCost.total_cost = cost.price * this.laborCost.total_area;
            this.laborCost.price = cost.price;
            this.laborCost.id_labor_cost = cost.id;
            this.laborCost.slope = slope;
            this.laborCost.layer = cost.layer;
            this.laborCost.floor = slope.floor;
            this.laborCost.qty = this.laborCost.total_area;
            this.laborCost.value = this.laborCost.total_cost;
            this.laborCost.id_material_type_shingle = shingle.id_material_type;
            this.laborCost.id_concept_type = concept_types_labor;
            //TODO: Eliminar cuando ya se calcule totales de labor.
            this.laborCost.total = this.laborCost.total_cost;
            let temp = JSON.parse(JSON.stringify(this.laborCost));
            obsLabor.push(temp);
        }
        return obsLabor;
    }

    
    async getOsbTotals(obsLabor: LaborCost[], shingle: any): Promise<any[]> {
        let total = this.generalLabor.getSum("total_cost", obsLabor);
        let total_area = this.generalLabor.getSum("total_area", obsLabor);
        let calc = [];
        if(obsLabor.length == 0){
            return null;
        }
        const labor_category_tear_off = await this.general.getConstValue('labor_category_tear_off');
        const concept_types_labor = await this.general.getConstValue('concept_types_labor');
        let labor = obsLabor[0];
        //if (!pieces) return null;
        let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        newCalc.qty = total_area.toFixed(2);
        newCalc.calculation_type = 'Costo de OSB Install ';
        newCalc.category = labor_category_tear_off
        //newCalc.material = material.material;
        newCalc.concept = "OSB Install";
        newCalc.concept_type = labor.labor_type;
        newCalc.id_concept_type = concept_types_labor;
        newCalc.id_concept = labor.id_labor_type;
        newCalc.cost = total;
        newCalc.coverage = null;
        newCalc.id_labor_type = labor.id_labor_type;
        //newCalc.id_material = material.id;
        newCalc.is_final = true;
        newCalc.unit = null;
        newCalc.unit_abbrevation = null;
        newCalc.value = total;
        newCalc.id_material_price_list = null;
        newCalc.id_price_list = null;
        newCalc.id_material_type_shingle = shingle.id_material_type;
        return newCalc;
    };
}