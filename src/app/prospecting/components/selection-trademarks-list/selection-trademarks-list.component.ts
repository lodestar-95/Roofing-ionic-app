import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { PsbSelectedMaterial } from 'src/app/models/psb_selected_material.model';
import { PvTrademarks } from 'src/app/models/pv_trademarks.model';
import { Trademark } from 'src/app/models/trademark.model';
import { Version } from 'src/app/models/version.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { MaterialCategoriesComponent } from '../../modals/material-categories/material-categories.component';
import { Building } from 'src/app/models/building.model';
import { MeasuresMaterialType } from 'src/app/models/measures-material-types.model';
import { Subscription } from 'rxjs';
import { MaterialCategory } from 'src/app/models/material-category.model';
import { Compability } from 'src/app/models/compability.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

@Component({
  selector: 'app-selection-trademarks-list',
  templateUrl: './selection-trademarks-list.component.html',
  styleUrls: ['./selection-trademarks-list.component.scss'],
})
export class SelectionTrademarksListComponent implements OnInit, OnDestroy {
  version: Version;
  trademarks: Trademark[] | any[] = [];
  trademarksSelected: PvTrademarks[];
  // selectedMaterials: PsbSelectedMaterial[] = [];
  building: Building;
  materialTypes: MeasuresMaterialType[];
  storeSubs: Subscription;
  materialCategories: MaterialCategory[] | any[];
  compatibilities: Compability[];
  categoryRidgecapId: number;

  constructor(
    private modalController: ModalController,
    private store: Store<AppState>,
    private catalogs: CatalogsService,
    private projectService: ProjectsService,
    private general: GeneralService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      const project = state.project;
      if (!project) {
        return;
      }

      this.version = project.versions.find((x) => x.active);
      if (!this.version) {
        return;
      }

      this.building = this.version.buildings.find((x) => x.active);
      this.initData();
    });

    this.general.getConstDecimalValue('category_ridgecap').then(id => {
      this.categoryRidgecapId = id;
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() { }

  /**
   * Initial info
   */
  initData() {
    this.catalogs.getMaterialCategories().then((result) => {
      this.materialCategories = result.data;
    });

    if (!this.version?.pv_trademarks) {
      return;
    }

    const pv_trademarks = this.removeDuplicateTradeMarks(this.version.pv_trademarks);

    this.trademarksSelected = pv_trademarks.filter(
      (x) => x.selected == true
    );

    this.catalogs.getMeasuresMaterialTypes().then((result) => {
      this.materialTypes = result.data;
    });

    this.catalogs.getTrademarks().then((result) => {
      this.trademarks = [];

      this.trademarksSelected.forEach((element) => {
        if (element.selected) {
          const trademark: Trademark = result.data.find(
            (x) => x.id == element.id_trademarks
          );
          this.trademarks.push(trademark);
        }
      });

      this.loadMaterialSelected();
    });
  }

  removeDuplicateTradeMarks(arr) {
    const seen = new Map();
  
    return arr.filter(item => {
      if (seen.has(item.id_trademarks)) {
        return false;
      } else {
        seen.set(item.id_trademarks, true);
        return true;
      }
    });
  }

  removeDuplicateMaterialSelected(arr) {
    const seen = new Map();

    return arr.filter(item => {
        const key = `${item.id_trademark_shingle}-${item.id_material_type_selected}`;
        if (seen.has(key)) {
            return false;
        } else {
            seen.set(key, true);
            return true;
        }
    });
}

  /**
   * Load material selected for
   */
  loadMaterialSelected() {
    if (!this.building.psb_measure.psb_selected_materials) {
      return;
    }

    const materialSelected = this.removeDuplicateMaterialSelected(this.building.psb_measure.psb_selected_materials);

    this.trademarks.forEach((element) => {
      element.materialTypes = [];
      materialSelected.forEach((x) => {
        if (element.id == x.id_trademark_shingle && !x.deletedAt) {
          const materialType: any = this.materialTypes.find(
            (item) => item.id == x.id_material_type_selected
          );
          if (materialType) {
            const category = this.materialCategories.find(
              (x) => x.id == materialType.id_material_category
            )?.material_category;
            if (category) {
              materialType.category = category;
              element.materialTypes.push(materialType);
            }
          }
        }
      });
      element.materialTypes = element.materialTypes.sort((a, b) => a.id_material_category - b.id_material_category);
    });
  }

  /**
   * Open modal for selcted material category
   * @param trademark
   */
  async openModalMaterialCategories(trademark: Trademark) {
    const materials = this.building.psb_measure?.psb_selected_materials?.filter(x => !x.deletedAt);
    const modal = await this.modalController.create({
      component: MaterialCategoriesComponent,
      componentProps: {
        trademark,
        materialCategories: this.materialCategories,
        materialTypes: this.materialTypes,
        compatibilities: this.compatibilities,
        psb_selected_materials: materials,
      },
    });

    await modal.present();
    const result = await modal.onWillDismiss();

    if (result.data) {
      const ids = [];
      const results = result.data.map(x => {
        if (ids.some(y => y.id == x.id_material_category && y.id_trademark_shingle == x.id_trademark_shingle)) {
          return { ...x, deletedAt: new Date() };
        } else {
          ids.push({ id: x.id_material_category, id2: x.id_trademark_shingle });
          return { ...x };
        }
      });
      let materials = [];
      if (this.building.psb_measure.psb_selected_materials) {
        materials = this.building.psb_measure.psb_selected_materials
          .filter(x => x.deletedAt)
          .concat(results);
      } else {
        materials = results;
      }
      this.saveMaterial(materials);
    }
  }

  async getMaterialCategories(trademark: Trademark) {
    await this.catalogs.getMaterialCategories().then((result) => {
      this.materialCategories = result.data;
    });

    await this.catalogs.getCompabilities().then((result) => {
      this.compatibilities = result.data;
    });

    this.catalogs.getMeasuresMaterialTypes().then((result) => {
      this.materialTypes = result.data;

      this.materialCategories.forEach((element) => {
        if (!this.building) {
          return;
        }

        if (!this.building.psb_measure.psb_selected_materials) {
          return;
        }

        const materialSelected =
          this.building.psb_measure.psb_selected_materials.find(
            (x) =>
              x.id_material_category == element.id &&
              x.id_trademark_shingle == trademark.id &&
              !x.deletedAt
          );

        if (!materialSelected) {
          return;
        }

        const material = this.materialTypes.find(
          (x) => x.id == materialSelected.id_material_type_selected
        );
        if (material) {
          element.material = material.material_type;
          element.size = material.size;
        }
      });

      this.openModalMaterialCategories(trademark);
    });
  }

  /**
   * Save info material selected in spb measure
   * @param material
   */
  /**
   * Save info in temp array
   * @param material
   */
  saveMaterial(materialCategories: PsbSelectedMaterial[]) {
    const psbMeasure: PsbMeasures = {
      ...this.building.psb_measure,
      psb_selected_materials: [...materialCategories],
    };
    this.projectService.saveProjectShingleBuilding(psbMeasure);
  }
}
