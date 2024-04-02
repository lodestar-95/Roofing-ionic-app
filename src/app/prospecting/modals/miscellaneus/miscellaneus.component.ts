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
  selector: 'app-miscellaneus',
  templateUrl: './miscellaneus.component.html',
  styleUrls: ['./miscellaneus.component.scss'],
})
/**
 * @author: Carlos Rodríguez
 */
export class MiscellaneusComponent implements OnInit, OnDestroy {
  roofCaulking: number;
  sprayPaint: number;
  poorAccess: number;
  miscellaneous: number;
  permit: number;
  contingencyFund: number;
  storeSubs: Subscription;
  project: Project;
  building: Building;
  buildings: Building[];

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
    this.initData();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   *
   */
  initData() {
    this.roofCaulking =
      this.building.psb_measure.misc_roof_caulking_pc;
    this.sprayPaint =
      this.building.psb_measure.misc_spary_paint_pc;
    this.poorAccess =
      this.building.psb_measure.misc_poor_access_dll;
    this.miscellaneous =
      this.building.psb_measure.misc_miscellaneous_dll;
    this.permit = this.building.psb_measure.misc_permit_dll;
    this.contingencyFund =
      this.building.psb_measure.misc_contingency_fund_dll;
  }

  /**
   * Save shingle eves_rakes_lf_flat_roof
   */
  confirm() {
    const psb_verifieds =
      this.projectService.getShingleVerifiedInformation(20);

    const psb_measure: PsbMeasures = {
      ...this.building.psb_measure,
      misc_roof_caulking_pc: this.roofCaulking,
      misc_spary_paint_pc: this.sprayPaint,
      misc_poor_access_dll: this.poorAccess,
      misc_miscellaneous_dll: this.miscellaneous,
      misc_permit_dll: this.permit,
      misc_contingency_fund_dll: this.contingencyFund,
      psb_verifieds,
    };

    this.projectService.saveProjectShingleBuilding(psb_measure);
    this.modalController.dismiss({ data: true });
  }

  /**
   * 
   * @param value 
   * @param maxVal 
   * @param input 
   */
  valInfo(event: any, maxVal, input) {
    const value = event.detail.value;
    if (value > maxVal) {
      input.value = maxVal;
    }
  }
}
