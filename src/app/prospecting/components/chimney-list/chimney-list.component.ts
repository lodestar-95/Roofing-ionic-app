import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbChimney } from 'src/app/models/psb_chimney.model';
import { WallMaterial } from 'src/app/models/wall-material.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { ChimneysComponent } from '../../modals/chimneys/chimneys.component';
import { DeleteComponent } from '../../modals/delete/delete.component';

@Component({
  selector: 'app-chimney-list',
  templateUrl: './chimney-list.component.html',
  styleUrls: ['./chimney-list.component.scss'],
})
export class ChimneyListComponent implements OnInit, OnDestroy {
  @Input() isNoRequired: boolean;
  @Input() activeNoRequired: boolean;
  @Output() optionEmited = new EventEmitter();

  project: Project;
  buildings: Building[];
  building: Building;
  psbMeasures: PsbMeasures;
  psbChimneys: PsbChimney[];
  wallMaterials: WallMaterial[];
  storeSubs: Subscription;

  constructor(
    private store: Store<AppState>,
    private modalController: ModalController,
    private catalogsService: CatalogsService,
    private projectService: ProjectsService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      this.loadProjectShingleBuilding();
    });
  }

  ngOnInit() {
    this.getWallMaterials();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  getWallMaterials() {
    this.catalogsService.getWallMaterials().then((result) => {
      this.wallMaterials = [...result.data];
    });
  }

  getNameWallMaterial(id: number) {
    if (this.wallMaterials == null) {
      return;
    }
    const data = this.wallMaterials.find((x) => x.id === id);
    return data.wall_material.toUpperCase();
  }

  loadProjectShingleBuilding() {
    const { buildings } = this.project.versions.find((x) => x.active);

    this.buildings = buildings;
    this.building = buildings.find((x) => x.active);

    if (this.building) {
      this.psbMeasures = {
        ...this.building.psb_measure,
      };

      if (this.psbMeasures.psb_chimneys) {
        this.psbChimneys = this.psbMeasures.psb_chimneys.filter(
          (x) => x.deletedAt == null
        );
      } else {
        this.psbChimneys = [];
      }
    }
  }

  onNoRequiredCheked(event, option: number) {
    this.optionEmited.emit(option);
  }

  async openModalCricket(chimney?) {
    const modal = await this.modalController.create({
      component: ChimneysComponent,
      cssClass: 'screen-750',
      componentProps: {
        chimney: chimney ? chimney : null,
        totalChimneys: this.psbChimneys.length,
      },
    });

    await modal.present();
  }

  async openModalDelete(chimney) {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete',
      componentProps: {
        message: 'Are you sure to delete this chimneys?',
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      this.deleteChimney(chimney.id);
    }
  }

  deleteChimney(id: number) {
    const psb_chimneys_updated = this.psbChimneys.map((x) => {
      if (x.id == id) {
        return {
          ...x,
          deletedAt: new Date(),
        };
      } else {
        return x;
      }
    });

    const psbMeasuresUpdated = {
      ...this.psbMeasures,
      psb_chimneys: psb_chimneys_updated,
    };
    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
  }
}
