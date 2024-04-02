import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-steep-slope',
  templateUrl: './steep-slope.component.html',
  styleUrls: ['./steep-slope.component.scss'],
})
export class SteepSlopeComponent implements OnInit, OnDestroy {
  evesstarter: number;
  valleys: number;
  rakes: number;
  project: Project;
  building: Building;
  buildings: Building[];
  storeSubs: Subscription;

  constructor(
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private modalController: ModalController
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      const { buildings } = this.project.versions.find(
        (x) => x.active
      );
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
    });
  }

  ngOnInit() {
    this.evesstarter =
      this.building.psb_measure.eves_starters_lf_steep_slope;
    this.valleys =
      this.building.psb_measure.valleys_lf_steep_slope;
    this.rakes =
      this.building.psb_measure.rakes_lf_steep_slope;
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Save shingle
   */
  confirm() {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(16);
  
    const shingle: PsbMeasures = {
      ...this.building.psb_measure,
      eves_starters_lf_steep_slope: this.evesstarter,
      rakes_lf_steep_slope: this.rakes,
      valleys_lf_steep_slope: this.valleys,
      psb_verifieds
    };

    this.projectService.saveProjectShingleBuilding(shingle);
    this.modalController.dismiss({data: true});
  }
}
