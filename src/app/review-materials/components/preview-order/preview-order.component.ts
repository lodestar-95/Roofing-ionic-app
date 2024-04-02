import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { PdfOrderGeneratorService } from '../../pdf-order-generator.service';


@Component({
    selector: 'app-preview-order',
    templateUrl: './preview-order.component.html',
    styleUrls: ['./preview-order.component.scss'],
})
export class PreviewOrderComponent implements OnInit {
    supplierId: number = 0;
    pdfSrc: any;
    loading: any;

    idProject: number;
    project: Project;
    projectSub: Subscription;

    constructor(private route: ActivatedRoute,
        private loadingCtrl: LoadingController,
        private pdfOrderService: PdfOrderGeneratorService,
        private platform: Platform,
        private projectService: ProjectsService) {
        this.supplierId = parseInt(this.route.snapshot.paramMap.get('supplierId'));
        this.idProject = parseInt(localStorage.getItem('idProject'));
    }

    private showLoading() {
        this.loadingCtrl.create({ spinner: 'circles' })
            .then(res => {
                this.loading = res;
                if (this.platform.is('cordova')) {
                    this.loading.present();
                }
            });
    }

    ngOnInit() {
        this.loadPreview();
    }

    loadPreview() {
        this.showLoading();
        this.getProject();
    }

    getProject() {
        this.projectService.get(this.idProject).then(
            result => {
                result.data.versions.map(x => { x.active = x.is_current_version });
                this.project = result.data;
                this.generatePdf();
            },
            error => {
                console.log(error);
            }
        );
    }

    async generatePdf() {
        try {
            const { emailPath, viewerUrl } = await this.pdfOrderService.generatePdfUrls(this.project, this.supplierId);
            this.pdfSrc = viewerUrl;
        } catch (error) {
            console.error(error);
        } finally {
            this.loading.dismiss();
        }
    }

    close() {
        window.history.back();
    }
}
