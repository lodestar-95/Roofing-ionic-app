import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-out-of-town-expenses',
  templateUrl: './out-of-town-expenses.component.html',
  styleUrls: ['./out-of-town-expenses.component.scss'],
})
export class OutOfTownExpensesComponent implements OnInit, OnDestroy {
  @Input() hotelId: number;
  @Input() airBnBId: number;
  outIdLodingType: number = 0;
  optionHotel: boolean = false;
  optionAirbnb: boolean = false;
  storeSubs: Subscription;
  project: Project;
  building: Building;
  buildings: Building[];
  ngForm: FormGroup;
  exp_regular = /^(\d{1,7})(\.\d{2,2}){0,1}$/;
  noRequired = false;

  constructor(
    private store: Store<AppState>,
    private readonly modalCtrl: ModalController,
    private projectService: ProjectsService,
    private readonly formBuilder: FormBuilder
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }

      const { buildings } = this.project.versions.find((x) => x.active);
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
      this.initData();
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
      additionalFuel: [
        '',
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(99999),
          Validators.pattern(this.exp_regular),
        ]),
      ],
      estimatedDays: [
        '',
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(999),
        ]),
      ],
      estimatedRoofers: [
        '',
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(99),
        ]),
      ],

      lodingRateHotel: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
          Validators.min(0),
          Validators.max(9999),
        ]),
      ],

      lodingRateAirbnb: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
          Validators.min(0),
          Validators.max(9999),
        ]),
      ],
      travelTime: [
        '',
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(999),
        ]),
      ],
    });

    this.ngForm.get('lodingRateHotel').disable();
    this.ngForm.get('lodingRateAirbnb').disable();
    if (this.building != null) {
      this.initData();
    }
  }

  initData() {
    if (this.ngForm == null) {
      return;
    }

    this.outIdLodingType = this.building.psb_measure.out_id_loding_type
      ? this.building.psb_measure.out_id_loding_type
      : 0;

    if (this.building?.psb_measure?.psb_no_requireds?.find(x => x.id_resource == 21)?.no_required && this.noRequired == false) {
      this.noRequiredChange();
      return;
    }

    this.ngForm
      .get('additionalFuel')
      .setValue(this.building.psb_measure.out_additional_fuel_dll);
    this.ngForm
      .get('estimatedDays')
      .setValue(this.building.psb_measure.out_estimated_days_days);
    this.ngForm
      .get('estimatedRoofers')
      .setValue(this.building.psb_measure.out_estimated_roofers_qty);
    if (this.building.psb_measure.out_id_loding_type == this.hotelId) {
      this.ngForm
        .get('lodingRateHotel')
        .setValue(this.building.psb_measure.out_loding_rate_dll);
      this.ngForm.get('lodingRateHotel').enable();
      this.optionHotel = true;
      this.optionAirbnb = false;
    } else if (this.building.psb_measure.out_id_loding_type == this.airBnBId) {
      this.ngForm
        .get('lodingRateAirbnb')
        .setValue(this.building.psb_measure.out_loding_rate_dll);
      this.ngForm.get('lodingRateAirbnb').enable();
      this.optionHotel = false;
      this.optionAirbnb = true;
    }
    this.ngForm
      .get('travelTime')
      .setValue(this.building.psb_measure.out_travel_time_hrs);
    this.ngForm.markAsDirty();
  }

  confirm() {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(21);
    const psb_no_requireds = this.getNotRequireds();

    const shingle: PsbMeasures = {
      ...this.building.psb_measure,
      out_additional_fuel_dll: parseFloat(
        this.ngForm.get('additionalFuel').value
      ),
      out_estimated_days_days: this.ngForm.get('estimatedDays').value,
      out_estimated_roofers_qty: this.ngForm.get('estimatedRoofers').value,
      out_loding_rate_dll:
        this.outIdLodingType == this.hotelId
          ? parseFloat(this.ngForm.get('lodingRateHotel').value)
          : parseFloat(this.ngForm.get('lodingRateAirbnb').value),
      out_id_loding_type: this.outIdLodingType,
      out_travel_time_hrs: this.ngForm.get('travelTime').value,
      psb_verifieds,
      psb_no_requireds: psb_no_requireds
    };
    this.projectService.saveProjectShingleBuilding(shingle);
    this.modalCtrl.dismiss({ data: true });
  }

  private getNotRequireds() {
    let psb_no_requireds = this.building?.psb_measure?.psb_no_requireds??[];
    const indexNotRequired = psb_no_requireds.findIndex(x => x.id_resource == 21)??-1;

    if (indexNotRequired == -1 && this.noRequired) {
      psb_no_requireds = [...psb_no_requireds, { id: uuidv4(), id_resource: 21, id_psb_measure: this.building.psb_measure.id, isModified: true, no_required: this.noRequired }];
    } else {
      psb_no_requireds = psb_no_requireds.map(x => {
        if (x.id_resource == 21) {
          return { ...x, no_required: this.noRequired };
        } else {
          return x;
        }
      });
    }
    return psb_no_requireds;
  }

  allowNumbers(event: any, name = null) {
    const charCode = event.which ? event.which : event.keyCode;
    if (name && charCode == 46) {
      let txt = this.ngForm.get(name).value;
      if (!(txt.indexOf('.') > -1)) {
        return true;
      }
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true; //es permitido
  }

  optionSelected(option: number) {
    this.outIdLodingType = option;
    if (option == this.hotelId) {
      this.optionHotel = true;
      this.optionAirbnb = false;
      this.ngForm.get('lodingRateHotel').enable();
      this.ngForm.get('lodingRateHotel').addValidators(Validators.required);

      this.ngForm.get('lodingRateAirbnb').disable();
      this.ngForm.get('lodingRateAirbnb').setValue('');
      this.ngForm.get('lodingRateAirbnb').removeValidators(Validators.required);
    } else if (option == this.airBnBId) {
      this.optionHotel = false;
      this.optionAirbnb = true;
      this.ngForm.get('lodingRateHotel').disable();
      this.ngForm.get('lodingRateHotel').setValue('');
      this.ngForm.get('lodingRateHotel').removeValidators(Validators.required);

      this.ngForm.get('lodingRateAirbnb').enable();
      this.ngForm.get('lodingRateAirbnb').addValidators(Validators.required);
    }
    this.ngForm.get('lodingRateHotel').updateValueAndValidity();
    this.ngForm.get('lodingRateAirbnb').updateValueAndValidity();
  }

  noRequiredChange() {
    if (this.noRequired) {
      this.noRequired = false;

      this.ngForm.get('additionalFuel').enable();
      this.ngForm.get('additionalFuel').addValidators(Validators.required);

      this.ngForm.get('estimatedDays').enable();
      this.ngForm.get('estimatedDays').addValidators(Validators.required);

      this.ngForm.get('estimatedRoofers').enable();
      this.ngForm.get('estimatedRoofers').addValidators(Validators.required);

      this.optionHotel = false;
      this.optionAirbnb = false;
      this.ngForm.get('lodingRateHotel').disable();
      this.ngForm.get('lodingRateHotel').removeValidators(Validators.required);

      this.ngForm.get('lodingRateAirbnb').disable();
      this.ngForm.get('lodingRateAirbnb').removeValidators(Validators.required);

      this.ngForm.get('travelTime').enable();
      this.ngForm.get('travelTime').addValidators(Validators.required);

    } else {
      this.noRequired = true;
      this.ngForm.get('additionalFuel').disable();
      this.ngForm.get('additionalFuel').setValue(null);
      this.ngForm.get('additionalFuel').removeValidators(Validators.required);

      this.ngForm.get('estimatedDays').disable();
      this.ngForm.get('estimatedDays').setValue(null);
      this.ngForm.get('estimatedDays').removeValidators(Validators.required);

      this.ngForm.get('estimatedRoofers').disable();
      this.ngForm.get('estimatedRoofers').setValue(null);
      this.ngForm.get('estimatedRoofers').removeValidators(Validators.required);

      this.optionHotel = false;
      this.optionAirbnb = false;
      this.ngForm.get('lodingRateHotel').disable();
      this.ngForm.get('lodingRateHotel').setValue(null);
      this.ngForm.get('lodingRateHotel').removeValidators(Validators.required);

      this.ngForm.get('lodingRateAirbnb').disable();
      this.ngForm.get('lodingRateAirbnb').setValue(null);
      this.ngForm.get('lodingRateAirbnb').removeValidators(Validators.required);

      this.ngForm.get('travelTime').disable();
      this.ngForm.get('travelTime').setValue(null);
      this.ngForm.get('travelTime').removeValidators(Validators.required);
    }
  }
}
