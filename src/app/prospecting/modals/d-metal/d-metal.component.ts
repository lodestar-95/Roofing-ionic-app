import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { MeasuresMaterialType } from 'src/app/models/measures-material-types.model';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-d-metal',
  templateUrl: './d-metal.component.html',
  styleUrls: ['./d-metal.component.scss'],
})
export class DMetalComponent implements OnInit, OnDestroy {
  materialsEvesRakes: MeasuresMaterialType[];
  materialsEvesStarters: MeasuresMaterialType[];
  materialsRakes: MeasuresMaterialType[];
  project: Project;
  building: Building;
  buildings: Building[];
  materialEvesRakesOption: number;
  materialEvesStartersOption: number;
  materialRakesOption: number;
  materialEvesStarters: MeasuresMaterialType;
  materialRakes: MeasuresMaterialType;
  @Input() validEvesRakesInFlatRoof: boolean;
  @Input() validEvesStartersInLowOrSteepSlope: boolean;
  @Input() validRakesInLowOrSteepSlope: boolean;
  storeSubs: Subscription;

  constructor(
    private catalogsService: CatalogsService,
    private store: Store<AppState>,
    private readonly modalCtrl: ModalController,
    private projectService: ProjectsService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find((x) => x.active);
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
    });
  }

  ngOnInit() {
    this.getMaterialOptions();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  getMaterialOptions() {
    this.catalogsService.getMeasuresMaterialTypes().then((result) => {
      this.materialsEvesRakes = [...result.data];
      this.materialsEvesRakes = this.materialsEvesRakes.filter(
        (x) => x.id_material_category == 1
      );

      if (this.validEvesRakesInFlatRoof) {
        this.materialsEvesRakes.map((x) => {
          if (x.id == this.building.psb_measure.id_metal_eves_rakes_flat_roof) {
            this.materialEvesRakesOption = x.id;
            x.isChecked = true;
          }
        });
      }
    });

    this.catalogsService.getMeasuresMaterialTypes().then((result) => {
      this.materialsEvesStarters = [...result.data];
      this.materialsEvesStarters = this.materialsEvesStarters.filter(
        (x) => x.id_material_category == 1
      );

      if (this.validEvesStartersInLowOrSteepSlope) {
        this.materialsEvesStarters.map((x) => {
          if (
            x.id == this.building.psb_measure.id_metal_eves_starters_low_slope
          ) {
            this.materialEvesStartersOption = x.id;
            x.isChecked = true;
          }
        });
      }
    });

    this.catalogsService.getMeasuresMaterialTypes().then((result) => {
      this.materialsRakes = [...result.data];
      this.materialsRakes = this.materialsRakes.filter(
        (x) => x.id_material_category == 1
      );

      if (this.validRakesInLowOrSteepSlope) {
        this.materialsRakes.map((x) => {
          if (
            x.id == this.building.psb_measure.id_metal_rakes_low_steep_slope
          ) {
            this.materialRakesOption = x.id;
            x.isChecked = true;
          }
        });
      }
    });
  }

  onOptionSelectedMaterialEvesRakes(materialOption: any) {
    this.materialEvesRakesOption = materialOption.id;
  }

  onOptionSelectedMaterialEvesStarters(materialOption: any) {
    this.materialEvesStartersOption = materialOption.id;
  }

  onOptionSelectedMaterialRakes(materialOption: any) {
    this.materialRakesOption = materialOption.id;
  }

  confirm() {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(17);

    let psb_measureUpdated: PsbMeasures = {
      ...this.building.psb_measure,
      psb_verifieds,
    };

    if (this.materialEvesRakesOption) {
      psb_measureUpdated = {
        ...psb_measureUpdated,
        id_metal_eves_rakes_flat_roof: this.materialEvesRakesOption,
      };
    }

    if (this.materialEvesStartersOption) {
      psb_measureUpdated = {
        ...psb_measureUpdated,
        id_metal_eves_starters_low_slope: this.materialEvesStartersOption,
      };
    }

    if (this.materialRakesOption) {
      psb_measureUpdated = {
        ...psb_measureUpdated,
        id_metal_rakes_low_steep_slope: this.materialRakesOption,
      };
    }
    this.projectService.saveProjectShingleBuilding(psb_measureUpdated);
    this.modalCtrl.dismiss();
  }
}
