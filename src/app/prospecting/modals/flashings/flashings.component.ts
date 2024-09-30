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
  selector: 'app-flashings',
  templateUrl: './flashings.component.html',
  styleUrls: ['./flashings.component.scss'],
})
export class FlashingsComponent implements OnInit, OnDestroy {
  flashStep8: number;
  flashStep12: number;
  rolledMetal: number;
  endWallMetal: number;
  flashPipe3: number;
  flashPipe2: number;
  flashRetrofitPipe: number;
  project: Project;
  building: Building;
  buildings: Building[];
  optionChecked12: boolean;
  optionChecked8: boolean;
  storeSubs: Subscription;

  constructor(
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
    this.flashStep8 = this.building.psb_measure.flash_step_4_4_8_lf;
    this.flashStep12 = this.building.psb_measure.flash_step_4_4_12_lf;
    this.rolledMetal = this.building.psb_measure.flash_rolled_metal_20_50_lf;
    this.endWallMetal =
      this.building.psb_measure.flash_end_wall_metal_3_5_10_lf;
    this.flashPipe3 = this.building.psb_measure.flash_pipe_3_in_1_pc;
    this.flashPipe2 = this.building.psb_measure.flash_pipe_2_in_1_pc;
    this.flashRetrofitPipe = this.building.psb_measure.flash_retrofit_pipe_pc;

    this.optionChecked8 = this.building.psb_measure.flash_step_4_4_8_lf
      ? true
      : false;
    this.optionChecked12 = this.building.psb_measure.flash_step_4_4_12_lf
      ? true
      : false;
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  allowNumbers(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true; //es permitido
  }

  optionSelcted(option: number) {
    if (option == 1) {
      this.optionChecked8 = true;
      this.optionChecked12 = false;
      this.flashStep12 = null;
    } else {
      this.optionChecked8 = false;
      this.flashStep8 = null;
      this.optionChecked12 = true;
    }
  }

  confirm() {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(18);

    const shingle: PsbMeasures = {
      ...this.building.psb_measure,
      flash_step_4_4_8_lf: this.flashStep8,
      flash_rolled_metal_20_50_lf: this.rolledMetal,
      flash_end_wall_metal_3_5_10_lf: this.endWallMetal,
      flash_pipe_3_in_1_pc: this.flashPipe3,
      flash_pipe_2_in_1_pc: this.flashPipe2,
      flash_retrofit_pipe_pc: this.flashRetrofitPipe,
      flash_step_4_4_12_lf: this.flashStep12,
      psb_verifieds,
    };
    this.projectService.saveProjectShingleBuilding(shingle);
    this.modalCtrl.dismiss({ data: true });
  }
}
