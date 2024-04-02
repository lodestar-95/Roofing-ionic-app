import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, ModalController, NavController } from '@ionic/angular';
import { Version } from 'src/app/models/version.model';
import { NewMaterialModalComponent } from '../new-material-modal/new-material-modal.component';
import { PreviewOrderComponent } from '../preview-order/preview-order.component';
import { MaterialService } from 'src/app/services/material.service';
import { PurchaseOrderService } from 'src/app/services/purchase-order.service';
import { Router } from '@angular/router';
import { PdfOrderGeneratorService } from '../../pdf-order-generator.service';
import { Project } from 'src/app/models/project.model';

@Component({
  selector: 'app-accordion-detail',
  templateUrl: './accordion-detail.component.html',
  styleUrls: ['./accordion-detail.component.scss'],
})
export class AccordionDetailComponent implements OnInit {
  @Input() supplierId: number;
  @Input() projectVersion: Version;
  @Input() project: Project;
  hasBuildings = true;

  constructor(private modalController: ModalController,
    private materialService: MaterialService,
    private purchaseOrder: PurchaseOrderService,
    private nav: NavController,
    private pdfOrderService: PdfOrderGeneratorService,
    private loadingCtrl: LoadingController) { }

  ngOnInit() {
    this.hasBuildings = this.projectVersion && this.projectVersion.buildings && this.projectVersion.buildings.length > 0;
  }

  preview() {
    this.nav.navigateForward(`/home/review-materials/preview/${this.supplierId}`);
  }

  async sendEmail() {
    const loading = await this.showLoading();
    try {
      const { emailPath, viewerUrl } = await this.pdfOrderService.generatePdfUrls(this.project, this.supplierId);
      await this.purchaseOrder.sendPurchaseOrder(this.supplierId, [emailPath]);
    } catch (error) {
      console.error(error);
    } finally {
      loading.dismiss();
    }
  }

  private async showLoading() {
    const loading = await this.loadingCtrl.create({ spinner: 'circles' });
    loading.present();
    return loading;
  }

  async addMaterial() {
    const modal = await this.modalController.create({
      component: NewMaterialModalComponent,
      componentProps: {
        supplierId: this.supplierId,
        buildings: this.projectVersion.buildings
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    console.log(data);

    if (data) {
      if (data.supplierId == 0) {
        const supplier = await this.materialService.addSupplier(data.supplierName, '');
        data.supplierId = supplier.id;
      }

      if (data.materialId == 0) {
        await this.materialService.registerNewMaterial(
          data.supplierId,
          data.materialName,
          data.price,
          data.unit,
          data.buildings
        );
      } else {
        await this.materialService.addExtraMaterial(
          data.supplierId,
          data.materialId,
          data.price,
          data.buildings
        );
      }
    }
  }
}
