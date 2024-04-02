import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbCrickets } from 'src/app/models/psb_crickets.model';
import { WallMaterial } from 'src/app/models/wall-material.model';
import { CricketsComponent } from 'src/app/prospecting/modals/crickets/crickets.component';
import { DeleteComponent } from 'src/app/prospecting/modals/delete/delete.component';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';

@Component({
  selector: 'app-cricket-list',
  templateUrl: './cricket-list.component.html',
  styleUrls: ['./cricket-list.component.scss'],
})
export class CricketListComponent implements OnInit, OnDestroy {
  project: Project;
  buildings: Building[];
  building: Building;
  psbMeasures: PsbMeasures;
  psbCrickets: PsbCrickets[];
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

  loadProjectShingleBuilding() {
    const { buildings } = this.project.versions.find((x) => x.active);

    this.buildings = buildings;
    this.building = buildings.find((x) => x.active);

    if (this.building) {
      this.psbMeasures = {
        ...this.building.psb_measure,
      };

      if (this.psbMeasures.psb_crickets) {
        this.psbCrickets = this.psbMeasures.psb_crickets.filter(
          (x) => x.deletedAt == null
        );
      } else {
        this.psbCrickets = [];
      }
    }
  }

  async openCricket(cricket) {
    const modal = await this.modalController.create({
      component: CricketsComponent,
      cssClass: 'screen-750',
      componentProps: {
        cricket: cricket ? cricket : null,
        totalCrickets: this.psbCrickets.length,
      },
    });

    await modal.present();
  }

  getDescription(cricket): string {
    if (this.wallMaterials == null) {
      return;
    }

    let desc = '';
    if (cricket.second_valley_lf) {
      desc += '2 VALLEYS';
    } else {
      desc = '1 VALLEYS';
      if (cricket.sidewall_lf) {
        desc += ' / ' + cricket.sidewall_lf + ' LF SIDE WALL';
      }
      if (cricket.id_wall_material_sw) {
        desc += ' ' + this.getWallMaterial(cricket.id_wall_material_sw);
      }
    }

    if (cricket.endwall_lf) {
      desc += ' / ' + cricket.endwall_lf + ' LF END WALL';
      if (cricket.id_wall_material_ew) {
        desc += ' ' + this.getWallMaterial(cricket.id_wall_material_ew);
      }
    }
    return desc;
  }

  getWallMaterial(id: number) {
    const data = this.wallMaterials.find((x) => x.id === id);
    return data.wall_material.toUpperCase();
  }

  async openModalDelete(cricket) {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete',
      componentProps: {
        message: 'Are you sure to delete this crickets?',
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      this.deleteCricket(cricket.id);
    }
  }

  deleteCricket(id: number) {
    const psb_crickets_updated = this.psbCrickets.map((x) => {
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
      psb_crickets: psb_crickets_updated,
    };
    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
  }
}
