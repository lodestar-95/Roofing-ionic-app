import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { v4 as uuidv4 } from 'uuid';
import { ProjectsService } from 'src/app/services/projects.service';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PsbUpgradesVent } from 'src/app/models/psb_upgrades_vents.model';

@Component({
  selector: 'app-upgrades',
  templateUrl: './upgrades.component.html',
  styleUrls: ['./upgrades.component.scss']
})
export class UpgradesComponent implements OnInit, OnDestroy {
  project: Project;
  building: Building;
  buildings: Building[];
  solarPowerVent: number;
  powerVent: number;
  storeSubs: Subscription;
  ngForm: FormGroup;
  noRequired = false;
  advanceVentilationNotReqId = 23;

  constructor(
    private readonly formBuilder: FormBuilder,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private modalController: ModalController
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project || this.project?.versions?.length == 0) {
        return;
      }
      const { buildings } = this.project.versions.find(x => x.active);
      this.buildings = buildings;
      this.building = buildings.find(x => x.active);

      if (!this.building) {
        return;
      }
      this.loadDataVents();
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

  loadDataVents() {
    this.solarPowerVent = this.building.psb_measure.vent_solar_power_vent_pc;
    this.powerVent = this.building.psb_measure.vent_power_vent_pc;
  }

  initForm() {
    this.ngForm = this.formBuilder.group({
      ridgeVents: [{ value: '', disabled: true }],
      atticReplace: [
        '',
        Validators.compose([Validators.required, Validators.min(0), Validators.max(999)])
      ],
      atticRemove: [
        '',
        Validators.compose([Validators.required, Validators.min(0), Validators.max(999)])
      ],
      atticCutin: [
        '',
        Validators.compose([Validators.required, Validators.min(0), Validators.max(999)])
      ],
      solarPVDel: [
        '',
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(this.solarPowerVent)
        ])
      ],
      pVDel: [
        '',
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(this.powerVent)
        ])
      ],
      solarPVNew: [
        '',
        Validators.compose([Validators.required, Validators.min(0), Validators.max(99)])
      ],
      pVNew: [
        '',
        Validators.compose([Validators.required, Validators.min(0), Validators.max(99)])
      ]
    });
    if (this.building.psb_measure.psb_upgrades_vent) {
      this.loadData();
    } else {
      this.preloadDataVenting();
    }
  }

  loadData() {
    this.ngForm
      .get('ridgeVents')
      .setValue(this.building.psb_measure.psb_upgrades_vent.ridgevents_lf);
    this.ngForm
      .get('atticReplace')
      .setValue(this.building.psb_measure.psb_upgrades_vent.attic_replace_pc);
    this.ngForm
      .get('atticRemove')
      .setValue(this.building.psb_measure.psb_upgrades_vent.attic_remove_pc);
    this.ngForm
      .get('atticCutin')
      .setValue(this.building.psb_measure.psb_upgrades_vent.attic_cutin_pc);
    this.ngForm
      .get('solarPVDel')
      .setValue(this.building.psb_measure.psb_upgrades_vent.solar_pv_del_pc);
    this.ngForm
      .get('pVDel')
      .setValue(this.building.psb_measure.psb_upgrades_vent.pv_del_pc);
    this.ngForm
      .get('solarPVNew')
      .setValue(this.building.psb_measure.psb_upgrades_vent.solar_pv_new_pc);
    this.ngForm
      .get('pVNew')
      .setValue(this.building.psb_measure.psb_upgrades_vent.pv_new_pc);

    this.validateFrmData();

    if (this.building?.psb_measure?.psb_no_requireds?.find(x => x.id_resource == this.advanceVentilationNotReqId)?.no_required) {
      this.noRequired = false;
      this.noRequiredChange();
    }
  }

  preloadDataVenting() {
    this.ngForm.get('ridgeVents').setValue(this.building.psb_measure.ridge_lf);
    this.ngForm
      .get('solarPVDel')
      .setValue(this.building.psb_measure.vent_solar_power_vent_pc);
    this.ngForm.get('pVDel').setValue(this.building.psb_measure.vent_power_vent_pc);
    this.ngForm
      .get('atticRemove')
      .setValue(
        this.building.psb_measure.vent_metal_artict_replace_pc +
        this.building.psb_measure.vent_metal_artict_remove_pc
      );

    this.validateFrmData();
  }

  validateFrmData() {
    if (!this.solarPowerVent) {
      this.ngForm.get('solarPVDel').disable();
    }
    if (!this.powerVent) {
      this.ngForm.get('pVDel').disable();
    }
  }

  confirm() {
    let psb_upgrades_vent: PsbUpgradesVent = null;
    const psb_no_requireds = this.getNotRequireds();

    if (this.building.psb_measure.psb_upgrades_vent) {
      psb_upgrades_vent = {
        ...this.building.psb_measure.psb_upgrades_vent,
        id_psb_measure: this.building.psb_measure.id,
        ridgevents_lf: this.ngForm.get('ridgeVents').value,
        attic_replace_pc: this.ngForm.get('atticReplace').value,
        attic_remove_pc: this.ngForm.get('atticRemove').value,
        attic_cutin_pc: this.ngForm.get('atticCutin').value,
        solar_pv_del_pc: this.ngForm.get('solarPVDel').value,
        pv_del_pc: this.ngForm.get('pVDel').value,
        solar_pv_new_pc: this.ngForm.get('solarPVNew').value,
        pv_new_pc: this.ngForm.get('pVNew').value,
        solar_pv_keep_pc:
          this.building.psb_measure.vent_solar_power_vent_pc -
          this.ngForm.get('solarPVDel').value,
        pv_keep_pc:
          this.building.psb_measure.vent_power_vent_pc - this.ngForm.get('pVDel').value,
        isModified: true
      };
    } else {
      psb_upgrades_vent = {
        id: uuidv4(),
        id_psb_measure: this.building.psb_measure.id,
        ridgevents_lf: this.ngForm.get('ridgeVents').value,
        attic_replace_pc: this.ngForm.get('atticReplace').value,
        attic_remove_pc: this.ngForm.get('atticRemove').value,
        attic_cutin_pc: this.ngForm.get('atticCutin').value,
        solar_pv_del_pc: this.ngForm.get('solarPVDel').value,
        pv_del_pc: this.ngForm.get('pVDel').value,
        solar_pv_new_pc: this.ngForm.get('solarPVNew').value,
        pv_new_pc: this.ngForm.get('pVNew').value,
        solar_pv_keep_pc:
          this.building.psb_measure.vent_solar_power_vent_pc -
          this.ngForm.get('solarPVDel').value,
        pv_keep_pc:
          this.building.psb_measure.vent_power_vent_pc - this.ngForm.get('pVDel').value,
        isModified: true
      };
    }
    const psbMeasuresUpdated: PsbMeasures = {
      ...this.building.psb_measure,
      psb_upgrades_vent: psb_upgrades_vent,
      psb_no_requireds: psb_no_requireds
    };
    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    this.modalController.dismiss();
  }

  noRequiredChange() {
    if (this.noRequired) {
      this.noRequired = false;

      this.ngForm.get('atticReplace').enable();
      this.ngForm.get('atticReplace').addValidators(Validators.required);

      this.ngForm.get('atticRemove').enable();
      this.ngForm.get('atticRemove').addValidators(Validators.required);

      this.ngForm.get('atticCutin').enable();
      this.ngForm.get('atticCutin').addValidators(Validators.required);

      this.ngForm.get('solarPVDel').enable();
      this.ngForm.get('solarPVDel').addValidators(Validators.required);

      this.ngForm.get('pVDel').enable();
      this.ngForm.get('pVDel').addValidators(Validators.required);

      this.ngForm.get('solarPVNew').enable();
      this.ngForm.get('solarPVNew').addValidators(Validators.required);

      this.ngForm.get('pVNew').enable();
      this.ngForm.get('pVNew').addValidators(Validators.required);

      this.validateFrmData();
    } else {
      this.noRequired = true;

      this.ngForm.get('atticReplace').disable();
      this.ngForm.get('atticReplace').setValue(0);
      this.ngForm.get('atticReplace').removeValidators(Validators.required);

      this.ngForm.get('atticRemove').disable();
      this.ngForm.get('atticRemove').setValue(0);
      this.ngForm.get('atticRemove').removeValidators(Validators.required);

      this.ngForm.get('atticCutin').disable();
      this.ngForm.get('atticCutin').setValue(0);
      this.ngForm.get('atticCutin').removeValidators(Validators.required);

      this.ngForm.get('solarPVDel').disable();
      this.ngForm.get('solarPVDel').setValue(0);
      this.ngForm.get('solarPVDel').removeValidators(Validators.required);

      this.ngForm.get('pVDel').disable();
      this.ngForm.get('pVDel').setValue(0);
      this.ngForm.get('pVDel').removeValidators(Validators.required);

      this.ngForm.get('solarPVNew').disable();
      this.ngForm.get('solarPVNew').setValue(0);
      this.ngForm.get('solarPVNew').removeValidators(Validators.required);

      this.ngForm.get('pVNew').disable();
      this.ngForm.get('pVNew').setValue(0);
      this.ngForm.get('pVNew').removeValidators(Validators.required);
    }
  }

  private getNotRequireds() {
    let psb_no_requireds = this.building?.psb_measure?.psb_no_requireds ?? [];
    const indexNotRequired = psb_no_requireds.findIndex(x => x.id_resource == this.advanceVentilationNotReqId) ?? -1;

    if (indexNotRequired == -1 && this.noRequired) {
      psb_no_requireds = [...psb_no_requireds, { id: uuidv4(), id_resource: this.advanceVentilationNotReqId, id_psb_measure: this.building.psb_measure.id, isModified: true, no_required: this.noRequired }];
    } else {
      psb_no_requireds = psb_no_requireds.map(x => {
        if (x.id_resource == this.advanceVentilationNotReqId) {
          return { ...x, no_required: this.noRequired };
        } else {
          return x;
        }
      });
    }
    return psb_no_requireds;
  }
}
