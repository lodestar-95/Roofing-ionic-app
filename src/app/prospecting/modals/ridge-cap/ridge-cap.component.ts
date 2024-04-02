import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ridge-cap',
  templateUrl: './ridge-cap.component.html',
  styleUrls: ['./ridge-cap.component.scss']
})
export class RidgeCapComponent implements OnInit, OnDestroy {
  project: Project;
  building: Building;
  buildings: Building[];
  storeSubs: Subscription;
  modalNullableData: boolean;
  projectShingleBuilding: PsbMeasures;
  ngForm: FormGroup;

  constructor(
    private store: Store<AppState>,
    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private projectService: ProjectsService,
    private alertController: AlertController
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project) {
        return;
      }

      const { buildings } = this.project.versions.find(x => x.active);
      this.buildings = buildings;
      this.building = buildings.find(x => x.active);
      this.projectShingleBuilding = {
        ...this.building.psb_measure
      };

      this.modalNullableData =
      this.projectShingleBuilding.ridge_lf !== 0 &&
      this.projectShingleBuilding.ridge_lf !== null;



    });
  }


  ngOnInit() {
    this.initForm();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  initForm() {
    this.ngForm = this.formBuilder.group({
      ridges: ['', Validators.compose([Validators.min(0), Validators.max(9999)])],
      hips: ['', Validators.compose([Validators.min(0), Validators.max(9999)])]
    });
    this.ngForm.get('ridges').setValue(this.building.psb_measure.ridge_lf);
    this.ngForm.get('hips').setValue(this.building.psb_measure.hips_lf);
  }

  allowNumbers(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true; //es permitido
  }

  async confirm() {
    if (this.modalNullableData && parseInt(this.ngForm.get('ridges').value) === 0){
      const alert = await this.alertController.create({
      message: 'This action will disable "Ridgevent in Place". Do you want to continue?',
      buttons: [{
        text: 'OK',
        role: 'confirm',
        handler: async () => {
          const psb_verifieds = this.projectService.getShingleVerifiedInformation(13);
          const shingle: PsbMeasures = {
            ...this.building.psb_measure,
            ridge_lf: parseInt(this.ngForm.get('ridges').value),
            hips_lf: parseInt(this.ngForm.get('hips').value),
            psb_verifieds
          };
          shingle.vent_is_ridgevent_in_place = false; // llevar a ridge cap modal
          shingle.vent_ridgevent_lf = 0; // llevar a ridge cap modal

          this.projectService.saveProjectShingleBuilding(shingle).then(() => {
            this.dismissModal();
          });


        },
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {  },
        }]
    });
    await alert.present();
    } else {
      const psb_verifieds = this.projectService.getShingleVerifiedInformation(13);
      const shingle: PsbMeasures = {
        ...this.building.psb_measure,
        ridge_lf: parseInt(this.ngForm.get('ridges').value),
        hips_lf: parseInt(this.ngForm.get('hips').value),
        psb_verifieds
      };
      if(shingle.vent_is_ridgevent_in_place)
      shingle.vent_ridgevent_lf = parseInt(this.ngForm.get('ridges').value); // llevar a ridge cap modal
      this.projectService.saveProjectShingleBuilding(shingle).then(() => {
        this.dismissModal();
      });
    }
  }

  dismissModal() {
    this.modalCtrl.dismiss({ data: true });
  }
}
