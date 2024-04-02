
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonAccordionGroup, IonRouterOutlet, ModalController, NavController, ToastController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { Suppiler } from 'src/app/models/supplier.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { Version } from '../models/version.model';
import * as prospectingActions from '../prospecting/prospecting.actions';
import { MaterialService } from '../services/material.service';
import { ModalNotesComponent } from '../shared/modals/modal-notes/modal-notes.component';
import { NewMaterialModalComponent } from './components/new-material-modal/new-material-modal.component';

@Component({
  selector: 'app-review-materials',
  templateUrl: './review-materials.component.html',
  styleUrls: ['./review-materials.component.scss'],
})
export class ReviewMaterialsComponent implements OnInit, OnDestroy {
  idProject: number;
  project: Project;
  suppliers: Suppiler[];
  building: Building;
  showBuilding: boolean = true;
  version: Version;
  materialCount: any = {};
  id_material_shingle: number;
  expandedAccordion: any;
  projectSub: Subscription;

  @ViewChild('accordionGroup', { static: true }) accordionGroup: IonAccordionGroup;

  constructor(
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private modalController: ModalController,
    private nav: NavController,
    private route: ActivatedRoute,
    private catalogs: CatalogsService,
    private routerOutlet: IonRouterOutlet,
    private materialService: MaterialService,
    private toastController: ToastController) {
    this.idProject = parseInt(this.route.snapshot.paramMap.get('id'));
    localStorage.setItem('idProject', this.idProject + '');

    this.projectSub = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project || this.project.versions.length == 0) {
        return;
      }

      this.version = this.project.versions.find(x => x.active);
      if (!this.version) {
        return;
      }
      this.countMaterials();
      this.toggleAccordion();
    });
  }

  ngOnInit() {
    this.routerOutlet.swipeGesture = false;
  }

  ngOnDestroy(): void {
    this.projectSub?.unsubscribe();
  }

  ionViewWillEnter() {
    this.getProject();
  }

  ionViewWillLeave() {
    this.store.dispatch(prospectingActions.unSetProject());
  }

  getProject() {
    this.projectService.get(this.idProject).then(
      result => {
        result.data.versions.map(x => {
          x.active = x.is_current_version;

          x.buildings.map(x => {
            x.active = false;
          });
        });

        this.store.dispatch(prospectingActions.setProject({ project: result.data }));
      },
      error => {
        console.log(error);
      }
    );
  }

  async openNotesModal() {
    const modal = await this.modalController.create({
      component: ModalNotesComponent,
      cssClass: 'fullscreen'
    });
    await modal.present();
  }

  async addMaterial() {
    if (!(this.version && this.version.buildings && this.version.buildings.length > 0)) {
      const toast = await this.toastController.create({
        message: "The project doesn't have buildings",
        duration: 2000,
        color: 'danger',
        position: 'bottom',
      });

      toast.present();

      return;
    }

    const modal = await this.modalController.create({
      component: NewMaterialModalComponent,
      componentProps: {
        buildings: this.version.buildings
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

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

  isNumber(id: any) {
    return !isNaN(id);
  }

  async countMaterials() {
    this.suppliers = (await this.catalogs.getSuppliers()).data;

    const materialPriceLists = (await this.materialService.materialPriceListRepository.findAll()).data;
    const priceLists = (await this.materialService.priceListRepository.findAll()).data;

    this.materialCount = {};
    this.materialCount[-1] = 0;
    this.materialCount[0] = 0;

    for (const supplier of this.suppliers) {
      const priceSupplierIds = priceLists.filter(x => x.id_supplier == supplier.id).map(x => '' + x.id); //TODO: Check the acceptance date
      const materialPriceListIds = materialPriceLists.filter(x => priceSupplierIds.includes('' + x.id_price_list)).map(x => '' + x.id);
      const supplierId = isNaN(supplier.id) ? 0 : supplier.id;

      this.materialCount[supplierId] = (this.materialCount[supplierId] ?? 0) + this.version?.buildings
        ?.map(b => {
          if (!b
            || !b.psb_measure
            || !b.psb_measure.psb_material_calculations
            || b.psb_measure.psb_material_calculations.length == 0)
            return 0;

          const calculations = b.psb_measure.psb_material_calculations.filter(x => !x.deletedAt);
          if (!calculations || calculations.length == 0)
            return 0;

          this.id_material_shingle = this.id_material_shingle ?? calculations[0].id_material_shingle;

          const count = b.psb_measure.psb_material_calculations
            .filter(x => '' + x.id_material_shingle == '' + this.id_material_shingle)
            .filter(x => materialPriceListIds.includes('' + x.id_material_price_list) && !x.deletedAt)?.length ?? 0;

          return count;
        })
        .reduce((previous, current) => previous + current, 0) ?? 0;
    }

    this.materialService.id_material_shingle = this.id_material_shingle;
  }

  accordionGroupChange(ev: any) {
    this.expandedAccordion = ev.detail.value;
  }

  toggleAccordion() {
    const nativeEl = this.accordionGroup;
    if (nativeEl)
      nativeEl.value = this.expandedAccordion;
  }
}
