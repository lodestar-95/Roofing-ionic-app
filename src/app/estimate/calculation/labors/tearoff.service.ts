import { Building } from "src/app/models/building.model";
import { PsbSlope } from "src/app/models/psb-slope.model";
import { Injectable } from '@angular/core';
import { CALCULATION_SCHEMA } from '../const';
import { ShinglesService } from "../materials/shingles.service";
import { LaborCost } from "src/app/models/labor-cost.model";
import { GeneralLaborService } from "./general.service";
import { CatalogsService } from 'src/app/services/catalogs.service';
import { GeneralService } from "../materials/general.service";
import { RidgecapsService } from "../materials/ridgecaps.service";
import { PsbMeasures } from "src/app/models/psb-measures.model";
import { ShingleTypesRemove } from "src/app/models/shingle_types_remove.model";

@Injectable({
    providedIn: 'root',
})
export class TearOffLaborService {
    shingleTypesRemoves: ShingleTypesRemove[] = [];

    private materialList: any;

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    constructor(
        private shingle: ShinglesService,
        private general: GeneralService,
        private catalogs: CatalogsService,
        private generalLabor: GeneralLaborService,
        private ridgeCaps: RidgecapsService
    ) { }

    private laborCost: LaborCost = new Object as LaborCost;

    async calcTearOffLabor(building: Building, materialsCalc) {
        let slopes = building.psb_measure.psb_slopes.filter(x => x.deletedAt == null);

        const shingles = await this.shingle.getShingles();
        let calculation = [];
        for (let shingle of shingles) {
            let slopesSQ = await this.getTotalShinglesSQ(materialsCalc, shingle, building.psb_measure);
            let ridgecapSQ = 0;
            let starterSQ = 0;
            let presidentialStarterSQ = 0;
            if (slopesSQ > 0) {
                ridgecapSQ = await this.getTotalRidgeCapsSQ(materialsCalc, shingle, building.psb_measure, building);
                if (ridgecapSQ == null) {
                    continue;
                }
                starterSQ = await this.getTotalStartersSQ(materialsCalc, shingle, building.psb_measure);
                if (starterSQ == null) {
                    continue;
                }
                presidentialStarterSQ = await this.getTotalPresidentialStartersSQ(materialsCalc, shingle, building.psb_measure);
                if (presidentialStarterSQ == null) {
                    presidentialStarterSQ = 0;
                }
                starterSQ +=presidentialStarterSQ;
            }
            let tearOffL = [];
            let tearOffLabor = [];
            let moreExpensiveSlope = [];
            const groupedSlopes = this.groupSlopesByPitch(slopes);

            for (let slope of groupedSlopes) {
                let cost = await this.getTearoffLaborCost(building.psb_measure, slope, building.id_job_type, slopesSQ, ridgecapSQ, shingle, starterSQ);
                const tearOffCosts = null;
                const tearOffCost = JSON.parse(JSON.stringify(cost));
                tearOffL = tearOffL.concat(JSON.parse(JSON.stringify(tearOffCost)));

                if (moreExpensiveSlope[slope.layers] == null || (slope.pitch > moreExpensiveSlope[slope.layers].pitch)) {
                    moreExpensiveSlope[slope.layers] = JSON.parse(JSON.stringify(slope));
                }
            }
            moreExpensiveSlope = await this.getMoreExpensiveSlopes(moreExpensiveSlope);
            //TODO:For para recorrer capa por capa
            //TODO: Validar que tome el labor correcto para el tipo de shingle a quitar.
            const adjusmentCosts = await this.getAdjustment(tearOffL, moreExpensiveSlope, slopesSQ, ridgecapSQ, starterSQ, shingle, building);
            tearOffL = tearOffL.concat(adjusmentCosts);
            let groupedCosts = this.groupCostsByPitch(tearOffL);
            groupedCosts = this.costsRoundArea(groupedCosts, shingle);
            const tearOffTotals = await this.getTearOffLayerTotals(groupedCosts, shingle);
            calculation = calculation.concat(tearOffTotals);
        }
        calculation = calculation.filter(labor => labor != null);
        return calculation;
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
            cost.total = this.general.parseNumber(cost.price) * this.general.parseNumber(cost.total_area);
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
            aux = this.general.truncateDecimals((aux + decimal));
            if (aux == .99 || aux >= 1) aux = 1;
            values.push(aux);
            if (aux == 1) break;
        }

        return [...values, 0]
    }

    getDecimals(value: number) {
        const decimals = this.general.parseNumber(value) - Math.trunc(this.general.parseNumber(value));
        return this.general.truncateDecimals(decimals, 2);
    }

    getTwoDecimals(value: number) {
        const decimals = this.general.parseNumber(value) - Math.trunc(this.general.parseNumber(value));
        return this.general.truncateTwoDecimals(decimals);
    }

    groupCostsByPitch(tearOffL: any[]) {
        const groups: any[] = [];

        for (const tearOff of tearOffL) {
            const slopePitch = Math.trunc(tearOff.slope.pitch);
            const previosCost = groups.find(x => x.slope.pitch == slopePitch && x.floor == tearOff.floor && x.layer == tearOff.layer);
            if (previosCost) {
                previosCost.qty = this.general.parseNumber(previosCost.qty) + this.general.parseNumber(tearOff.qty);
                previosCost.ridgecap_area = this.general.parseNumber(previosCost.ridgecap_area) + this.general.parseNumber(tearOff.ridgecap_area);
                previosCost.shingle_area = this.general.parseNumber(previosCost.shingle_area) + this.general.parseNumber(tearOff.shingle_area);
                previosCost.starter_area = this.general.parseNumber(previosCost.starter_area) + this.general.parseNumber(tearOff.starter_area);
                previosCost.osb_area = this.general.parseNumber(previosCost.osb_area) + this.general.parseNumber(tearOff.osb_area);
                previosCost.total_area = this.general.parseNumber(previosCost.total_area) + this.general.parseNumber(tearOff.total_area);
                previosCost.total_cost = this.general.parseNumber(previosCost.total_cost) + this.general.parseNumber(tearOff.total_cost);
                previosCost.value = this.general.parseNumber(previosCost.value) + this.general.parseNumber(tearOff.value);
                previosCost.slope.osb_area = this.general.parseNumber(previosCost.slope?.osb_area) + this.general.parseNumber(tearOff.slope?.osb_area);
                previosCost.slope.shingle_area = this.general.parseNumber(previosCost.slope?.shingle_area) + this.general.parseNumber(tearOff.slope?.shingle_area);
            } else {
                groups.push({ ...tearOff, pitch: slopePitch });
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
                previosSlope.osb_area = this.general.parseNumber(previosSlope.osb_area) + this.general.parseNumber(slope.osb_area);
                previosSlope.shingle_area = this.general.parseNumber(previosSlope.shingle_area) + this.general.parseNumber(slope.shingle_area);
                previosSlope.starter_area = this.general.parseNumber(previosSlope.starter_area) + this.general.parseNumber(slope.starter_area);
                previosSlope.ridgecap_area = this.general.parseNumber(previosSlope.ridgecap_area) + this.general.parseNumber(slope.ridgecap_area);
            } else {
                groupSlopes.push({ ...slope, pitch: slopePitch });
            }
        }

        return groupSlopes;
    }

    async getMoreExpensiveSlopes(moreExpensiveSlope: any[]) {
        let next;
        for (let layer = 5; layer > 0; layer--) {
            if (moreExpensiveSlope[layer] == null && next != null) {
                moreExpensiveSlope[layer] = next;
            }
            if (next == null && moreExpensiveSlope[layer] != null) {
                next = moreExpensiveSlope[layer];
            }
        }
        return moreExpensiveSlope;
    }

    async getAdjustment(tearOffL, moreExpensiveSlope, slopesSQ, ridgecapSQ, starterSQ, shingle, building) {
        let adjusments = [];
        for (let layer = 1; layer <= 5; layer++) {
            const layerLabor = tearOffL.filter(x => x.layer == layer);

            if (layerLabor.length == 0) {
                continue;
            }
            const exactTotal = this.generalLabor.getSum("shingle_area", layerLabor);
            if (slopesSQ > 0) {
                moreExpensiveSlope[layer].shingle_area = parseFloat((1 * slopesSQ - exactTotal).toFixed(3));
                if (moreExpensiveSlope[layer].shingle_area < 0) {
                    moreExpensiveSlope[layer].shingle_area = 0;
                }
            } else {
                moreExpensiveSlope[layer].shingle_area = 0;
            }
            const exactTotalRidgecap = this.generalLabor.getSum("ridgecap_area", layerLabor);
            const exactTotalStarter = this.generalLabor.getSum("starter_area", layerLabor);
            let ridgecapSQDiff = parseFloat((1 * ridgecapSQ - exactTotalRidgecap).toFixed(3));
            let starterSQDiff = parseFloat((1 * starterSQ - exactTotalStarter).toFixed(3));
            const labor_category_tear_off = await this.general.getConstDecimalValue('labor_category_tear_off');
            const adjusment = await this.adjustmentLaborCost(building.psb_measure, moreExpensiveSlope[layer], shingle, building.id_job_type, ridgecapSQDiff, starterSQDiff, layer);
            //const adjusmentCost = await this.getTearoffLaborCost(building.psb_measure, morExpensiveSlope, building.id_job_type, slopesSQ, ridgecapSQ, shingle, starterSQ);
            //console.log(adjusmentCost);
            adjusments = adjusments.concat(adjusment);
        }
        return adjusments;
    }
    ;

    async getTotalShinglesSQ(materialsCalc, shingle, psb_measure) {
        //const category_shingle = await (await this.general.getConstValue('category_shingle')).split(",");

        const shingles = materialsCalc.filter(
            material => material
                && material?.id_material_type == shingle.id_material_type
                && material.id_material_type_shingle == shingle.id_material_type
        );
        if (!shingles || shingles.length == 0) {
            return null;
        }
        const qty = shingles[0].qty;
        //const material = (await this.ridgeCaps.getRidgecapSelected(psb_measure.psb_selected_materials, category_ridgecap, shingle))
        return qty;
    }

    async getTotalRidgeCapsSQ(materialsCalc, shingle, psb_measure, building) {
        const category_ridgecap = await this.general.getConstValue('category_ridgecap');
        const material_type_hp_ridgecap = await this.general.getConstDecimalValue('material_type_hp_ridgecap');
        const builtInUpgrade = await this.getBuiltRidgeCapUpgrade(building);

        const ridgeCaps = materialsCalc.filter(
            material => material
                && material?.id_material_category == category_ridgecap
                && material.id_material_type_shingle == shingle.id_material_type
        );
        if (!ridgeCaps || ridgeCaps.length == 0) {
            return null;
        }
        const qty = ridgeCaps[0].qty;
        const material = (await this.ridgeCaps.getRidgecapSelected(psb_measure.psb_selected_materials, category_ridgecap, shingle, builtInUpgrade, material_type_hp_ridgecap))
        return qty / material[0].coverage_sq;
    }

    async getBuiltRidgeCapUpgrade(building: any) {
        const upgrade_ridgecap = await this.general.getConstDecimalValue('upgrade_ridgecap');
        const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');

        const upgrade = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_ridgecap);
        return upgrade && upgrade.id_cost_integration == cost_integration_built_in;

    }

    async getTotalStartersSQ(materialsCalc, shingle, psb_measure) {
        const category_starter = await this.general.getConstValue('category_starters');
        const starters = materialsCalc.filter(
            material => material
                && material?.id_material_category == category_starter
                && material.id_material_type_shingle == shingle.id_material_type
        );
        if (!starters || starters.length == 0) {
            return null;
        }
        let qty = starters[0].qty

        const material = (await this.getStarterSelected(category_starter, shingle))
        return qty / material[0].coverage_sq;
    }
    
    async getTotalPresidentialStartersSQ(materialsCalc, shingle, psb_measure) {
        const category_starter = await this.general.getConstValue('category_presidential_starters');
        const starters = materialsCalc.filter(
            material => material
                && material?.id_material_category == category_starter
                && material.id_material_type_shingle == shingle.id_material_type
        );
        if (!starters || starters.length == 0) {
            return null;
        }
        let qty = starters[0].qty

        const material = (await this.getStarterSelected(category_starter, shingle))
        return qty / material[0].coverage_sq;
    }

    async getStarterSelected(category_starter: string, shingle: any) {

        return this.general.getMaterial(this.materialList, category_starter).filter(x => {
            return x.id_material_category == category_starter
                && x.id_trademark == shingle.id_trademark;
        })
    }

    async getTearOffLayerTotals(tearOffLabor: LaborCost[], shingle: any): Promise<any[]> {
        let tearOffLaborTotal = [];
        for (let layer = 1; layer <= 5; layer++) {
            let layerLabor = tearOffLabor.filter(labor => {
                return labor.layer == layer && labor.id_material_type_shingle == shingle.id_material_type;
            });
            let total = this.generalLabor.getSum("total_cost", layerLabor);
            let qty = this.generalLabor.getSum("qty", layerLabor);
            let decimals = this.getDecimals(qty);
            qty = decimals == 0.99 ? Math.trunc(qty) + 1 : qty;
            decimals = this.getTwoDecimals(qty);
            qty = decimals == 0.99 ? Math.trunc(qty) + 1 : qty;

            let prices = layerLabor.map(x => x.price);
            tearOffLaborTotal = tearOffLaborTotal.concat(await this.getTearoffTotals(layerLabor, shingle, layer, total, qty, prices));
        }
        return tearOffLaborTotal;
    }


    /*  
  
    let install = laborCalculation.tearOff.filter(labor => labor.layer == 1);
    
    calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 1));
    calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 2));
    calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 3));
    calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 4));
    calculations = calculations.concat(this.tearoff.getTearoffTotals(laborCalculation.tearOff, shingles, 5));
  */
    async getTearoffLaborCost(psb_measure: PsbMeasures, slope: PsbSlope, idJobType, slopesSQ, ridgecapSQ, shingle, starterSQ) {
        let laborPrices = (await this.catalogs.getLaborPitchPrices()).data;
        /*
                let slopeWithWasting = JSON.parse(JSON.stringify(slope));
                slopeWithWasting.shingle_area = this.general.plusWasting(slopeWithWasting.shingle_area, psb_measure.wasting);
        */
        let tearOffL = [];
        const labor_category_tear_off = await this.general.getConstDecimalValue('labor_category_tear_off');
        const concept_types_labor = await this.general.getConstDecimalValue('concept_types_labor');
        const layers = psb_measure.psb_layers.filter(layer => {
            layer.layer <= slope.layers
        })

        let costs = laborPrices.filter(price => {
            return price.id_labor_category == labor_category_tear_off
                && price.id_job_type == parseInt(idJobType)
                && price.pitch == Math.trunc(slope.pitch)
                && price.floor_slope == slope.floor
                && price.layer != null
                && price.layer <= slope.layers
        });
        for (let cost of costs) {
            const layerInfo = await (this.getMaterialCategory(cost.layer, psb_measure.psb_layers));
            const layer = this.getLayer(psb_measure, cost.layer);
            if (cost.id_material_category == layerInfo.id_material_category) {
                let laborCost = {
                    ridgecap_area: 0,
                    starter_area: 0,
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
                laborCost.ridgecap_area = this.generalLabor.calculateProporcionalArea(slope, slopesSQ, ridgecapSQ);
                laborCost.starter_area = this.generalLabor.calculateProporcionalArea(slope, slopesSQ, starterSQ);
                laborCost.shingle_area = this.general.plusWasting(slope.shingle_area, psb_measure.wasting);
                laborCost.total_area = laborCost.shingle_area + laborCost.ridgecap_area + laborCost.starter_area;
                laborCost.total_cost = cost.price * laborCost.total_area;
                laborCost.price = cost.price;
                laborCost.id_labor_cost = cost.id;
                laborCost.labor_type = cost.labor_type;
                laborCost.slope = slope;
                laborCost.layer = cost.layer;
                laborCost.floor = slope.floor;
                laborCost.qty = laborCost.total_area;
                laborCost.value = laborCost.total_cost;
                laborCost.id_material_type_shingle = shingle.id_material_type;
                laborCost.id_concept_type = concept_types_labor;
                laborCost.id_material_category = cost.id_material_category;
                //TODO: Eliminar cuando ya se calcule totales de labor.
                //this.laborCost.total = this.laborCost.total_cost;
                tearOffL.push(laborCost);
            }
        }
        return tearOffL;
    }

    async adjustmentLaborCost(psb_measure: PsbMeasures, slope: PsbSlope, shingle, idJobType, ridgecapSQ, starterSQ, layer) {
        let laborPrices = (await this.catalogs.getLaborPitchPrices()).data;
        let tearOffLabor = [];
        const concept_types_labor = await this.general.getConstDecimalValue('concept_types_labor');

        const labor_category = await this.general.getConstDecimalValue('labor_category_tear_off');
        let costs = laborPrices.filter(price => {
            //console.log("price.id_material_category");
            //console.log(price.id_material_category);
            //console.log(price.id_material_category == shingle.id_material_category);
            return price.id_labor_category == labor_category
                && price.id_job_type == parseInt(idJobType)
                && price.pitch == Math.trunc(slope.pitch)
                && price.floor_slope == slope.floor
                && price.layer != null
                && price.layer == layer
        });
        for (let cost of costs) {
            let laborCost: LaborCost = new Object as LaborCost;
            const layerInfo = await (this.getMaterialCategory(cost.layer, psb_measure.psb_layers));
            if (cost.id_material_category == layerInfo.id_material_category) {
                laborCost.ridgecap_area = ridgecapSQ;
                laborCost.starter_area = starterSQ;
                laborCost.shingle_area = slope.shingle_area;
                laborCost.total_area = laborCost.shingle_area + laborCost.ridgecap_area + laborCost.starter_area;
                laborCost.total_cost = cost.price * laborCost.total_area;
                laborCost.price = cost.price;
                laborCost.id_labor_cost = cost.id;
                laborCost.labor_type = cost.labor_type + " Adjustment";
                laborCost.slope = slope;
                laborCost.layer = cost.layer;
                laborCost.floor = slope.floor;
                laborCost.qty = laborCost.total_area;
                laborCost.value = laborCost.total_cost;
                laborCost.id_material_type_shingle = shingle.id_material_type;
                laborCost.id_concept_type = concept_types_labor;
                laborCost.id_material_category = cost.id_material_category;
                //TODO: Eliminar cuando ya se calcule totales de labor.
                //this.laborCost.total = this.laborCost.total_cost;
                let temp = JSON.parse(JSON.stringify(laborCost));
                temp.layer = laborCost.layer;
                tearOffLabor.push(temp);
            }
        }
        return tearOffLabor;
    }

    calculateStarterArea = (slope: PsbSlope, slopesSQ, starterSQ) => {
        let porcentage = this.generalLabor.getPorcentage(slope, slopesSQ);
        return porcentage * starterSQ;
    };

    calculateRidgecapArea = (slope: PsbSlope, slopesSQ, ridgecapSQ) => {
        let porcentage = this.generalLabor.getPorcentage(slope, slopesSQ);
        return porcentage * ridgecapSQ;
    };

    getShingleSlopesSQTotal = (slopes: PsbSlope[]) => {
        const shingleSlopes = slopes.filter(slope => slope.pitch >= 2);
        const x = this.generalLabor.getSum("shingle_area", slopes);
        return x;
    };


    async getTearoffTotals(labors, shingle, layer, cost, qty, prices) {
        let calc = [];
        if (labors.length == 0) {
            return null;
        }
        const labor_category_tear_off = await this.general.getConstValue('labor_category_tear_off');
        const concept_types_labor = await this.general.getConstValue('concept_types_labor');
        let labor = labors[0];
        const allCostEquals = prices.every(x => x == prices[0]);
        //if (!pieces) return null;
        let newCalc = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        newCalc.qty = qty;
        newCalc.calculation_type = 'Costo de TearOff layer' + layer;
        newCalc.category = labor_category_tear_off
        //newCalc.material = material.material;
        newCalc.concept = "Tearoff Layer " + layer;
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
    };

    getLayer(measure: PsbMeasures, layer: number) {
        return measure.psb_layers.find(x => x.layer == layer);
    }

    async getMaterialCategory(layerNumber: any, layers) {
        const removeTypes = (await this.catalogs.getCShingleTypesRemoves()).data;
        const layer = layers.filter(x => x.layer == layerNumber)[0];
        const rt = removeTypes.filter(rt => rt.id == layer.id_remove_type)
        return {
            layer: layer,
            id_material_category: rt[0].id_material_category
        };
    }
}
