import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbLayer } from 'src/app/models/psb-layer.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { ShingleTypesRemove } from 'src/app/models/shingle_types_remove.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-modal-layers',
  templateUrl: './modal-layers.component.html',
  styleUrls: ['./modal-layers.component.scss']
})

/**
 * @author: Carlos Rodríguez
 */
export class ModalLayersComponent implements OnInit, OnDestroy {
  shingleTypesRemoves: ShingleTypesRemove[] = [];
  layers = [];
  projectShingleLayers: PsbLayer[] = [];
  project: Project;
  building: Building;
  buildings: Building[];
  @Input() maxLayers: number;
  storeSubs: Subscription;

  constructor(
    private catalogsService: CatalogsService,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private toastController: ToastController,
    private modalCtrl: ModalController
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      const { buildings } = this.project.versions.find(x => x.active);
      this.buildings = buildings;
      this.building = buildings.find(x => x.active);
    });
  }

  ngOnInit() {
    this.getCShingleTypesRemoves();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   *
   */
  getCShingleTypesRemoves() {
    for (let i = 0; i < this.maxLayers; i++) {
      this.catalogsService.getCShingleTypesRemoves().then(result => {
        this.shingleTypesRemoves = [...result.data];

        if (this.building.psb_measure.psb_layers) {
          const layer = this.building.psb_measure.psb_layers.find(x => x.layer == i + 1);

          // Preselecciona la opción si ya tiene registro
          if (layer) {
            this.projectShingleLayers.push({ ...layer });

            this.shingleTypesRemoves.map(x => {
              if (x.id == layer.id_remove_type) {
                x.isChecked = true;
              }
            });
            this.layers.push({
              id: layer.id,
              items: this.shingleTypesRemoves
            });
          } else {
            this.layers.push({
              id: uuidv4(),
              items: this.shingleTypesRemoves
            });
          }
        } else {
          this.layers.push({
            id: uuidv4(),
            items: this.shingleTypesRemoves
          });
        }
      });
    }
  }

  /**
   *
   * @param shingleTypesRemove
   */
  onLayerSelected(shingleTypesRemove: any, id: any, layer: number) {
    const exist = this.projectShingleLayers.find(x => x.id == id);

    if (exist) {
      this.projectShingleLayers.map(x => {
        if (x.id == id) {
          x.id_remove_type = shingleTypesRemove.id;
        }
      });
    } else {
      const projectShingleLayers: PsbLayer = {
        id,
        id_psb_measure: this.building.psb_measure.id,
        id_remove_type: shingleTypesRemove.id,
        layer
      };
      this.projectShingleLayers.push(projectShingleLayers);
    }
  }

  /**
   * Update project information locally and in redux
   * @param versions
   */
  async saveLayer(psb_layers: PsbLayer[]) {
    const psbMeasure: PsbMeasures = {
      ...this.building.psb_measure,
      psb_layers
    };

    this.projectService.saveProjectShingleBuilding(psbMeasure);
  }

  onClick() {
    if (this.projectShingleLayers.length < this.maxLayers) {
      this.presentToast('La información no es correcta');
      return;
    }

    const psb_layers: PsbLayer[] = [...this.projectShingleLayers];

    this.saveLayer(psb_layers);
    this.modalCtrl.dismiss();
  }

  /**
   * Present message inside the screen.
   * @param message
   */
  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      animated: true,
      color: 'dark'
    });
    toast.present();
  }
}
