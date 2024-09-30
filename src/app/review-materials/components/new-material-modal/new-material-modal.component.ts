import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { MaterialPriceList } from 'src/app/models/material-price-list.model';
import { PriceList } from 'src/app/models/price-list.model';
import { PopoverOptionsListSearchableComponent } from 'src/app/prospecting/components/popover-options-list-searchable/popover-options-list-searchable.component';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { MaterialService } from 'src/app/services/material.service';

@Component({
  selector: 'app-new-material-modal',
  templateUrl: './new-material-modal.component.html',
  styleUrls: ['./new-material-modal.component.scss'],
})
export class NewMaterialModalComponent implements OnInit {
  ngForm: FormGroup;
  suppliers: any[];
  materials: any[];
  units: any[];
  selectedSupplier: string = '';
  selectedSupplierId: number;
  selectedMaterial: string = '';
  selectedMaterialId: number;
  selectedUnitId: number;
  materialPriceLists: MaterialPriceList[];
  priceLists: PriceList[];


  @Input() supplierId: number;
  @Input() buildings: any[];

  constructor(private popoverController: PopoverController,
    private catalogService: CatalogsService,
    private readonly formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private materialService: MaterialService) {
    this.ngForm = this.formBuilder.group({
      supplierName: [''],
      materialName: [''],
      materialPrice: ['', Validators.required],
      materialUnit: ['']
    });
  }

  ngOnInit() {
    this.loadData();

    for (const building of this.buildings) {
      this.ngForm.addControl(building.id, new FormControl('', Validators.required));
    }
  }

  async loadData() {
    this.suppliers = (await this.catalogService.getSuppliers()).data.map(x => {
      return { ...x, option: x.supplier, selected: false };
    });
    this.suppliers.push({ id: 0, option: 'New Supplier' });

    if (this.supplierId) {
      this.selectedSupplierId = this.supplierId;
      this.selectedSupplier = this.suppliers.find(x => x.id == this.supplierId)?.supplier;
    }

    this.materials = (await this.materialService.materialRepository.findAll()).data.map(x => {
      return { ...x, option: x.material, selected: false }
    });
    this.materials.push({ id: 0, option: 'New Material' });

    this.units = (await this.catalogService.getMaterialUnits()).data.map(x => {
      return { ...x, option: x.abbreviation, selected: false };
    });

    this.materialPriceLists = (await this.materialService.materialPriceListRepository.findAll()).data;
    this.priceLists = (await this.materialService.priceListRepository.findAll()).data;
  }

  async openSupplierOptions(ev) {
    if (this.supplierId) {
      return;
    }

    const modal = await this.popoverController.create({
      component: PopoverOptionsListSearchableComponent,
      cssClass: 'screen-width-400',
      event: ev,
      side: 'bottom',
      componentProps: {
        options: this.suppliers,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      this.selectedSupplier = data.option;
      this.selectedSupplierId = data.id;

      if (this.selectedSupplierId == 0) {
        this.ngForm.get('supplierName').addValidators(Validators.required);
      } else {
        this.ngForm.get('supplierName').removeValidators(Validators.required);
      }
    }
  }

  async openMaterialOptions(ev) {
    const modal = await this.popoverController.create({
      component: PopoverOptionsListSearchableComponent,
      cssClass: 'screen-width-400',
      event: ev,
      side: 'bottom',
      componentProps: {
        options: this.materials,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      this.selectedMaterial = data.option;
      this.selectedMaterialId = data.id;

      const price = this.getSelectedMaterialPrice();

      this.ngForm.get('materialPrice').setValue(price); //TODO: set the material cost
      if (this.selectedMaterialId == 0) {
        this.ngForm.get('materialName').addValidators(Validators.required);
        this.ngForm.get('materialUnit').addValidators(Validators.required);
      } else {
        this.ngForm.get('materialName').removeValidators(Validators.required);
        this.ngForm.get('materialUnit').removeValidators(Validators.required);
      }
    }
  }

  getSelectedMaterialPrice() {
    const priceIds = this.priceLists.filter(x => x.id_supplier == this.selectedSupplierId && x.is_current==true).map(x => '' + x.id);
    const materialPriceList = this.materialPriceLists.find(x => x.id_material == this.selectedMaterialId && priceIds.includes('' + x.id_price_list))
    console.log(materialPriceList);
    return materialPriceList?.cost ?? 0;
  }

  async confirm() {
    const qtys = this.buildings.map(b => {
      return { id: b.id, quantity: this.ngForm.get(b.id).value };
    })

    await this.modalCtrl.dismiss({
      supplierId: this.selectedSupplierId,
      supplierName: this.selectedSupplierId == 0 ? this.ngForm.get('supplierName').value : this.selectedSupplier,
      materialId: this.selectedMaterialId,
      materialName: this.selectedMaterialId == 0 ? this.ngForm.get('materialName').value : this.selectedMaterial,
      price: this.ngForm.get('materialPrice').value,
      unit: this.selectedUnitId,
      buildings: qtys
    });
  }

  allowNumbers(event: any, name = null) {
    const charCode = event.which ? event.which : event.keyCode;
    if (name && charCode == 46) {
      let txt = this.ngForm.get(name).value;
      if (!(txt.indexOf('.') > -1)) {
        return true;
      }
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  async openPopoverUnits(ev: any) {
    const modal = await this.popoverController.create({
      component: PopoverOptionsListSearchableComponent,
      cssClass: 'screen-width-400',
      event: ev,
      side: 'bottom',
      componentProps: {
        options: this.units,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    this.ngForm.get('materialUnit').setValue(data.option);
    this.ngForm.get('materialUnit').markAsDirty();
    this.selectedUnitId = data.id;
  }
}
