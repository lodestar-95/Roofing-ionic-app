import { PsbSlope } from "src/app/models/psb-slope.model";
import { Injectable } from '@angular/core';
import { CatalogsService } from '../catalogs.service';
import { ShinglesService } from "../materials/shingles.service";
import { LaborCost } from "src/app/models/labor-cost.model";
import { CALCULATION_SCHEMA } from "../const";

@Injectable({
  providedIn: 'root',
})
export class GeneralLaborService {
    
  constructor(
    private catalogs: CatalogsService,
    private shingle: ShinglesService
  ) {}
  
  private laborCost : LaborCost  = new Object as LaborCost;

    calculateProporcionalArea = (slope: PsbSlope, slopesSQ, sq) => {
        if(sq == 0){
          return 0;
        }
        let porcentage = this.getPorcentage(slope, slopesSQ);
        const resultado = (porcentage*0.01) * sq;
        return isNaN(resultado)?0:resultado;
    };
/*
    calculateRidgecapArea = (slope: PsbSlope, slopesSQ, ridgecapSQ) => {
        let porcentage = this.getPorcentage(slope, slopesSQ);
        return (porcentage*0.01) * ridgecapSQ;
    };
*/
    getShingleSlopesSQTotal = (slopes: PsbSlope[]) =>{
        const shingleSlopes = slopes.filter(slope => slope.pitch >= 2);
        return this.getSum("shingle_area", slopes);
    };

    getPorcentage = (slope, total) => {
      return parseFloat(((slope.shingle_area * 100) / total).toFixed(2));
    };

    getSum = (key, array) => {
        return array.reduce((a, b) => (1*a) + (1*(b[key] || 0)), 0);
    };
}