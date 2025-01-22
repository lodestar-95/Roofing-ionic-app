import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { LaborCost } from 'src/app/models/labor-cost.model';
import { LaborPitchPrice } from 'src/app/models/labor-pitch-price.model';
import { PsbSlope } from 'src/app/models/psb-slope.model';
import { CatalogsService } from '../../../services/catalogs.service';
import { CALCULATION_SCHEMA } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';
import { GeneralLaborService } from './general.service';

@Injectable({
    providedIn: 'root'
})
export class INWShieldUnderlaymentsService {

    private materialCalculations = [];
    private building: Building;
    private laborPrices: LaborPitchPrice[];
    private selectedMaterials: any;

    private laborCategoryInWShieldId: number;
    private laborCategoryUnderlaymentId: number;
    private inwShieldCategoryId: number;
    private conceptTypesLabor: number;
    private shingles: any[];

    private jobTypesOverlayId: number;
    private jobTypesTearOffId: number;
    private jobTypesTearOffOnlyId: number;
    private jobTypesNewConstructionId: number;

    private laborTypeInw: number;
    private laborTypeInwOut: number;
    private laborUnderlaymentType: number;

    constructor(private general: GeneralService,
        private shingle: ShinglesService,
        private catalogs: CatalogsService,
        private generalLabor: GeneralLaborService) {
    }

    public setMaterialList(value: any) {
        this.selectedMaterials = value;
    }

    async calculate(building: Building, materialCalculations) {
        this.building = building;
        this.materialCalculations = materialCalculations;
        await this.loadVariables();

        if (building.id_job_type == this.jobTypesTearOffId
            || building.id_job_type == this.jobTypesTearOffOnlyId
            || building.id_job_type == this.jobTypesOverlayId) {
            return [];
        }

        const inwLabors = this.calculateInwLabor();
        const underlaymentLabors = this.calculateUnderlaymentLabor();

        return [...inwLabors, ...underlaymentLabors];
    }

    private async loadVariables() {
        this.laborPrices = (await this.catalogs.getLaborPitchPrices()).data;
        this.laborCategoryInWShieldId = await this.general.getConstDecimalValue('labor_category_inwshield');
        this.laborCategoryUnderlaymentId = await this.general.getConstDecimalValue('labor_category_underlayment');
        this.inwShieldCategoryId = await this.general.getConstDecimalValue('category_inw_shield');
        this.conceptTypesLabor = await this.general.getConstDecimalValue('concept_types_labor');
        this.shingles = await this.shingle.getShingles();

        this.jobTypesOverlayId = await this.general.getConstDecimalValue('job_types_overlay');
        this.jobTypesTearOffId = await this.general.getConstDecimalValue('job_types_tear_off');
        this.jobTypesTearOffOnlyId = await this.general.getConstDecimalValue('job_types_tear_off_only');
        this.jobTypesNewConstructionId = await this.general.getConstDecimalValue('job_types_new_construction');

        this.laborTypeInw = await this.general.getConstDecimalValue('labor_type_inw')
        this.laborTypeInwOut = await this.general.getConstDecimalValue('labor_type_inw_out_town');
        this.laborUnderlaymentType = await this.general.getConstDecimalValue('labor_type_underlayment');
    }

    calculateInwLabor() {

        const inwOption = this.general.parseNumber(this.building.psb_measure.id_inwshield_rows);

        switch (inwOption) {
            case 1: //3 feet
            case 2: //6 feet
                return this.calculateInwLaborPartialRoof();
            case 3:
                return this.calculateInwLaborCompleteRoofDeclined();
            case 4: //complete roof
                return this.calculateInwLaborCompleteRoof();
        }
        return [];
    }

    private calculateInwLaborPartialRoof() {
        const slopes = this.getSlopes();
        if((slopes?.length ?? 0) == 0){
            return [];
        }

        //const flatSlopes = slopes.filter(x => this.isFlatSlope(x));
        //const lowSlopes = slopes.filter(x => this.isLowSlope(x));
        const steepSlopes = slopes.filter(x => this.isSteepSlope(x));

        //const totalFlat = flatSlopes.reduce((x, y) => x + this.parseNumber(y.shingle_area), 0);
        //const totalLow = lowSlopes.reduce((x, y) => x + this.parseNumber(y.shingle_area), 0);
        const totalSteep = steepSlopes.reduce((x, y) => x + this.parseNumber(y.shingle_area), 0);

        //const totalFlatMeasuresLF = this.parseNumber(this.building.psb_measure.eves_rakes_lf_flat_roof);
        //const totalLowMeasuresLF = this.parseNumber(this.building.psb_measure.eves_starters_lf_low_slope) + this.parseNumber(this.building.psb_measure.valleys_lf_low_slope);
        const totalSteepMeasuresLF = this.parseNumber(this.building.psb_measure.eves_starters_lf_steep_slope) + this.parseNumber(this.building.psb_measure.valleys_lf_steep_slope);

        //const totalSlopes = totalFlat + totalLow + totalSteep;
        //const totalMeasures = totalFlatMeasuresLF + totalLowMeasuresLF + totalSteepMeasuresLF;

        let inwShieldCosts = [];
        for (const shingle of this.shingles) {
            const materials = this.general.getSelectedMaterial(this.selectedMaterials, this.building.psb_measure, this.inwShieldCategoryId, shingle);
            if (!materials)
                continue;
            const material = materials[0];
            const totalSteepMeasuresSQ = (totalSteepMeasuresLF / material.coverage_lf) * material.coverage_sq;

            const slopesMeasure = slopes.map(s => {
                if (this.isSteepSlope(s)) {
                    const shingle_area = this.getProporcionalArea(s.shingle_area, totalSteep, totalSteepMeasuresSQ);
                    return { ...s, shingle_area }
                }
                return { ...s };
            });

            const groupedSlopes = this.groupSlopesByPitch(slopesMeasure);

            let slopesCosts = [];
            for (let slope of groupedSlopes) {
                const cost = this.getSlopeCost(slope, shingle, this.laborCategoryInWShieldId);
                slopesCosts = slopesCosts.concat(cost);
            }

            const totalCost = this.getLayerTotals(slopesCosts, shingle);
            inwShieldCosts = inwShieldCosts.concat(totalCost);
        }

        return inwShieldCosts.filter(labor => labor != null);
    }

    private getProporcionalArea(area: number, total: number, totalMeasuresSQ: number) {
        const percentage = this.general.truncateTwoDecimals((100 / total * this.general.parseNumber(area)));
        return (percentage * 0.01) * totalMeasuresSQ;
    }

    private isSteepSlope(x: PsbSlope): unknown {
        return x.pitch >= 4;
    }

    private isLowSlope(x: PsbSlope): unknown {
        return x.pitch >= 2 && x.pitch < 4;
    }

    private isFlatSlope(x: PsbSlope): unknown {
        return x.pitch < 2;
    }

    private parseNumber(value: any) {
        return this.general.parseNumber(value);
    }

    private calculateInwLaborCompleteRoof() {
        let slopes = this.getSlopes();
        slopes = slopes?.filter(x => !this.isFlatSlope(x)); // flat roof no debe de calcularse i&w shield, sino base sheet

        if ((slopes?.length ?? 0) == 0) {
            return [];
        }

        return this.calculateInWLaborBySlopes(slopes);
    }

    private calculateInwLaborCompleteRoofDeclined() {
        let slopes = this.getSlopes();
        slopes = slopes?.filter(x => this.isLowSlope(x));

        if ((slopes?.length ?? 0) == 0) {
            return [];
        }

        return this.calculateInWLaborBySlopes(slopes);
    }

    private calculateInWLaborBySlopes(slopes: PsbSlope[]) {
        let inwShieldCosts = [];
        for (const shingle of this.shingles) {
            const groupedSlopes = this.groupSlopesByPitch(slopes);

            let slopesCosts = [];
            for (let slope of groupedSlopes) {
                const cost = this.getSlopeCost(slope, shingle, this.laborCategoryInWShieldId);
                slopesCosts = slopesCosts.concat(cost);
            }

            const totalCost = this.getLayerTotals(slopesCosts, shingle);
            inwShieldCosts = inwShieldCosts.concat(totalCost);
        }

        return inwShieldCosts.filter(labor => labor != null);
    }

    private getSlopeCost(slope: PsbSlope, shingle: any, laborCategoryId) {
      let laborTypeId;
        switch(laborCategoryId){
        case this.laborCategoryInWShieldId:
            laborTypeId = (this.building.psb_measure.psb_no_requireds?.find(x => x.id_resource == 21)?.no_required ?? false)
                ? this.laborTypeInw
                : this.laborTypeInwOut;
          break;
        default:
          laborTypeId = this.laborUnderlaymentType;
        break;

        }

        const isInWCategory = (this.laborCategoryInWShieldId == laborCategoryId);
        const price = isInWCategory
            ? this.laborPrices.find(x => x.floor_slope == 1 //slope.floor
                && x.pitch == Math.trunc(slope.pitch)
                && x.id_labor_category == laborCategoryId
                && (x.id_labor_type == laborTypeId))
            : this.laborPrices.find(x => x.floor_slope == 1 //slope.floor
                && x.pitch == Math.trunc(slope.pitch)
                && x.id_labor_category == laborCategoryId);

        //let slopeCosts = [];
        //for (const price of prices) {
        let laborCost = {
            shingle_area: 0,
            total_area: 0,
            total_cost: 0,
            price: 0,
            id_labor_cost: 0,
            labor_type: "",
            slope: null,
            layer: 0,
            floor: 0,
            qty: 0,
            value: 0,
            id_material_type_shingle: 0,
            id_concept_type: 0,
            id_material_category: 0

        };
        laborCost.shingle_area = this.general.plusWasting(slope.shingle_area, this.building.psb_measure.wasting);
        laborCost.total_area = laborCost.shingle_area;
        laborCost.total_cost = price.price * laborCost.total_area;
        laborCost.price = price.price;
        laborCost.id_labor_cost = price.id;
        laborCost.labor_type = price.labor_type;
        laborCost.slope = slope;
        laborCost.layer = price.layer;
        laborCost.floor = slope.floor;
        laborCost.qty = laborCost.total_area;
        laborCost.value = laborCost.total_cost;
        laborCost.id_material_type_shingle = shingle.id_material_type;
        laborCost.id_concept_type = this.conceptTypesLabor;
        laborCost.id_material_category = price.id_material_category;

        return [laborCost];
        //slopeCosts.push(laborCost);
        //}
        //return slopeCosts;
    }

    private getLayerTotals(laborCosts: LaborCost[], shingle: any): any[] {
        //let laborTotals = [];

        //for (let layer = 1; layer <= 5; layer++) {
        let layerLabor = laborCosts.filter(labor => {
            //labor.layer == layer &&
            return labor.id_material_type_shingle == shingle.id_material_type;
        });
        let total = this.generalLabor.getSum("total_cost", layerLabor);
        let qty = this.generalLabor.getSum("qty", layerLabor);
        let decimals = this.getDecimals(qty);
        qty = decimals == 0.99 ? Math.trunc(qty) + 1 : qty;
        decimals = this.getTwoDecimals(qty);
        qty = decimals == 0.99 ? Math.trunc(qty) + 1 : qty;

        let prices = layerLabor.map(x => x.price);
        return this.getLayerTotal(layerLabor, shingle, total, qty, prices);
        //laborTotals = laborTotals.concat();
        //}

        //return laborTotals;
    }

    private getDecimals(value: number) {
        const decimals = this.general.parseNumber(value) - Math.trunc(this.general.parseNumber(value));
        return this.general.truncateDecimals(decimals, 2);
    }

    private getTwoDecimals(value: number) {
        const decimals = this.general.parseNumber(value) - Math.trunc(this.general.parseNumber(value));
        return this.general.truncateTwoDecimals(decimals);
    }

    private getLayerTotal(labors, shingle, cost, qty, prices) {
        // if (labors.length == 0) {
        //     return null;
        // }
        const labor_category_inw_shield = this.laborCategoryInWShieldId;
        const concept_types_labor = this.conceptTypesLabor;
        let labor = labors[0];
        const allCostEquals = prices.every(x => x == prices[0]);

        let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        newCalc.qty = qty;
        newCalc.calculation_type = 'Costo de InW Shield';
        newCalc.category = labor_category_inw_shield
        newCalc.concept = "Install I&W Shield";
        newCalc.concept_type = labor.labor_type;
        newCalc.id_concept_type = concept_types_labor;
        newCalc.id_concept = labor.id_labor_type;
        newCalc.cost = allCostEquals ? prices[0] : cost / newCalc.qty;
        newCalc.price = prices;
        newCalc.coverage = null;
        newCalc.id_labor_type = labor.id_labor_type;
        newCalc.laborLayer = labors;
        newCalc.is_final = true;
        newCalc.unit = null;
        newCalc.unit_abbrevation = null;
        newCalc.value = allCostEquals ? this.general.parseNumber(newCalc.cost) * this.general.parseNumber(qty) : cost;
        newCalc.id_material_price_list = null;
        newCalc.id_price_list = null;
        newCalc.id_material_type_shingle = shingle.id_material_type;
        return newCalc;
    }

    private getSlopes() {
        return this.building.psb_measure.psb_slopes?.filter(x => x.deletedAt == null);
    }

    private getTotalShinglesSQ(shingle) {
        const calculation = this.materialCalculations.find(material => material
            && material?.id_material_type == shingle.id_material_type
            && material.id_material_type_shingle == shingle.id_material_type
        );

        if (calculation) {
            return calculation.qty;
        }

        return null;
    }

    private groupSlopesByPitch(slopes: PsbSlope[]) {
        const groupSlopes: PsbSlope[] = [];

        for (const slope of slopes) {
            const slopePitch = Math.trunc(slope.pitch);
            const previosSlope = groupSlopes.find(x => x.pitch == slopePitch);
            if (previosSlope) {
                previosSlope.shingle_area = this.general.parseNumber(previosSlope.shingle_area)
                    + this.general.parseNumber(slope.shingle_area);
            } else {
                groupSlopes.push({ ...slope, pitch: slopePitch });
            }
        }

        return groupSlopes;
    }


    calculateUnderlaymentLabor() {
        const inwOption = this.general.parseNumber(this.building.psb_measure.id_inwshield_rows);

        if (inwOption != 4) {
            return this.calculateUnderlaymentPartialRoof(); //TODO: restar las sq de Inw que sea steep slope al total de sq de underlayment
        }

        return [];
    }

    calculateUnderlaymentPartialRoof() {
        const slopes = this.getSlopes();
        const steepSlopes = slopes?.filter(x => x.pitch >= 4)

        if((steepSlopes?.length ?? 0) == 0){
            return [];
        }

        let underlaymentCosts = [];
        for (const shingle of this.shingles) {
            //const shingleSQ = this.getTotalShinglesSQ(shingle);
            const groupedSlopes = this.groupSlopesByPitch(steepSlopes);

            let slopesCosts = [];
            for (let slope of groupedSlopes) {
                const cost = this.getSlopeCost(slope, shingle, this.laborCategoryUnderlaymentId);
                slopesCosts = slopesCosts.concat(cost);
            }

            const totalCost = this.getLayerTotalsUnderlayment(slopesCosts, shingle);
            underlaymentCosts = underlaymentCosts.concat(totalCost);
        }

        return underlaymentCosts.filter(labor => labor != null);
    }

    private getLayerTotalsUnderlayment(laborCosts: LaborCost[], shingle: any): any[] {
        //let laborTotals = [];

        //for (let layer = 1; layer <= 5; layer++) {
        let layerLabor = laborCosts.filter(labor => {
            //labor.layer == layer &&
            return labor.id_material_type_shingle == shingle.id_material_type;
        });
        let total = this.generalLabor.getSum("total_cost", layerLabor);
        let qty = this.generalLabor.getSum("qty", layerLabor);
        let decimals = this.getDecimals(qty);
        qty = decimals == 0.99 ? Math.trunc(qty) + 1 : qty;
        decimals = this.getTwoDecimals(qty);
        qty = decimals == 0.99 ? Math.trunc(qty) + 1 : qty;

        let prices = layerLabor.map(x => x.price);
        return this.getLayerTotalUnderlayment(layerLabor, shingle, total, qty, prices);
        //laborTotals = laborTotals.concat();
        //}

        //return laborTotals;
    }

    private getLayerTotalUnderlayment(labors, shingle, cost, qty, prices) {
        // if (labors.length == 0) {
        //     return null;
        // }
        const labor_category_underlayment = this.laborCategoryUnderlaymentId;
        const concept_types_labor = this.conceptTypesLabor;
        let labor = labors[0];
        if (!labor) {
            return null;
        }
        const allCostEquals = prices.every(x => x == prices[0]);

        let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        newCalc.qty = qty;
        newCalc.calculation_type = 'Costo de Underlayment';
        newCalc.category = labor_category_underlayment
        newCalc.concept = "Install Underlayment";
        newCalc.concept_type = labor.labor_type;
        newCalc.id_concept_type = concept_types_labor;
        newCalc.id_concept = labor.id_labor_type;
        newCalc.cost = allCostEquals ? prices[0] : cost / newCalc.qty;
        newCalc.price = prices;
        newCalc.coverage = null;
        newCalc.id_labor_type = labor.id_labor_type;
        newCalc.laborLayer = labors;
        newCalc.is_final = true;
        newCalc.unit = null;
        newCalc.unit_abbrevation = null;
        newCalc.value = allCostEquals ? this.general.parseNumber(newCalc.cost) * this.general.parseNumber(qty) : cost;
        newCalc.id_material_price_list = null;
        newCalc.id_price_list = null;
        newCalc.id_material_type_shingle = shingle.id_material_type;
        return newCalc;
    }
}
