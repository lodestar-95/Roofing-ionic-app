import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { MaterialPriceList } from 'src/app/models/material-price-list.model';
import { MaterialPrice } from 'src/app/models/material-price.model';
import { PriceList } from 'src/app/models/price-list.model';
import { PopoverOptionsListSearchableComponent } from 'src/app/prospecting/components/popover-options-list-searchable/popover-options-list-searchable.component';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { MaterialService } from 'src/app/services/material.service';

@Component({
  selector: 'app-move-material-modal',
  templateUrl: './move-material-modal.component.html',
  styleUrls: ['./move-material-modal.component.scss'],

})
export class MoveMaterialModalComponent implements OnInit {
  ngForm: FormGroup;
  selectedSupplier: string = '';
  selectedSupplierId: number;
  suppliers: any[];
  materials: MaterialPrice[];
  materialPriceLists: MaterialPriceList[];
  priceLists: PriceList[];

  @Input() material: any;
  @Input() supplierId: number;

  constructor(private readonly formBuilder: FormBuilder,
    private catalogService: CatalogsService,
    private popoverController: PopoverController,
    private modalCtrl: ModalController,
    private materialService: MaterialService) {
    this.ngForm = this.formBuilder.group({
      name: [''],
      price: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
    console.log('Material', this.material);
  }

  async loadData() {
    await this.loadSuppliers();
    this.initData();
    await this.loadLists();
  }

  initData() {
    this.selectedSupplierId = this.supplierId;
    this.selectedSupplier = this.suppliers.find(x => x.id == this.supplierId).supplier;
    this.ngForm.get('price').setValue(this.material.cost);
  }

  private async loadSuppliers() {
    this.suppliers = (await this.catalogService.getSuppliers()).data.map(x => {
      return { ...x, option: x.supplier, selected: false };
    });
    this.suppliers.push({ id: 0, option: 'New Supplier' });
  }

  async loadLists() {
    const acceptanceDate = new Date();
    // const acceptanceDate = activeVersion.expected_acceptance_date
    //   ? new Date(activeVersion.expected_acceptance_date)
    //   : new Date();

    this.materialPriceLists = (await this.materialService.materialPriceListRepository.findAll()).data;
    this.priceLists = (await this.materialService.priceListRepository.findAll()).data;
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

  async openSupplierOptions(ev) {
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
      this.onSupplierChanged();
    }
  }

  onSupplierChanged() {
    if (this.selectedSupplierId == 0) {
      this.ngForm.get('name').addValidators(Validators.required);
    } else {
      this.ngForm.get('name').removeValidators(Validators.required);
    }

    const priceIds = this.priceLists.filter(x => x.id_supplier == this.selectedSupplierId).map(x => '' + x.id); //TODO: check the current list
    const materialPriceList = this.materialPriceLists.find(x => x.id_material == this.material.id_concept && priceIds.includes('' + x.id_price_list))
    console.log(materialPriceList);

    if (materialPriceList)
      this.ngForm.get('price').setValue(materialPriceList.cost);
  }

  async confirm() {
    await this.modalCtrl.dismiss({
      supplierId: this.selectedSupplierId,
      supplierName: this.selectedSupplierId == 0 ? this.ngForm.get('name').value : this.selectedSupplier,
      price: this.ngForm.get('price').value
    });
  }
}
