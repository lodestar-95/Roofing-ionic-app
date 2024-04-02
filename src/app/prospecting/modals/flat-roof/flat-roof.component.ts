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
  selector: 'app-flat-roof',
  templateUrl: './flat-roof.component.html',
  styleUrls: ['./flat-roof.component.scss'],
})
export class FlatRoofComponent implements OnInit, OnDestroy {
  evesrakes: number;
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
      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find(
        (x) => x.active
      );
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
    });
  }

  ngOnInit() {
    this.evesrakes =
      this.building.psb_measure.eves_rakes_lf_flat_roof;
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Save project_shingle_building eves_rakes_lf_flat_roof
   */
  confirm() {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(14);
  
    const psb_measure: PsbMeasures = {
      ...this.building.psb_measure,
      eves_rakes_lf_flat_roof: this.evesrakes,
      psb_verifieds
    };

    this.projectService.saveProjectShingleBuilding(psb_measure);
    this.modalController.dismiss({data: true});
  }

  validateNumber(event: any){
    
  }
}
