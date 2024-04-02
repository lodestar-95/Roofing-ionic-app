import { Injectable } from "@angular/core";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
(window as any).pdfWorkerSrc = '../../assets/js/pdf.worker.min.js';
import { Platform } from "@ionic/angular";
import { File } from '@awesome-cordova-plugins/file/ngx';
import moment from "moment";

@Injectable({
    providedIn: 'root'
})
export class BugsReportPdfGeneratorService {
    constructor(
        private file: File,
        private platform: Platform
    ) { }

    async generatePdfUrls(bugsReportData: any): Promise<any> {
        return new Promise(async resolve => {
            const pdf = await this.generatePdf(bugsReportData);

            if (this.platform.is('cordova')) {
                pdf.getBuffer(buffer => {
                    let blob = new Blob([buffer], { type: 'application/pdf' });
                    let path;

                    if (this.platform.is('ios')) {
                        path = this.file.documentsDirectory;
                    } else if (this.platform.is('android')) {
                        path = this.file.externalDataDirectory;
                    }

                    const pdfName = `BugsReport_${bugsReportData.id}.pdf`;
                    this.file.writeFile(path, pdfName, blob, { replace: true })
                        .then(() => {
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

    async generatePdf(bugsReportData: any) {
        const pdfContent = BugsReportPdfGeneratorService.mapBugsReportDataToPdfContent(bugsReportData)
        const documentDefinition = BugsReportPdfGeneratorService.getPdfDefinition(pdfContent);
        return pdfMake.createPdf(documentDefinition);
    }

    private static mapBugsReportDataToPdfContent(bugsReportData: any) {
        let user = 'N/A'
        if (bugsReportData.localDBCopy){
        const localDBCopy = JSON.parse(bugsReportData.localDBCopy)
        user = localDBCopy.user[0].username
        }
        const pdfContent: any = [
            { text: 'Bugs Report', style: 'title' },
            {
                text: [
                    { text: 'Bugs Report ID: ', style: 'bold' },
                    { text: bugsReportData.id }
                ],
                style: 'marginBottomBetweenParagraphs'
            },
            {
                text: [
                    { text: 'Bugs Report Date: ', style: 'bold' },
                    { text: moment(bugsReportData.createdAt).format('MM/DD/YYYY') }
                ],
                style: 'marginBottomBetweenParagraphs'
            },
            {
                text: [
                    { text: 'Proposal: ', style: 'bold' },
                    { text: bugsReportData.proposal }
                ],
                style: 'marginBottomBetweenParagraphs'
            },
            {
                text: [
                    { text: 'Action: ', style: 'bold' },
                    { text: bugsReportData.action }
                ],
                style: 'marginBottomBetweenParagraphs'
            },
            {
                text: [
                    { text: 'Description: ', style: 'bold' },
                    { text: bugsReportData.description }
                ],
                style: 'marginBottomBetweenParagraphs'
            },
            {
                text: [
                    { text: 'LocalStorage Copy: ', style: 'bold' },
                    { text: bugsReportData.localStorageCopy }
                ],
                style: 'marginBottomBetweenParagraphs'
            },
            {
                text: [
                    { text: 'User: ', style: 'bold' },
                    { text: user }
                ],
                style: 'marginBottomBetweenParagraphs'
            },
            { text: 'Screenshot: ', style: ['bold', 'marginBottomBetweenParagraphs'] },
        ]

        if (bugsReportData.caption) {
            pdfContent.push({
                image: bugsReportData.caption
            })
        } else {
            pdfContent.push({
                text: 'No screenshot available'
            })
        }

        return pdfContent
    }

    private static getPdfDefinition(data: any) {
        return {
            pageMargins: [40, 40, 40, 40],
            content: data,
            styles: {
                title: {
                    fontSize: 22,
                    bold: true,
                    margin: [0, 0, 0, 20]
                },
                bold: {
                    bold: true
                },
                marginBottomBetweenParagraphs: {
                    margin: [0, 0, 0, 10]
                }
            }
        }
    };
}