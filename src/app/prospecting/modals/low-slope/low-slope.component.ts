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
  selector: 'app-low-slope',
  templateUrl: './low-slope.component.html',
  styleUrls: ['./low-slope.component.scss'],
})
export class LowSlopeComponent implements OnInit, OnDestroy {
  evesstarter: number;
  valleys: number;
  rakes: number;
  project: Project;
  building: Building;
  buildings: Building[];
  storeSubs: Subscription;

  constructor( 
    private store: Store<AppState>,
    private readonly modalCtrl: ModalController,
    private projectService: ProjectsService) { 
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
    this.building.psb_measure.eves_starters_lf_low_slope;
  this.valleys =
    this.building.psb_measure.valleys_lf_low_slope;
  this.rakes =
    this.building.psb_measure.rakes_lf_low_steep_slope;
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  confirm(){
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(15);
    
    const psb_measure: PsbMeasures = {
      ...this.building.psb_measure,
      eves_starters_lf_low_slope: this.evesstarter,
      rakes_lf_low_steep_slope: this.rakes,
      valleys_lf_low_slope: this.valleys,
      psb_verifieds
    };
    this.projectService.saveProjectShingleBuilding(psb_measure);
    this.modalCtrl.dismiss({data: true});
  }

  allowNumbers(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true; //es permitido
  }

}
