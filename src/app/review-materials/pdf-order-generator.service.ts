import { Injectable } from "@angular/core";

declare var require: any;

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { Project } from "../models/project.model";
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
(window as any).pdfWorkerSrc = '../../assets/js/pdf.worker.min.js';
import * as moment from 'moment';
import { MaterialService } from "../services/material.service";
import { Building } from "../models/building.model";
import { GeneralService } from "../estimate/calculation/materials/general.service";
import { CatalogsService } from "../services/catalogs.service";
import { Platform } from "@ionic/angular";
import { File } from '@awesome-cordova-plugins/file/ngx';

@Injectable({
    providedIn: 'root'
})
export class PdfOrderGeneratorService {

    constructor(private materialService: MaterialService,
        private generalService: GeneralService,
        private catalogService: CatalogsService,
        private file: File,
        private platform: Platform) {

    }

    async generatePdfUrls(project, supplierId): Promise<any> {
        return new Promise(async resolve => {
            const pdf = await this.generatePdf(project, supplierId);

            if (this.platform.is('cordova')) {
                pdf.getBuffer(buffer => {
                    let blob = new Blob([buffer], { type: 'application/pdf' });
                    let path;

                    if (this.platform.is('ios')) {
                        path = this.file.documentsDirectory;
                    } else if (this.platform.is('android')) {
                        path = this.file.externalDataDirectory;
                    }

                    const pdfName = `PurchaseOrder_${project.id}_${supplierId}.pdf`;
                    this.file.writeFile(path, pdfName, blob, { replace: true })
                        .then(entry => {
                            const emailPath = `${path}${pdfName}`;
                            const win: any = window;
                            const viewerUrl = win.Ionic.WebView.convertFileSrc(emailPath);

                            resolve({ emailPath, viewerUrl });
                        });
                });
            } else {
                pdf.open();
                resolve({ emailPath: '', viewerUrl: '' });
            }
        })
    }

    async generatePdf(project: Project, supplierId: number) {
        const data = await this.getPdfData(project, supplierId);
        const documentDefinition = this.getPdfDefinition(data);
        return pdfMake.createPdf(documentDefinition);
    }

    async getPdfData(project: Project, supplierId: number) {
        const roofingAddress = await this.generalService.getConstValue('roofing_address');
        const supplier = (await this.materialService.supplierRepository.findOne(supplierId)).data;
        const { materials, total } = await this.getPurchaseMaterialList(project, supplierId);

        return {
            roofingAddress: `E&H Roofing\n\n${roofingAddress.replace(',', '\n')}`,
            date: moment.utc().format('DD/MM/YY'),
            poNo: project.versions.find(x => x.is_current_version).id,
            clientAddress: `${project.st_name}\n${project.st_address?.replace(',', '\n')}`,
            supplierAddress: `${supplier.supplier}\n${supplier.address?.replace(',', '\n')}`,
            materials,
            total
        };
    }

    async getPurchaseMaterialList(project: Project, supplierId: number) {
        let allMaterials = [];
        let total = 0;
        let USDollar = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });

        for (const building of project.versions.find(x => x.is_current_version).buildings) {
            const materials = (await this.getBuildingMaterialList(building, supplierId)).map(x => {
                const amount = this.generalService.parseNumber(x.quantity) * this.generalService.parseNumber(x.cost);
                total += amount;
                return {
                    id_concept: x.id_concept,
                    name: x.description.length > 12 ? `${x.description.slice(0, 11)}...` : x.description,
                    description: x.description,
                    qty: this.generalService.parseNumber(x.quantity),
                    unit: x.unit,
                    cost: x.cost,
                    rate: USDollar.format(x.cost),
                    amount: USDollar.format(amount)
                }
            });

            if (materials && materials.length > 0)
                allMaterials = [...allMaterials, ...materials];
        }

        let uniqueMaterials = [];
        for (const material of allMaterials) {
            const auxMaterial = uniqueMaterials.find(x => x.id_concept == material.id_concept);
            if (auxMaterial) {
                auxMaterial.qty += this.generalService.parseNumber(material.qty);
                const amount = this.generalService.parseNumber(auxMaterial.qty) * this.generalService.parseNumber(auxMaterial.cost);
                auxMaterial.amount = USDollar.format(amount);
            } else {
                uniqueMaterials.push(material);
            }
        }

        const materials = uniqueMaterials.map(x => [
            { text: x.name, fontSize: 10 },
            { text: x.description, fontSize: 10 },
            { text: x.qty, alignment: 'right', fontSize: 10 },
            { text: x.unit, fontSize: 10 },
            { text: x.rate, alignment: 'right', fontSize: 10 },
            { text: x.amount, alignment: 'right', fontSize: 10 }
        ]);

        return { materials, total: USDollar.format(total) }
    }

    async getBuildingMaterialList(building: Building, supplierId: number) {

        const materials = (await this.materialService.materialRepository.findAll()).data;
        const materialPriceLists = (await this.materialService.materialPriceListRepository.findAll()).data;
        const priceLists = (await this.materialService.priceListRepository.findAll()).data;
        const units = (await this.catalogService.getMaterialUnits()).data;

        const priceSupplierIds = supplierId == 0
            ? priceLists.filter(x => isNaN(x.id_supplier)).map(x => '' + x.id) //TODO: Check the acceptance date 
            : priceLists.filter(x => x.id_supplier == supplierId).map(x => '' + x.id); //TODO: Check the acceptance date
        const materialPriceListIds = materialPriceLists.filter(x => priceSupplierIds.includes('' + x.id_price_list)).map(x => '' + x.id);


        if (building
            && building.psb_measure
            && building.psb_measure.psb_material_calculations
            && building.psb_measure.psb_material_calculations.length > 0) {
            const id_material_shingle = building.psb_measure.psb_material_calculations[0].id_material_shingle; //TODO: remove line

            return building.psb_measure.psb_material_calculations
                .filter(x => '' + x.id_material_shingle == '' + id_material_shingle)
                .filter(x => materialPriceListIds.includes('' + x.id_material_price_list) && !x.deletedAt)
                .map(x => {
                    const material = materials.find(y => y.id == x.id_concept);
                    const description = material?.material ?? '';
                    const unit = units.find(y => y.id == (material?.id_unit_buy ?? 0))?.abbreviation;
                    return { ...x, cost: x.cost, total: (x.cost * x.quantity), description, unit }
                });
        }

        return [];
    }

    private getPdfDefinition(data: any) {
        return {
            pageMargins: [40, 40, 40, 40],
            content: [{
                columnGap: 200,
                columns: [{
                    text: {
                        text: data.roofingAddress
                    }
                },
                [{
                    text: {
                        text: 'Purchase Order',
                        style: 'title'
                    }
                }, {
                    style: ['marginTable', 'textCenter'],
                    table: {
                        widths: [72, 72],
                        heights: [25, 25],
                        body: [
                            [{ text: 'Date', style: 'hCenter' }, { text: 'P.O. No.', style: 'hCenter' }],
                            [{ text: data.date, style: 'hCenter' }, { text: data.poNo, style: 'hCenter' }]
                        ]
                    }
                }
                ]
                ]
            }, {
                columns: [{
                    style: 'marginTable',
                    table: {
                        widths: [225],
                        heights: [25, 100],
                        body: [
                            [{ text: 'Vendor', margin: [10, 5] }],
                            [data.supplierAddress]
                        ]
                    }
                }, {
                    style: 'marginTable',
                    table: {
                        widths: [225],
                        heights: [25, 100],
                        body: [
                            [{ text: 'Ship To', margin: [10, 5] }],
                            [data.clientAddress]
                        ]
                    }
                },
                ],
                columnGap: 50
            }, {
                margin: [0, 25, 0, 0],
                table: {
                    headerRows: 1,
                    widths: [70, '*', 55, 67, 55, 63],
                    heights: [25],
                    body: [
                        [{ text: 'Item', style: ['textCenter', 'hCenter'] }, { text: 'Description', style: ['textCenter', 'hCenter'] }, { text: 'Qty', style: ['textCenter', 'hCenter'] }, { text: 'U/M T/D', style: ['textCenter', 'hCenter'] }, { text: 'Rate', style: ['textCenter', 'hCenter'] }, { text: 'Amount', style: ['textCenter', 'hCenter'] }],
                        ...data.materials
                    ]
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0;
                    }
                }
            }, {
                table: {
                    widths: ['*', 150, 90],
                    heights: [30],
                    body: [
                        ['', { text: 'Total', style: 'total' }, { text: data.total, alignment: 'right', margin: [0, 9, 5, 0] }]
                    ]
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === node.table.body.length) ? 1 : 0;
                    },
                    vLineWidth: function (i, node) {
                        return (i === 0 || i === 1 || i === node.table.widths.length) ? 1 : 0;
                    }
                }
            }
            ],
            styles: {
                title: {
                    fontSize: 22,
                    bold: true,
                    alignment: 'right'
                },
                textCenter: {
                    alignment: 'center'
                },
                marginTable: {
                    margin: [0, 5, 0, 10]
                },
                total: {
                    fontSize: 17,
                    bold: true,
                    alignment: 'left',
                    margin: [8, 3, 0, 3]
                },
                hCenter: {
                    margin: [10, 5]
                }
            }
        }
    };
}