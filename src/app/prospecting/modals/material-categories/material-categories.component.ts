import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ModalController,
  PopoverController,
  ToastController,
} from '@ionic/angular';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Compability } from 'src/app/models/compability.model';
import { MaterialCategory } from 'src/app/models/material-category.model';
import { MeasuresMaterialType } from 'src/app/models/measures-material-types.model';
import { PsbSelectedMaterial } from 'src/app/models/psb_selected_material.model';
import { Trademark } from 'src/app/models/trademark.model';
import { Version } from 'src/app/models/version.model';
import { PopoverMaterialTypesComponent } from '../../components/popover-material-types/popover-material-types.component';
import { v4 as uuidv4 } from 'uuid';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';
import { selectProjectWithoutRidgeHips } from '../../state/propsecting.selectors';

@Component({
  selector: 'app-material-categories',
  templateUrl: './material-categories.component.html',
  styleUrls: ['./material-categories.component.scss'],
})
export class MaterialCategoriesComponent implements OnInit, OnDestroy {
  @Input() trademark: Trademark;
  @Input() materialTypes: MeasuresMaterialType[];
  @Input() materialCategories: MaterialCategory[] | any[];
  @Input() compatibilities: Compability[];
  isDeclinedInWLowSlope: boolean = false;

  storeSubs: Subscription;
  version: Version;
  building: Building;
  @Input() psb_selected_materials: PsbSelectedMaterial[] = [];
  categoryRidgecapId: number;
  withOutRidge: boolean;

  constructor(
    private popoverCtrl: PopoverController,
    private modalController: ModalController,
    private store: Store<AppState>,
    private toastController: ToastController,
    private general: GeneralService
  ) {
    this.store.pipe(select(selectProjectWithoutRidgeHips)).subscribe(value => this.withOutRidge = value);

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
      this.isDeclinedInWLowSlope = this.isInWShieldDeclined() && this.hasLowSlope();
    });

    this.general.getConstDecimalValue('category_ridgecap').then(id => {
      this.categoryRidgecapId = id;
    });
  }

  ngOnInit() { }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  async openPopoverMaterialTypes(event: any, materialCategory: any) {
    if (materialCategory.id == 30) {
      if (this.isInWShieldDeclined() && !this.hasLowSlope()) {
        this.presentToast('Ice and Water Shield is declined');
        return;
      }

      if (this.isOverlay() && !this.hasLowSlope()) {
        this.presentToast('Doesn\'t apply ice and water shield when job type is overlay');
        return;
      }
    }

    if (materialCategory.id == 34) {
      if (this.isInWShieldCompleteRoof()) {
        this.presentToast('Doesn\'t apply underlayment when Ice and Water Shield is complete roof');
        return;
      }

      if (this.isOverlay()) {
        this.presentToast('Doesn\'t apply underlayment when job type is overlay');
        return;
      }
    }

    if (materialCategory.id == 34) {
      if (this.isInWShieldCompleteRoof()) {
        this.presentToast('Doesn\'t apply underlayment when Ice and Water Shield is complete roof');
        return;
      }
    }

    if (materialCategory.id == 7) {
      if (this.withOutRidge) {
        this.presentToast('Ridge cap isn\'t required, ridge doesn\'t exist on the roof');
        return;
      }

    }

    let materialTypes = this.getMaterialTypes(materialCategory);

    if (materialCategory.id == this.categoryRidgecapId) {
      const sizes = [];
      materialTypes = materialTypes.filter(x => {
        if (sizes.includes(x.size)) {
          return false;
        } else {
          sizes.push(x.size);
          return true;
        }
      });
    }

    const popover = await this.popoverCtrl.create({
      component: PopoverMaterialTypesComponent,
      event,
      side: 'bottom',
      size: 'cover',
      componentProps: {
        materialTypes,
        categoryRidgecapId: this.categoryRidgecapId
      },
    });

    await popover.present();
    const result = await popover.onWillDismiss();

    if (result.data) {
      const material: PsbSelectedMaterial = {
        id: uuidv4(),
        id_material_category: materialCategory.id,
        id_material_type_selected: result.data.id,
        id_psb_measure: this.building.psb_measure.id,
        id_trademark_shingle: this.trademark.id,
        isModified: true
      };

      this.materialCategories.map((x) => {
        if (x.id == material?.id_material_category) {
          const materialType = this.materialTypes.find((x) => x.id == material.id_material_type_selected);
          x.material = materialType.material_type;
          x.size = materialType.size;
        }
      });

      this.saveMaterial(material);
    }
  }

  getMaterialTypes(materialCategory: any): MeasuresMaterialType[] {
    const materialTypes: MeasuresMaterialType[] = this.materialTypes.filter(
      (x) => x.id_material_category == materialCategory.id
    );

    const compabilities: Compability[] = this.compatibilities.filter(
      (x) =>
        x.id_material_category == materialCategory.id &&
        x.id_shingle_trandemark == this.trademark.id
    );

    const result: MeasuresMaterialType[] = [];
    compabilities.forEach((c) => {
      materialTypes.forEach((m) => {
        if (c.id_material_type == m.id) {
          result.push(m);
        }
      });
    });

    return result;
  }

  /**
   * Save info in temp array
   * @param material
   */
  saveMaterial(material: PsbSelectedMaterial) {
    if (this.building.psb_measure?.psb_selected_materials) {
      const exist = this.psb_selected_materials.find(
        (x) =>
          x.id_material_category == material?.id_material_category &&
          x.id_trademark_shingle == material.id_trademark_shingle
      );

      if (exist) {
        this.psb_selected_materials =
          this.psb_selected_materials.map((x) => {
            if (
              x.id_material_category == material?.id_material_category &&
              x.id_trademark_shingle == this.trademark.id
            ) {
              return {
                ...x,
                id_material_type_selected: material.id_material_type_selected,
              };
            } else {
              return { ...x };
            }
          });

      } else {
        this.psb_selected_materials = [
          ...this.psb_selected_materials,
          material,
        ];

      }
    } else {
      if (!this.psb_selected_materials) {
        this.psb_selected_materials = [];
      }
      this.psb_selected_materials.push(material);

    }
  }

  /**
   * Close modal
   */
  confirm() {
    this.modalController.dismiss(this.psb_selected_materials);
  }

  /**
   * Is InW declined?
   * @returns
   */
  isInWShieldDeclined(): boolean {
    return this.building.psb_measure.id_inwshield_rows == 3;
  }

  hasLowSlope(): boolean {
    return this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 2 && x.pitch < 4 && !x.deletedAt) ?? false;
  }

  isInWShieldCompleteRoof(): boolean {
    return this.building.psb_measure.id_inwshield_rows == 4;
  }

  isOverlay(): boolean {
    return this.building.id_job_type == 14;
  }

  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      animated: true,
      color: 'dark',
    });
    toast.present();
  }
}
