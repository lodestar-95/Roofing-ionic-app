import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Generic } from 'src/app/models/generic.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbSkylight } from 'src/app/models/psb_skylight.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { DeleteComponent } from '../../modals/delete/delete.component';
import { SkylightsComponent } from '../../modals/skylights/skylights.component';

@Component({
  selector: 'app-skylight-list',
  templateUrl: './skylight-list.component.html',
  styleUrls: ['./skylight-list.component.scss'],
})
export class SkylightListComponent implements OnInit, OnDestroy {
  @Input() isNoRequired: boolean;
  @Input() activeNoRequired: boolean;
  @Output() optionEmited = new EventEmitter();
  project: Project;
  buildings: Building[];
  building: Building;
  psbMeasures: PsbMeasures;
  psbSkylights: PsbSkylight[];
  flashingKitCatalog: Generic[];
  skylightSizeCatalog: Generic[];
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
      this.loadPsbMeasures();
    });
  }

  ngOnInit() {
    this.getFlashingKit();
    this.getSkylightSize();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  getSkylightSize() {
    this.skylightSizeCatalog = [];
    this.skylightSizeCatalog.push({
      id: 1,
      option: 'Small (22.5 x 22.5)',
      selected: false,
    });
    this.skylightSizeCatalog.push({
      id: 2,
      option: 'Large (22.5 x 46.5)',
      selected: false,
    });
    this.skylightSizeCatalog.push({ id: 3, option: 'Custom', selected: false });
  }

  getFlashingKit() {
    this.flashingKitCatalog = [];
    this.flashingKitCatalog.push({
      id: 1,
      option: 'declined. Use E&H flashing',
      selected: false,
    });
    this.flashingKitCatalog.push({
      id: 2,
      option: 'provided by E&H Roofing.',
      selected: false
    });
    this.flashingKitCatalog.push({
      id: 3,
      option: 'provided by home owner',
      selected: false,
    });
  }

  loadPsbMeasures() {
    const { buildings } = this.project.versions.find((x) => x.active);

    this.buildings = buildings;
    this.building = buildings.find((x) => x.active);

    if (this.building) {
      this.psbMeasures = {
        ...this.building.psb_measure,
      };

      if (this.psbMeasures.psb_skylights) {
        this.psbSkylights = this.psbMeasures.psb_skylights.filter(
          (x) => x.deletedAt == null
        );
      } else {
        this.psbSkylights = [];
      }
    }
  }

  onNoRequiredCheked(event, option: number) {
    this.optionEmited.emit(option);
  }

  async openModalSkylight(skylight?) {
    const modal = await this.modalController.create({
      component: SkylightsComponent,
      cssClass: 'screen-750',
      componentProps: {
        skylight: skylight ? skylight : null,
        totalSkylights: this.psbSkylights.length,
      },
    });

    await modal.present();
  }

  getDescFlashingKit(id) {
    let flashingKit = this.flashingKitCatalog.find((x) => x.id == id);
    return flashingKit ? flashingKit.option : '';
  }

  getDescSkylightSizeCatalog(id) {
    let skylightSize = this.skylightSizeCatalog.find((x) => x.id == id);
    return skylightSize ? skylightSize.option : '';
  }

  async openModalDelete(skylight) {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete',
      componentProps: {
        message: 'Are you sure to delete this skylights?',
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      this.deleteSkylight(skylight.id);
    }
  }

  deleteSkylight(id: number) {
    const psb_skylights_updated = this.psbSkylights.map((x) => {
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
      psb_skylights: psb_skylights_updated,
    };
    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
  }
}
