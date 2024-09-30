import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { PsbVerified } from 'src/app/models/psb_verified.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-prospecting-segment',
  templateUrl: './prospecting-segment.component.html',
  styleUrls: ['./prospecting-segment.component.scss']
})
/**
 * @author: Carlos Rodríguez
 */
export class ProspectingSegmentComponent implements OnInit, OnDestroy {
  @Output() showBuildingsEmmited = new EventEmitter<any>();
  segment: string = 'general';
  project: Project;
  projectShingleBuilding = new PsbMeasures();
  psbVerified: PsbVerified[];
  storeSubs: Subscription;
  otherMeasuresActive: boolean;
  detailsActive: boolean;
  optionsActive: boolean;
  upgradesActive: boolean;
  selectionActive: boolean;
  generalActive: boolean;
  roofSlopesActive: boolean;

  constructor(private store: Store<AppState>, public projectService: ProjectsService) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project || this.project?.versions?.length == 0) {
        return;
      }
      const { buildings } = this.project.versions.find(x => x.active);

      const building = buildings.find(x => x.active);
      if (!building) {
        return;
      }

      this.projectShingleBuilding =
        building.psb_measure == undefined ? new PsbMeasures() : building.psb_measure;
      if (this.projectShingleBuilding) {
        this.psbVerified = this.projectShingleBuilding.psb_verifieds
          ? [...this.projectShingleBuilding.psb_verifieds]
          : [];

        this.validateTabsActive();
      }

      console.log('buildings', buildings)
    });
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Change segment value
   */
  segmentChanged(event: any) {
    this.segment = event.detail.value;
    this.validateTabsActive();
  }

  showBuiildings() {
    this.showBuildingsEmmited.emit(true);
  }

  changeSegment(event) {
    this.segment = event;
  }

  validateTabsActive() {
    this.generalActive = this.projectService.findResourceId(6);
    this.roofSlopesActive = this.projectService.findResourceId(7);
    this.otherMeasuresActive = this.projectService.findResourceId(9);
    this.detailsActive = this.projectService.findResourceId(8);
    this.optionsActive = this.projectService.findResourceId(10);
    this.upgradesActive = this.projectService.findResourceId(11);
    this.selectionActive = this.projectService.findResourceId(12);
  }
}
