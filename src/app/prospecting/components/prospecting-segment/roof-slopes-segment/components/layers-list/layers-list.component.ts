import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbLayer } from 'src/app/models/psb-layer.model';
import { Project } from 'src/app/models/project.model';
import { ShingleTypesRemove } from 'src/app/models/shingle_types_remove.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ModalLayersComponent } from '../../modals/modal-layers/modal-layers.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layers-list',
  templateUrl: './layers-list.component.html',
  styleUrls: ['./layers-list.component.scss'],
})
export class LayersListComponent implements OnInit, OnDestroy {
  @Input() maxLayers: number;
  project: Project;
  building: Building;
  buildings: Building[];
  projectShingleLayers: PsbLayer[];
  shingleTypesRemoves: ShingleTypesRemove[] = [];
  storeSubs: Subscription;

  constructor(
    private store: Store<AppState>,
    private catalogsService: CatalogsService,
    private modalController: ModalController
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      this.loadLayers();
    });
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  loadLayers() {
    this.catalogsService.getCShingleTypesRemoves().then((result) => {
      this.shingleTypesRemoves = [...result.data];

      const { buildings } = this.project.versions.find((x) => x.active);

      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);

      if (this.building) {
        const psb_layers: PsbLayer[] =
          this.building.psb_measure.psb_layers?.map((layer: PsbLayer) => {
            const l = this.shingleTypesRemoves.find(
              (l) => l.id == layer.id_remove_type
            );

            return { ...layer, name: l?.shingle_type_remove };
          });
        this.projectShingleLayers = psb_layers;
        if (
          this.projectShingleLayers == null ||
          this.projectShingleLayers == undefined
        ) {
          this.projectShingleLayers = [];
        }
      }
    });
  }

  async openModalLayers() {
    const modal = await this.modalController.create({
      component: ModalLayersComponent,
      componentProps: {
        maxLayers: this.maxLayers,
      },
    });

    await modal.present();
  }
}
