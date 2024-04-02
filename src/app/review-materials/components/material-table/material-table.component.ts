import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Building } from 'src/app/models/building.model';
import { MoveMaterialModalComponent } from '../move-material-modal/move-material-modal.component';
import { PsbMaterialCalculation } from 'src/app/models/psb-material-calculation.model';
import { MaterialService } from 'src/app/services/material.service';
import { Material } from 'src/app/models/material.model';

@Component({
  selector: 'app-material-table',
  templateUrl: './material-table.component.html',
  styleUrls: ['./material-table.component.scss'],
})
export class MaterialTableComponent implements OnInit {
  private _building: Building;
  calculations: any[] = [];
  materials: Material[];

  @Input() supplierId: number;
  @Input()
  public get building(): Building {
    return this._building;
  }
  public set building(value: Building) {
    this._building = value;
    this.setCalculations();
  }
  id_material_shingle: number;

  constructor(private modalCtl: ModalController,
    private materialService: MaterialService,
    private alertController: AlertController) { }

  ngOnInit() { }

  async setCalculations() {

    if (!this.materials)
      this.materials = (await this.materialService.materialRepository.findAll()).data;

    const materialPriceLists = (await this.materialService.materialPriceListRepository.findAll()).data;
    const priceLists = (await this.materialService.priceListRepository.findAll()).data;

    const priceSupplierIds = this.supplierId == 0
      ? priceLists.filter(x => isNaN(x.id_supplier)).map(x => '' + x.id) //TODO: Check the acceptance date 
      : priceLists.filter(x => x.id_supplier == this.supplierId).map(x => '' + x.id); //TODO: Check the acceptance date
    const materialPriceListIds = materialPriceLists.filter(x => priceSupplierIds.includes('' + x.id_price_list)).map(x => '' + x.id);


    if (this.building
      && this.building.psb_measure
      && this.building.psb_measure.psb_material_calculations
      && this.building.psb_measure.psb_material_calculations.length > 0) {
      this.id_material_shingle = this.id_material_shingle ?? this.building.psb_measure.psb_material_calculations[0].id_material_shingle; //TODO: remove line
      this.calculations = this.building.psb_measure.psb_material_calculations
        .filter(x => '' + x.id_material_shingle == '' + this.id_material_shingle)
        .filter(x => materialPriceListIds.includes('' + x.id_material_price_list) && !x.deletedAt)
        .map(x => {
          const description = this.materials.find(y => y.id == x.id_concept)?.material ?? '';
          return { ...x, cost: x.cost, total: (x.cost * x.quantity), description }
        });

      this.materialService.id_material_shingle = this.id_material_shingle;
    }
  }

  async openMoveModal(calculation: PsbMaterialCalculation) {
    const modal = await this.modalCtl.create({
      component: MoveMaterialModalComponent,
      componentProps: {
        material: calculation,
        supplierId: this.supplierId
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      if (data.supplierId == 0) {
        this.materialService.moveMaterialNewSupplier(calculation, data.price, data.supplierName, '');
      } else {
        this.materialService.moveMaterial(calculation, data.supplierId, data.price);
      }
    }
  }

  async deleteMaterial(calculation: PsbMaterialCalculation) {
    if (await this.confirmDelete()) {
      calculation = { ...calculation, deletedAt: new Date(), isModified: true, is_updated: true };
      this.materialService.saveMaterialCalculation(this.building, calculation)
    }
  }

  async confirmDelete() {
    const alert = await this.alertController.create({
      message: `Are you sure to delete the material?`,
      buttons: [
        {
          text: 'Yes',
          role: 'confirm',
        },
        {
          text: 'No',
          role: 'cancel',
        },
      ],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    return role == 'confirm';
  }

}
