import { Building } from "src/app/models/building.model";
import { PsbSlope } from "src/app/models/psb-slope.model";
import { Injectable } from '@angular/core';
import { CALCULATION_SCHEMA } from '../const';
import { ShinglesService } from "../materials/shingles.service";
import { LaborCost } from "src/app/models/labor-cost.model";
import { GeneralLaborService } from "./general.service";
import { GeneralService } from "../materials/general.service";
import { CatalogsService } from "src/app/services/catalogs.service";
import { PsbMeasures } from "src/app/models/psb-measures.model";
import { TearOffLaborService } from "./tearoff.service";


@Injectable({
    providedIn: 'root',
})
export class InstallLaborService {

    private materialList: any;

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    constructor(
        private catalogs: CatalogsService,
        private shingle: ShinglesService,
        private general: GeneralLaborService,
        private generalService: GeneralService,
        private tearoff: TearOffLaborService
    ) { }


    async calcInstallLabor(building: Building, materialsCalc) {
        let slopes = building.psb_measure.psb_slopes?.filter(x => x.deletedAt == null);
        let labors = [];
        let shingles = await this.shingle.getShingles();
        const category_ridgecap = await this.generalService.getConstValue('category_ridgecap');
        const category_starter = await this.generalService.getConstValue('category_starters');
        const job_types_overlay = await this.generalService.getConstDecimalValue('job_types_overlay');
        const labor_category_install = await this.generalService.getConstValue('labor_category_install');
        const labor_category_overlay = await this.generalService.getConstValue('labor_category_overlay');

        for (let shingle of shingles) {
            let slopesSQ = await this.tearoff.getTotalShinglesSQ(materialsCalc, shingle, building.psb_measure);

            let ridgecapSQ = await this.tearoff.getTotalRidgeCapsSQ(materialsCalc, shingle, building.psb_measure,building);
            if (ridgecapSQ == null) {
                continue;
            }

            let starterSQ = await this.getInstallTotalStartersSQ(materialsCalc, shingle, building.psb_measure);
            if (starterSQ == null) {
                continue;
            }

            let installLabor = [];
            let morExpensiveSlope = null;
            const groupedSlopes = this.groupSlopesByPitch(slopes);
            for (let slope of groupedSlopes) {
                if (slope.pitch >= 2) {
                    const laborCost = await this.getInstallCost(building.psb_measure, slope, building.id_job_type, slopesSQ, ridgecapSQ, shingle, starterSQ);
                    installLabor = installLabor.concat(laborCost);
                    if (morExpensiveSlope == null || (slope.pitch > morExpensiveSlope.pitch)) {
                        morExpensiveSlope = JSON.parse(JSON.stringify(slope));
                    }
                }
            }
            if (morExpensiveSlope == null) {
                return [];
            }
            let idLaborCategory;
            //for(let layer = 1; layer<=5; layer++){
            //    const layerLabor = installLabor.filter( x => {x.layer = layer});
            //    if(layerLabor == null){
            //        continue;
            //    }
            const exactTotal = this.general.getSum("shingle_area", installLabor);
            morExpensiveSlope.shingle_area = parseFloat((1 * slopesSQ - exactTotal).toFixed(3));
            const exactTotalRidgecap = this.general.getSum("ridgecap_area", installLabor);
            const exactTotalStarter = this.general.getSum("starter_area", installLabor);
            ridgecapSQ = parseFloat((1 * ridgecapSQ - exactTotalRidgecap).toFixed(3));
            starterSQ = parseFloat((1 * starterSQ - exactTotalStarter).toFixed(3));

            if (building.id_job_type != job_types_overlay) {
                idLaborCategory = labor_category_install;
            } else {
                idLaborCategory = labor_category_overlay;
            }
            //TODO: Ver porque no se carga el adjustment
            const adjusmentCost = await this.adjustmentLaborCost(building.psb_measure, morExpensiveSlope, shingle, building.id_job_type, ridgecapSQ, starterSQ);
            //const tearOffCost = await this.getTearoffLaborCost(building.psb_measure, morExpensiveSlope, building.id_job_type, slopesSQ, ridgecapSQ, shingle, starterSQ);

            installLabor = installLabor.concat(adjusmentCost);
            //}
            //TODO:Totalizar todos los slopes por cada shingle line.
            let labor = installLabor.filter(labor => labor.id_material_type_shingle == shingle.id_material_type);
            let groupedCosts = this.groupCostsByPitch(labor);
            groupedCosts = this.costsRoundArea(groupedCosts, shingle);
            let total = this.general.getSum("total_cost", groupedCosts);
            const installTotals = await this.getInstallTotals(groupedCosts, shingle, total, idLaborCategory);
            labors = labors.concat(installTotals);
        }
        return labors.filter(labor => labor != null);
    }

    costsRoundArea(groupedCosts: any[], shingle): any[] {
        const validDecimals = this.getValidDecimals(shingle.coverage_sq);
        for (const cost of groupedCosts) {
            const costDecimals = this.getDecimals(cost.qty);

            let validFinal = 0;
            let difference = null;
            for (const validDec of validDecimals) {
                const auxDiffence = validDec - costDecimals;
                if (auxDiffence >= 0 && (difference == null || difference > auxDiffence)) {
                    validFinal = validDec;
                    difference = auxDiffence;
                }
            }
            cost.qty = Math.trunc(cost.qty) + validFinal;
            cost.total_area = cost.qty;
            cost.total = this.generalService.parseNumber(cost.price) * this.generalService.parseNumber(cost.total_area);
            cost.value = cost.total;
            cost.total_cost = cost.total;
        }
        return groupedCosts;
    }

    getValidDecimals(coverage_sq: number) {
        const values = [];
        const decimal = this.getDecimals(coverage_sq);
        if (decimal == 0) {
            return [1, 0];
        }

        let aux = 0;
        while (aux < 1) {
            aux = this.generalService.truncateDecimals((aux + decimal));
            if (aux == .99 || aux >= 1) aux = 1;
            values.push(aux);
            if (aux == 1) break;
        }

        return [...values, 0];
    }

    getDecimals(value: number) {
        const decimals = this.generalService.parseNumber(value) - Math.trunc(this.generalService.parseNumber(value));
        return this.generalService.truncateDecimals(decimals, 2);
    }

    groupCostsByPitch(labors: any[]) {
        const groups: any[] = [];

        for (const labor of labors) {
            const slopePitch = Math.trunc(labor.slope.pitch);
            const previosCost = groups.find(x => x.slope.pitch == slopePitch && x.floor == labor.floor && x.layer == labor.layer);
            if (previosCost) {
                previosCost.qty = this.generalService.parseNumber(previosCost.qty) + this.generalService.parseNumber(labor.qty);
                previosCost.ridgecap_area = this.generalService.parseNumber(previosCost.ridgecap_area) + this.generalService.parseNumber(labor.ridgecap_area);
                previosCost.shingle_area = this.generalService.parseNumber(previosCost.shingle_area) + this.generalService.parseNumber(labor.shingle_area);
                previosCost.starter_area = this.generalService.parseNumber(previosCost.starter_area) + this.generalService.parseNumber(labor.starter_area);
                previosCost.osb_area = this.generalService.parseNumber(previosCost.osb_area) + this.generalService.parseNumber(labor.osb_area);
                previosCost.total_area = this.generalService.parseNumber(previosCost.total_area) + this.generalService.parseNumber(labor.total_area);
                previosCost.total_cost = this.generalService.parseNumber(previosCost.total_cost) + this.generalService.parseNumber(labor.total_cost);
                previosCost.value = this.generalService.parseNumber(previosCost.value) + this.generalService.parseNumber(labor.value);
                previosCost.slope.osb_area = this.generalService.parseNumber(previosCost.slope?.osb_area) + this.generalService.parseNumber(labor.slope?.osb_area);
                previosCost.slope.shingle_area = this.generalService.parseNumber(previosCost.slope?.shingle_area) + this.generalService.parseNumber(labor.slope?.shingle_area);
            } else {
                groups.push({ ...labor, pitch: slopePitch });
            }
        }

        return groups;
    }

    groupSlopesByPitch(slopes: PsbSlope[]) {
        const groupSlopes: PsbSlope[] = [];

        for (const slope of slopes) {
            const slopePitch = Math.trunc(slope.pitch);
            const previosSlope = groupSlopes.find(x => x.pitch == slopePitch);
            if (previosSlope) {
                previosSlope.osb_area = this.generalService.parseNumber(previosSlope.osb_area) + this.generalService.parseNumber(slope.osb_area);
                previosSlope.shingle_area = this.generalService.parseNumber(previosSlope.shingle_area) + this.generalService.parseNumber(slope.shingle_area);
                previosSlope.starter_area = this.generalService.parseNumber(previosSlope.starter_area) + this.generalService.parseNumber(slope.starter_area);
                previosSlope.ridgecap_area = this.generalService.parseNumber(previosSlope.ridgecap_area) + this.generalService.parseNumber(slope.ridgecap_area);
            } else {
                groupSlopes.push({ ...slope, pitch: slopePitch });
            }
        }

        return groupSlopes;

    }
    async getInstallTotalStartersSQ(materialsCalc: any, shingle: any, psb_measure: PsbMeasures) {
        const category_starter = await this.generalService.getConstValue('category_starters');
        const starters = materialsCalc.filter(
            material => material
                && material?.id_material_category == category_starter
                && material.id_material_type_shingle == shingle.id_material_type
        );
        if (!starters || starters.length == 0) {
            return null;
        }
        let qty = starters[0].qty;
        const material = (await this.tearoff.getStarterSelected(category_starter, shingle));
        let sq = qty / material[0].coverage_sq;

        const category_presidential_starters = await this.generalService.getConstValue('category_presidential_starters');
        const category_shingle_presidential = (await this.generalService.getConstValue('category_shingle_presidential')).split(",");

        if (category_shingle_presidential.find(x => x == shingle.id_material_category)) {
            const presidentialStarters = materialsCalc.filter(material => material
                && material?.id_material_category == category_presidential_starters
                && material.id_material_type_shingle == shingle.id_material_type
            );
            if (presidentialStarters && presidentialStarters.length > 0) {
                sq += (presidentialStarters[0].qty / material[0].coverage_sq);
            }
        }
        return sq;
    }

    async adjustmentLaborCost(psb_measure: PsbMeasures, slope: any, shingle: any, idJobType: number, ridgecapSQ: number, starterSQ: number) {
        let laborPrices = (await this.catalogs.getLaborPitchPrices()).data;

        const job_types_overlay = await this.generalService.getConstValue('job_types_overlay');
        const labor_category_overlay = await this.generalService.getConstValue('labor_category_overlay');
        const labor_category_install = await this.generalService.getConstValue('labor_category_install');
        const concept_types_labor = await this.generalService.getConstDecimalValue('concept_types_labor');

        let idLaborCategory;
        switch (idJobType) {
            case parseInt(job_types_overlay):
                idLaborCategory = labor_category_overlay;
                break;
            default:
                idLaborCategory = labor_category_install;
        }
        let installLabor = [];
        let costs = laborPrices.filter(price => {
            return price.id_material_category == shingle.id_material_category
                && price.id_labor_category == idLaborCategory
                && price.id_job_type == idJobType
                && price.pitch == Math.trunc(slope.pitch)
                && price.floor_slope == slope.floor
        });
        for (let cost of costs) {
            let laborCost = new Object as LaborCost;
            laborCost.ridgecap_area = ridgecapSQ;
            laborCost.starter_area = starterSQ;
            laborCost.shingle_area = slope.shingle_area;
            laborCost.total_area = laborCost.shingle_area + laborCost.ridgecap_area + laborCost.starter_area;
            laborCost.total_cost = cost.price * laborCost.total_area;
            laborCost.price = cost.price;
            laborCost.id_labor_cost = cost.id;
            laborCost.labor_type = cost.labor_type + " Adjustment";
            laborCost.slope = slope;
            laborCost.layer = null;
            laborCost.floor = slope.floor;
            laborCost.qty = laborCost.total_area;
            laborCost.value = laborCost.total_cost;
            laborCost.id_material_type_shingle = shingle.id_material_type;
            laborCost.id_labor_category = idLaborCategory;
            laborCost.id_concept_type = concept_types_labor;
            //TODO: Eliminar cuando ya se calcule totales de labor.
            laborCost.total = laborCost.total_cost;
            let temp = JSON.parse(JSON.stringify(laborCost));
            installLabor.push(temp);
        }
        return installLabor;
    }

    async getInstallTotals(labors, shingle, cost, idLaborCategory) {
        let calc = [];

        if (labors.length == 0) {
            return null;
        }

        let layerLabor = labors.filter(labor => {
            return labor.id_material_type_shingle == shingle.id_material_type;
        });

        let labor = layerLabor[0];
        let qty = this.general.getSum("total_area", layerLabor);
        //if (!pieces) return null;
        const concept_types_labor = await this.generalService.getConstValue('concept_types_labor');
        let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        newCalc.qty = qty;//Math.ceil(qty);
        newCalc.calculation_type = 'Costo de ' + labor.labor_type;
        newCalc.category = idLaborCategory;
        //newCalc.material = material.material;
        newCalc.concept = "Install ";
        newCalc.concept_type = labor.labor_type;
        newCalc.id_concept_type = concept_types_labor;
        newCalc.id_concept = labor.id_labor_type;
        newCalc.cost = cost / newCalc.qty;
        newCalc.coverage = null;
        newCalc.id_labor_type = labor.id_labor_type;
        //newCalc.id_material = material.id;
        newCalc.laborLayer = layerLabor;
        newCalc.is_final = true;
        newCalc.unit = null;
        newCalc.unit_abbrevation = null;
        newCalc.value = cost;
        newCalc.id_material_price_list = null;
        newCalc.id_price_list = null;
        newCalc.id_material_type_shingle = shingle.id_material_type;
        return newCalc;
    };

    async getInstallCost(psb_measure: PsbMeasures, slope: PsbSlope, idJobType, slopesSQ, ridgecapSQ, shingle, starterSQ) {
        let laborPrices = (await this.catalogs.getLaborPitchPrices()).data;

        const job_types_overlay = await this.generalService.getConstDecimalValue('job_types_overlay');
        const labor_category_overlay = await this.generalService.getConstDecimalValue('labor_category_overlay');
        const labor_category_install = await this.generalService.getConstDecimalValue('labor_category_install');
        const concept_types_labor = await this.generalService.getConstDecimalValue('concept_types_labor');

        let idLaborCategory;
        switch (idJobType) {
            case job_types_overlay:
                idLaborCategory = labor_category_overlay;
                break;
            default:
                idLaborCategory = labor_category_install;
        }
        let installLabor = [];
        let costs = laborPrices.filter(price => {
            return price.id_material_category == shingle.id_material_category
                && price.id_labor_category == idLaborCategory
                && price.id_job_type == parseInt(idJobType)
                && price.pitch == Math.trunc(slope.pitch)
                && price.floor_slope == slope.floor
        });
        for (let cost of costs) {
            let laborCost = new Object as LaborCost;
            laborCost.ridgecap_area = this.general.calculateProporcionalArea(slope, slopesSQ, ridgecapSQ);
            laborCost.starter_area = this.general.calculateProporcionalArea(slope, slopesSQ, starterSQ);
            laborCost.shingle_area = this.generalService.plusWasting(slope.shingle_area, psb_measure.wasting);
            laborCost.total_area = laborCost.shingle_area + laborCost.ridgecap_area + laborCost.starter_area;
            laborCost.total_cost = cost.price * laborCost.total_area;
            laborCost.price = cost.price;
            laborCost.id_labor_cost = cost.id;
            laborCost.labor_type = cost.labor_type;
            laborCost.slope = slope;
            laborCost.layer = null;
            laborCost.floor = slope.floor;
            laborCost.qty = laborCost.total_area;
            laborCost.value = laborCost.total_cost;
            laborCost.id_material_type_shingle = shingle.id_material_type;
            laborCost.id_labor_category = idLaborCategory;
            laborCost.id_concept_type = concept_types_labor;
            //TODO: Eliminar cuando ya se calcule totales de labor.
            laborCost.total = laborCost.total_cost;
            let temp = JSON.parse(JSON.stringify(laborCost));
            installLabor.push(temp);
        }
        return installLabor;
    }
}