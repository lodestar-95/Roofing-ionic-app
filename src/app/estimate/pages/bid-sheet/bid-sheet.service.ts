import { Description } from './../../../models/description.model';
import { MaterialPrice } from './../../../models/material-price.model';
import { Injectable } from '@angular/core';
import { GeneralService } from '../../calculation/materials/general.service';
import { Table, Section, Total } from '../../models/bid-sheet.model';

@Injectable({
    providedIn: 'root',
})
export class BidSheetService {
    public activeTradeMarkId: number;
    public activeCostTypeId: number;
    public activeVersionId: number;
    public activeMaterialTypeId: number;
    public materialPrices = [];
    private decimals = 3;

    constructor(private general: GeneralService) { }

    public async getFormatedTableData(calculations: any, buildingId: any): Promise<Table[]> {
        const tables: Table[] = [];
        const activeBuilding = this.getActiveBuildings(calculations, buildingId);

        const productSections = this.getProductsByMaterialTypeId(activeBuilding, this.activeMaterialTypeId);
        const productTotals = await this.getConceptTotals(activeBuilding);
        tables.push({ columnNames: [], sections: productSections, totals: productTotals });

        const laborSections = this.getLaborSection(activeBuilding, this.activeMaterialTypeId);
        const laborTotals = this.getTotals(laborSections, 'Total labors');
        tables.push({ columnNames: [], sections: laborSections, totals: laborTotals });
        const tearOff = await this.getTearOffSection(activeBuilding, this.activeMaterialTypeId);
        let tearOffQtyTotals = this.getTotals(tearOff, 'Quantity', 'unit');
        tearOffQtyTotals = tearOffQtyTotals.map(x => ({ ...x, value: x.value }));
        const tearOffTotals = this.getTotals(tearOff, 'Total');
        tables.push({
            columnNames: ['', 'RidgeCap', 'Shingle', 'Starter', 'Total', 'Price', ''],
            sections: tearOff, totals: [...tearOffQtyTotals, ...tearOffTotals]
        });

        const install = await this.getInstallSection(activeBuilding, this.activeMaterialTypeId);
        let installQtyTotals = this.getTotals(install, 'Quantity', 'unit');
        installQtyTotals = installQtyTotals.map(x => ({ ...x, value: x.value }));
        const installTotals = this.getTotals(install, 'Total');
        tables.push({
            columnNames: ['', 'RidgeCap', 'Shingle', 'Starter', 'Total', 'Price', ''],
            sections: install, totals: [...installQtyTotals, ...installTotals]
        });

        const inwLabor = await this.getInWLaborSection(activeBuilding, this.activeMaterialTypeId);
        let inwLaborQtyTotals = this.getTotals(inwLabor, 'Quantity', 'unit');
        inwLaborQtyTotals = inwLaborQtyTotals.map(x => ({ ...x, value: x.value }));
        const inwLaborTotals = this.getTotals(inwLabor, 'Total InW');
        tables.push({
            columnNames: ['', '', '', 'Slope', 'Total', 'Price', ''],
            sections: inwLabor, totals: [...inwLaborQtyTotals, ...inwLaborTotals]
        });

        const otherExpensesSections = this.getOtherExpensiesSection(activeBuilding, this.activeMaterialTypeId);
        const otherExpensesTotals = this.getTotals(otherExpensesSections, 'Total expenses');
        tables.push({ columnNames: [], sections: otherExpensesSections, totals: otherExpensesTotals });

        const optionsBuiltIn = await this.getOptionsBuiltinSection(activeBuilding, this.activeMaterialTypeId);
        const optionsBuiltTotals = this.getTotals([optionsBuiltIn], 'Total');
        tables.push({ columnNames: [], sections: [optionsBuiltIn], totals: optionsBuiltTotals });

        const materialLaborTotals = await this.getMaterialLaboralTotals(activeBuilding);
        tables.push({ columnNames: [], sections: [], totals: materialLaborTotals });

        const upgrades = await this.getUpgradeSection(activeBuilding, this.activeMaterialTypeId);
        const upgradesTotals = this.getTotals([upgrades], 'Total upgrades');
        tables.push({ columnNames: [], sections: [upgrades], totals: upgradesTotals });

        const windWarranty = await this.getUpgradeDetails(activeBuilding, this.activeMaterialTypeId,
            'upgrade_wind_warranty', 'Upgrade Wind Warranty');
        const windWarrantyTotals = await this.getUpgradeTotals(activeBuilding, this.activeMaterialTypeId,
            'upgrade_wind_warranty');
        tables.push({ columnNames: [], sections: [windWarranty], totals: windWarrantyTotals });

        const materialWarranty = await this.getUpgradeDetails(activeBuilding, this.activeMaterialTypeId,
            'upgrade_material_warranty', 'Upgrade Material Full System Warranty');
        const materialWarrantyTotals = await this.getUpgradeTotals(activeBuilding, this.activeMaterialTypeId,
            'upgrade_material_warranty');
        tables.push({ columnNames: [], sections: [materialWarranty], totals: materialWarrantyTotals });

        const workmanWarranty = await this.getUpgradeDetails(activeBuilding, this.activeMaterialTypeId,
            'upgrade_workmanship_warranty', 'Upgrade Manufacture Workmanship Warranty');
        const workmanWarrantyTotals = await this.getUpgradeTotals(activeBuilding, this.activeMaterialTypeId,
            'upgrade_workmanship_warranty');
        tables.push({ columnNames: [], sections: [workmanWarranty], totals: workmanWarrantyTotals });

        const wmetal = await this.getUpgradeDetails(activeBuilding, this.activeMaterialTypeId,
            'upgrade_w_metal', 'Upgrade WMetal');
        const wmetalTotals = await this.getUpgradeTotals(activeBuilding, this.activeMaterialTypeId,
            'upgrade_w_metal');
        tables.push({ columnNames: [], sections: [wmetal], totals: wmetalTotals });

        const ridge = await this.getUpgradeDetails(activeBuilding, this.activeMaterialTypeId,
            'upgrade_ridgevents', 'Upgrade Ridge Vent');
        const ridgeTotals = await this.getUpgradeTotals(activeBuilding, this.activeMaterialTypeId,
            'upgrade_ridgevents');
        tables.push({ columnNames: [], sections: [ridge], totals: ridgeTotals });

        const ridgecap = await this.getUpgradeDetails(activeBuilding, this.activeMaterialTypeId,
            'upgrade_ridgecap', 'Upgrade Ridge Cap');
        const ridgecapTotals = await this.getUpgradeTotals(activeBuilding, this.activeMaterialTypeId,
            'upgrade_ridgecap');
        tables.push({ columnNames: [], sections: [ridgecap], totals: ridgecapTotals });

        const optionsOptionals = await this.getOptionsOptionalsSection(activeBuilding, this.activeMaterialTypeId);
        const optionalsTotals = this.getTotals([optionsOptionals], 'Total');
        tables.push({ columnNames: [], sections: [optionsOptionals], totals: optionalsTotals });

        return tables;
    }

    private getActiveBuildings(bidSheetData: any, buildingId: any) {
        return bidSheetData.buildings.find(x => x.id_building === buildingId);
    }

    private getProductsByMaterialTypeId(activeBuildings: any, materialTypeId: number): Section[] {
        const tableSection: Section[] = [];
        if(!activeBuildings.calculations){
          return tableSection;
        }
        for (const key of Object.keys(activeBuildings.calculations)) {
            activeBuildings.calculations[key] = activeBuildings.calculations[key].map(material => {
                let bidsheet_order = this.materialPrices.find(x => x.id_material_type == material.id_material_type)?.bidsheet_order ?? 0;
                if(!material.concept){
                  material.concept = 'ERROR';
                  material.coverage_description = 'MATERIAL NOT PROPERLY CONFIGURED, CHECK IT WITH APP ADMIN';
                }
                return { ...material, bidsheet_order };
            });

            const products = activeBuildings.calculations[key]
                .filter(x => x.id_concept_type == 1)
                .filter(x => x.id_material_type_shingle == materialTypeId)
                .sort((a, b) => a.bidsheet_order - b.bidsheet_order)
                .map(product => ({
                    description: product.concept,
                    sqlf: this.general.truncateDecimals((product.sqlf ?? 0), 2),
                    coverage: product.coverage ?? 0,
                    coverage_description: (product.coverage_description == '/' ? '' : product.coverage_description),
                    quantity: product.qty,
                    unit: product.unit,
                    price: product.cost,
                    total: product.value
                }));

            if (products && products.length > 0) {
                tableSection.push({ title: key, concepts: products });
            }
        }
        return tableSection;
    }

    private getTotals(sections: Section[], description = 'Total', property = 'total'): Total[] {
        let total = 0;
        if (sections.length == 0) {
            return [];
        }
        sections.forEach(section => {
            total += section.concepts.reduce((partialSum, value) => (+partialSum) + (+(value[property] ?? 0)), 0);
        });
        return [{ description, value: total }];
    }

    private async getConceptTotals(building: any): Promise<Total[]> {
        const total = building.totals.find(total =>
            total.id_cost_type == this.activeCostTypeId
            && total.id_version == this.activeVersionId
            && total.id_material_type_shingle == this.activeMaterialTypeId);

        if (total) {
            const taxPercentage = await this.general.getConstDecimalValue('tax_percentage');
            return [
                { description: 'Subtotal', value: total.material_total / (100 + taxPercentage) * 100 },
                { description: 'Tax 6%', value: total.material_total / (100 + taxPercentage) * taxPercentage },
                { description: 'Total', value: total.material_total }
            ];
        }
    }

    private async getMaterialLaboralTotals(building: any): Promise<Total[]> {
        const total = building.totals.find(total =>
            total.id_cost_type == this.activeCostTypeId
            && total.id_version == this.activeVersionId
            && total.id_material_type_shingle == this.activeMaterialTypeId);

        const labor_category_install = await this.general.getConstValue('labor_category_install');
        const labor_category_overlay = await this.general.getConstValue('labor_category_overlay');

        const totalSq = building?.labors
            ?.find(x => x.id_material_type_shingle == this.activeMaterialTypeId
                && (x.category == labor_category_install
                    || x.category == labor_category_overlay))?.cost ?? 0;

        if (total) {
            return [
                { description: 'Total material including tax', value: total.material_total },
                { description: 'Total labor', value: total.labor_total },
                { description: 'Labor burdon', value: total.labor_burdon },
                { description: 'Total other expenses', value: total.other_expenses },
                { description: 'Total options built in', value: total.options },
                { description: 'Subtotal', value: total.subtotal },
                { description: 'Total profit', value: total.profit },
                { description: 'Total comission', value: total.commission },
                { description: 'Total overhead', value: total.overhead },
                { description: 'Grand Total', value: total.total },
                { description: 'Total per SQ', value: totalSq },
            ];
        }
    }

    private getLaborSection(activeBuildings: any, materialTypeId): Section[] {
        const tableSection: Section[] = [];

        const labors = activeBuildings.labors
            .filter(x => x.id_material_type_shingle == materialTypeId)
            .map(labor => ({
                description: labor.concept,
                quantity: this.general.truncateDecimals(labor.qty, this.decimals),
                price: labor.cost,
                total: labor.value
            }));

        if (labors && labors.length > 0) {
            tableSection.push({ title: 'Labor description', concepts: labors });
        }
        return tableSection;
    }

    private async getUpgradeSection(activeBuildings: any, materialTypeId): Promise<Section> {
        const upgrades = activeBuildings.upgradecalculations
            .filter(x => {
                return x.id_material_type_shingle == materialTypeId
            })
            .map(product => ({
                description: product.concept,
                sqlf: '',
                coverage: '',
                quantity: '',
                unit: '',
                price: '',
                total: product.value
            }));

        return { title: 'Upgrades', concepts: upgrades };
    }

    private async getUpgradeDetails(activeBuildings: any, materialTypeId, upgradeCategory, sectionName): Promise<Section> {
        const upgrade_category_id = await this.general.getConstValue(upgradeCategory);
        const upgrade = activeBuildings.upgradecalculations
            .find(x => x.id_material_type_shingle == materialTypeId && x.category == upgrade_category_id);

        const upgrades = upgrade?.details
            ?.filter(x => x != undefined && x.cost != undefined)
            ?.map(product => ({
                description: product.concept ? product.concept : product.calculation_type,
                sqlf: this.general.truncateDecimals((product.sqlf ?? 0), 2),
                coverage: product.coverage ?? 0,
                quantity: product.qty,
                unit: product.unit,
                price: product.cost,
                total: product.value
            })) ?? [];

        return { title: sectionName, concepts: upgrades };
    }

    private async getUpgradeTotals(activeBuildings: any, materialTypeId, upgrade_category): Promise<Total[]> {
        const upgrade_category_id = await this.general.getConstValue(upgrade_category);
        const upgrade = activeBuildings.upgradecalculations
            .find(x => x.id_material_type_shingle == materialTypeId && x.category == upgrade_category_id);

        return upgrade?.details
            ?.filter(x => x != undefined && x.cost == undefined)
            ?.map(product => ({
                description: product.concept ? product.concept : product.calculation_type,
                value: product.value
            })) ?? [];
    }

    private async getOptionsBuiltinSection(activeBuildings: any, materialTypeId): Promise<Section> {
        const options = activeBuildings.options
            .filter(x => {
                return x.is_built_in == true
            })
            .map(product => ({
                description: product.option,
                sqlf: 0,
                coverage: 0,
                quantity: product.qty_hours,
                unit: 'hours',
                price: product.cost,
                total: product.total
            }));

        return { title: 'Options - Built In', concepts: options };
    }

    private async getOptionsOptionalsSection(activeBuildings: any, materialTypeId): Promise<Section> {
        const options = activeBuildings.options
            .filter(x => {
                return x.is_built_in == false
            })
            .map(product => ({
                description: product.option,
                sqlf: 0,
                coverage: 0,
                quantity: product.qty_hours,
                unit: 'hours',
                price: product.cost,
                total: product.total
            }));

        return { title: 'Options - Optionals', concepts: options };
    }

    private async getTearOffSection(activeBuildings: any, materialTypeId): Promise<Section[]> {
        const tableSection: Section[] = [];
        const tearOff = await this.general.getConstDecimalValue('labor_category_tear_off');
        const labors = activeBuildings.labors
            .filter(x => x.id_material_type_shingle == materialTypeId && x.category == tearOff)
            .flatMap(x => x.laborLayer)
            .filter(x => x != undefined)
            .map(x => ({
                description: `Floor ${x.floor} - Pitch ${x.slope.pitch} - ${x.labor_type}`,
                sqlf: this.general.truncateDecimals(x.ridgecap_area, this.decimals),
                coverage: this.general.truncateDecimals(x.shingle_area, this.decimals),
                quantity: this.general.truncateDecimals(x.starter_area, this.decimals),
                unit: this.general.truncateDecimals(x.qty, this.decimals).toString(),
                price: x.price,
                total: x.value
            }));
        if (labors && labors.length > 0) {
            tableSection.push({
                title: 'Tear Off', concepts: labors
            });
        }

        return tableSection;
    }

    private async getInstallSection(activeBuildings: any, materialTypeId): Promise<Section[]> {
        const tableSection: Section[] = [];
        const install = await this.general.getConstDecimalValue('labor_category_install');
        const labors = activeBuildings.labors
            .filter(x => x.id_material_type_shingle == materialTypeId && x.category == install)
            .flatMap(x => x.laborLayer)
            .map(x => ({
                description: `Floor ${x.floor} - Pitch ${x.slope.pitch} - ${x.labor_type}`,
                sqlf: this.general.truncateDecimals(x.ridgecap_area, this.decimals),
                coverage: this.general.truncateDecimals(x.shingle_area, this.decimals).toString(),
                quantity: this.general.truncateDecimals(x.starter_area, this.decimals),
                unit: this.general.truncateDecimals(x.qty, this.decimals).toString(),
                price: x.price,
                total: x.value
            }));

        if (labors && labors.length > 0) {
            tableSection.push({
                title: 'Install', concepts: labors
            });
        }

        return tableSection;
    }


    private async getInWLaborSection(activeBuildings: any, materialTypeId): Promise<Section[]> {
        const tableSection: Section[] = [];
        const inwLaborId = await this.general.getConstDecimalValue('labor_category_inwshield');
        const labors = activeBuildings.labors
            .filter(x => x.id_material_type_shingle == materialTypeId && x.category == inwLaborId)
            .flatMap(x => x.laborLayer)
            .map(x => ({
                description: `Floor ${x.floor} - Pitch ${x.slope.pitch}`,
                sqlf: '',
                coverage: '',
                coverage_description:'',
                quantity: this.general.truncateDecimals(x.slope.shingle_area, this.decimals),
                unit: this.general.truncateDecimals(x.qty, this.decimals).toString(),
                price: x.price,
                total: x.value
            }));


        if (labors && labors.length > 0) {
            tableSection.push({
                title: 'InW Labor', concepts: labors
            });
        }

        return tableSection;
    }

    private getOtherExpensiesSection(activeBuildings: any, materialTypeId: number) {
        let concepts = [];
        for (const key of Object.keys(activeBuildings.calculations)) {
            concepts = [...concepts, ...activeBuildings.calculations[key]
                .filter(x => x.id_concept_type == 2)
                .filter(x => x.id_material_type_shingle == materialTypeId)
                .map(product => ({
                    description: product.concept,
                    coverage: product.coverage,
                    quantity: product.qty,
                    unit: product.unit,
                    price: product.cost,
                    total: product.value
                }))];
        }

        return [{ title: 'Description other expenses', concepts }];
    }
}
