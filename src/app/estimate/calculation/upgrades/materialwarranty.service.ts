import { Injectable } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { Warranty } from 'src/app/models/warranty.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { CALCULATION_SCHEMA, ERRORS } from '../const';
import { GeneralService } from '../materials/general.service';
import { ShinglesService } from '../materials/shingles.service';

@Injectable({
    providedIn: 'root',
})
export class MaterialWarrantyService {
    private materialList: any;
    private warranties: Warranty[];

    constructor(
        private shingle: ShinglesService,
        private general: GeneralService,
        private catalog: CatalogsService
    ) { }

    public setMaterialList(value: any) {
        this.materialList = value;
    }

    async calculate(building: Building, materialCalculations, costTypeId, inspectorTypeId, prospectingType) {
        const upgrade_material_warranty = await this.general.getConstDecimalValue('upgrade_material_warranty');
        const upgrade_workmanship_warranty = await this.general.getConstDecimalValue('upgrade_workmanship_warranty');
        const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
        const cost_integration_declined = await this.general.getConstDecimalValue('cost_integration_declined');
        const tax_percentage = await this.general.getConstDecimalValue('tax_percentage');
        const inspectorCostType = (await this.catalog.getInspectorCostTypes())?.data
            ?.find(cost => cost.id_inspector_type == inspectorTypeId && cost.id_cost_type == costTypeId);

        this.warranties = (await this.catalog.getWarranties()).data;

        const upgradeMaterial = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_material_warranty);
        const upgradeWorkmanship = building.psb_measure.psb_upgrades.find(x => x.id_upgrade == upgrade_workmanship_warranty);

        const shingles = await this.shingle.getShingles();
        const concept_types_material = await this.general.getConstValue('concept_types_material');


        let calculations = [];
        const material_id_cost_integration = upgradeWorkmanship?.id_cost_integration == cost_integration_built_in
            ? cost_integration_declined
            : upgradeMaterial?.id_cost_integration;

        const warranty_type_material = await this.general.getConstValue('warranty_type_material');
        const concept_types_material_warranty_upgrade = await this.general.getConstValue('concept_types_material_warranty_upgrade');

        for (const shingle of shingles) {
            const cost = await this.calculateUpgrade(materialCalculations, shingle,
                warranty_type_material, concept_types_material, tax_percentage, inspectorCostType, prospectingType);
            const calculation = this.getUpgradeCalculation(cost?.cost, shingle,
                upgrade_material_warranty, concept_types_material_warranty_upgrade,
                'Material Full System Warranty Upgrade');
            calculation.id_cost_integration = material_id_cost_integration;
            calculation.details = cost?.details;
            calculations.push(calculation);
        }


        const warranty_type_workmanship = await this.general.getConstValue('warranty_type_workmanship');
        const concept_types_workmanship_warranty_upgrade =
            await this.general.getConstValue('concept_types_workmanship_warranty_upgrade');

        for (const shingle of shingles) {
            const cost = await this.calculateUpgrade(materialCalculations, shingle,
                warranty_type_workmanship, concept_types_material, tax_percentage, inspectorCostType, prospectingType);
            const calculation = this.getUpgradeCalculation(cost?.cost, shingle,
                upgrade_workmanship_warranty, concept_types_workmanship_warranty_upgrade,
                'Manufacture Workmanship Warranty Upgrade');
            calculation.id_cost_integration = upgradeWorkmanship?.id_cost_integration;
            calculation.details = cost?.details;
            calculations.push(calculation);
        }

        return calculations;
    }

    private async calculateUpgrade(materialCalculations, shingle, warranty_type, concept_types_material, tax_percentage, inspectorCostType, prospectingType) {

        let details = [];
        const materials = materialCalculations
            .filter(x => x.id_material_type_shingle == shingle.id_material_type
                && x.id_trademark == shingle.id_trademark
                && x.id_concept_type == concept_types_material);

        const materialQuantity = materials.length;

        const warranty = this.warranties.find(x => x.id_trademark == shingle.id_trademark
            && x.id_warranty_type == warranty_type
            && x.id_prospecting_type == prospectingType
            && (x.id_material_type_shingle == null || x.id_material_type_shingle == shingle.id_material_type));

        const requiredQuantity = +warranty?.qty_other_materials ?? 0;
        const costPerSQ = await this.getCostPerSq(warranty, materialCalculations, shingle);
        details.push({ concept: 'Required Materials Qty', value: requiredQuantity });
        details.push({ concept: 'Current Materials Qty', value: materialQuantity });

        let cost = 0;
        if (materialQuantity < requiredQuantity) {
            const changeMaterials = materialCalculations.filter(x => x.id_material_type_shingle == shingle.id_material_type
                && x.id_trademark != shingle.id_trademark
                && x.id_concept_type == concept_types_material);

            let costs = [];
            for (const changeMaterial of changeMaterials) {
                const newMaterial = this.materialList.find(x => x.id_material_category == changeMaterial.id_material_category
                    && x.id_trademark == shingle.id_trademark);
                if (newMaterial) {
                    const qtylf = newMaterial.coverage_lf ? Math.ceil(changeMaterial.sqlf / newMaterial.coverage_lf) : 0;
                    const totallf = newMaterial.coverage_lf ? (newMaterial.cost * qtylf) : 0;
                    const differenceLF = newMaterial.coverage_lf ? (totallf - changeMaterial.value) : 0;

                    const qtysq = newMaterial.coverage_sq ? Math.ceil(changeMaterial.sqlf / newMaterial.coverage_sq) : 0;
                    const totalsq = newMaterial.coverage_sq ? (newMaterial.cost * qtysq) : 0;
                    const differenceSQ = newMaterial.coverage_sq ? (totalsq - changeMaterial.value) : 0;

                    if (differenceLF && differenceLF > 0) {

                        const newMatCalculation = {
                            ...changeMaterial, coverage: newMaterial.coverage_lf, value: totallf, qty: qtylf,
                            cost: newMaterial.cost,
                            concept: newMaterial.material
                        };
                        costs.push({ cost: differenceLF, oldMaterial: changeMaterial, newMaterial: newMatCalculation });
                    } else {

                        const newMatCalculation = {
                            ...changeMaterial, coverage: newMaterial.coverage_sq, value: totalsq, qty: qtysq,
                            cost: newMaterial.cost,
                            concept: newMaterial.material
                        };
                        costs.push({ cost: differenceSQ, oldMaterial: changeMaterial, newMaterial: newMatCalculation });
                    }
                }
            }
            costs = costs.sort((a, b) => a.cost - b.cost);
            const remainingMaterials = requiredQuantity - materialQuantity;
            let remainingMaterialsAux = remainingMaterials;

            if (costs.length > 0) {
                for (let i = 0; i < remainingMaterials && i < costs.length; i++) {
                    cost += costs[i].cost;
                    details.push(costs[i].oldMaterial);
                    details.push(costs[i].newMaterial);
                    remainingMaterialsAux--;
                }
            }
            if (remainingMaterialsAux > 0) {
                return null;
            }
        }

        details.push({ concept: 'Change Cost', value: cost });

        const costWithTax = cost * (100 + tax_percentage) / 100;
        details.push({ concept: 'Cost + Taxes', value: costWithTax });

        const costSubtotal = costWithTax + costPerSQ;
        details.push({ concept: 'Cost per SQ', value: costPerSQ });
        details.push({ concept: 'Subtotal', value: costSubtotal });

        const extra = this.general.calculateProfitComissionOverhead(costSubtotal, inspectorCostType);
        details.push({ concept: 'Profit Commision Overhead', value: extra });

        const costWithCommisions = costSubtotal + extra;
        details.push({ concept: 'Total', value: costWithCommisions });

        return { cost: costWithCommisions, details };
    }

    private async getCostPerSq(warranty: Warranty, materialCalculations: any, shingle: any) {
        const price_per_square = this.parseNumber(warranty.price_per_square);
        const labor_category_install = await this.general.getConstValue('labor_category_install');
        const labor_category_overlay = await this.general.getConstValue('labor_category_overlay');

        const totalSq = materialCalculations
            ?.find(x => x.id_material_type_shingle == shingle.id_material_type
                && (x.category == labor_category_install || x.category == labor_category_overlay))?.qty ?? 0;

        return this.parseNumber(totalSq) * price_per_square;
    }

    private parseNumber(value): number {
        if (value && !isNaN(value)) {
            return parseFloat(value);
        }
        return 0;
    }

    private getUpgradeCalculation(total, shingle, upgrade_id, concept_types_upgrade, warrantyDescription) {
        const calculation = JSON.parse(JSON.stringify(CALCULATION_SCHEMA));
        const upgradeNotAvaliableLbl = total == null ? ' (Upgrade not available, not enough materials selected)' : '';
        calculation.calculation_type = 'Costo de Upgrade';
        calculation.category = upgrade_id;
        calculation.concept = warrantyDescription + upgradeNotAvaliableLbl;
        calculation.concept_type = warrantyDescription + upgradeNotAvaliableLbl;
        calculation.id_concept_type = concept_types_upgrade;
        calculation.id_concept = null;
        calculation.cost = null;
        calculation.coverage = null;
        calculation.id_labor_type = null;
        calculation.is_final = true;
        calculation.unit = null;
        calculation.unit_abbrevation = null;
        calculation.value = total ?? 0;
        calculation.id_material_price_list = null;
        calculation.id_price_list = null;
        calculation.id_material_type_shingle = shingle.id_material_type;

        return calculation;
    }
}
