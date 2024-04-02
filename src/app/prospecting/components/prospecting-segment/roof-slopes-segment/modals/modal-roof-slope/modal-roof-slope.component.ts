import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbSlope } from 'src/app/models/psb-slope.model';
import { Project } from 'src/app/models/project.model';
import { DeleteComponent } from 'src/app/prospecting/modals/delete/delete.component';
import { ProjectsService } from 'src/app/services/projects.service';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal-roof-slope',
  templateUrl: './modal-roof-slope.component.html',
  styleUrls: ['./modal-roof-slope.component.scss']
})
export class ModalRoofSlopeComponent implements OnInit, OnDestroy {
  alphabet = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z'
  ];
  roofSlopeForm: FormGroup;
  project: Project;
  @Input() projectSlope: PsbSlope;
  @Input() totalSlopes: number;
  @Input() jobType: number;
  exp_regular = /^(\d{1,7})(\.\d{1,1}){0,1}$/;
  exp_regular_two_decimal = /^(\d{1,7})(\.\d{1,2}){0,1}$/;
  building: Building;
  isCheckedOSB: boolean;
  storeSubs: Subscription;

  constructor(
    private readonly formBuilder: FormBuilder,
    private store: Store<AppState>,
    private readonly modalController: ModalController,
    private projectService: ProjectsService
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find(x => x.active);
      this.building = buildings.find(x => x.active);

      //this.updateOthersMeasures();
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
    this.roofSlopeForm = this.formBuilder.group({
      name: ['', Validators.compose([Validators.required])],
      angle: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
          Validators.min(1),
          Validators.max(24)
        ])
      ],
      area: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular_two_decimal),
          Validators.min(0)
        ])
      ],
      floor: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(1),
          Validators.min(1),
          Validators.max(5)
        ])
      ]
    });

    if (this.jobType == 13 || this.jobType == 16) {
      this.roofSlopeForm.addControl(
        'layers',
        new FormControl(
          '',
          Validators.compose([
            Validators.required,
            Validators.maxLength(1),
            Validators.min(1),
            Validators.max(5)
          ])
        )
      );
      this.roofSlopeForm.addControl('cbOsbArea', new FormControl(''));
      this.roofSlopeForm.addControl(
        'osbArea',
        new FormControl({ value: '0', disabled: true })
      );
    }
    this.loadData();
  }

  loadData() {
    this.roofSlopeForm
      .get('name')
      .setValue(
        this.projectSlope
          ? this.projectSlope.name
          : 'Roof Slope ' + this.alphabet[this.totalSlopes]
      );
    this.roofSlopeForm
      .get('angle')
      .setValue(this.projectSlope ? this.projectSlope.pitch : '');
    this.roofSlopeForm
      .get('area')
      .setValue(this.projectSlope ? this.projectSlope.shingle_area : '');
    this.roofSlopeForm
      .get('floor')
      .setValue(this.projectSlope ? this.projectSlope.floor : '');

    if (this.jobType == 13 || this.jobType == 16) {
      this.roofSlopeForm
        .get('layers')
        .setValue(this.projectSlope ? this.projectSlope.layers : '');
      this.roofSlopeForm
        .get('cbOsbArea')
        .setValue(this.projectSlope?.osb_area > 0 ? true : false);
      this.roofSlopeForm
        .get('osbArea')
        .setValue(this.projectSlope ? this.projectSlope.osb_area : '');

      if (this.projectSlope && this.projectSlope.osb_area > 0) {
        this.isCheckedOSB = true;
        this.roofSlopeForm.get('osbArea').enable();
        const areaValue = this.roofSlopeForm.get('area').value;
        this.roofSlopeForm
          .get('osbArea')
          .setValidators(
            Validators.compose([
              Validators.required,
              Validators.pattern(this.exp_regular),
              Validators.min(0.1),
              Validators.max(areaValue)
            ])
          );
      } else {
        this.isCheckedOSB = false;
        this.roofSlopeForm.get('osbArea').disable();
      }
    }
  }

  /*updateOthersMeasures() {
    let counter = this.building?.psb_measure?.psb_verifieds.length;
    for (let index = 0; index < counter; index++) {
      let element = this.building?.psb_measure?.psb_verifieds[index];
      if (element.id_resource == 9) {
        if (element.is_verified) {
          element.is_verified = false;
        }
      }
    }
  }*/

  confirm() {
    if (this.projectSlope) {
      this.updateRoofSlope();
    } else {
      this.saveRoofSlope();
    }
  }

  updateRoofSlope() {
    const projectSlopeUpdated = { ...this.projectSlope, isModified: true };
    projectSlopeUpdated.name = this.roofSlopeForm.get('name').value;
    projectSlopeUpdated.pitch = parseFloat(this.roofSlopeForm.get('angle').value);
    projectSlopeUpdated.shingle_area = parseFloat(this.roofSlopeForm.get('area').value);
    projectSlopeUpdated.floor = parseInt(this.roofSlopeForm.get('floor').value);

    if (this.jobType == 13 || this.jobType == 16) {
      projectSlopeUpdated.layers = parseInt(this.roofSlopeForm.get('layers').value);
      projectSlopeUpdated.osb_area =
        this.roofSlopeForm.get('osbArea').value == '' ||
          isNaN(this.roofSlopeForm.get('osbArea').value)
          ? null
          : parseFloat(this.roofSlopeForm.get('osbArea').value);
    }

    const projectShingleSlopesUpdated = this.building.psb_measure.psb_slopes.map(x => {
      if (x.id == projectSlopeUpdated.id) {
        return projectSlopeUpdated;
      } else {
        return x;
      }
    });

    this.validateRange(projectShingleSlopesUpdated);
  }

  saveRoofSlope() {
    let hasLayers = 0;
    if (this.jobType == 13 || this.jobType == 16) {
      hasLayers = parseInt(this.roofSlopeForm.get('layers').value);
    }
    const slope: PsbSlope = {
      id: uuidv4(),
      name: this.roofSlopeForm.get('name').value,
      pitch: parseFloat(this.roofSlopeForm.get('angle').value),
      shingle_area: parseFloat(this.roofSlopeForm.get('area').value),
      floor: parseInt(this.roofSlopeForm.get('floor').value),
      layers: hasLayers,
      osb_area: null,
      id_psb_measure: this.building.psb_measure.id,
      deletedAt: null,
      isModified: true
    };

    if (this.jobType == 13) {
      slope.layers = parseInt(this.roofSlopeForm.get('layers').value);
      slope.osb_area =
        this.roofSlopeForm.get('osbArea').value == ''
          ? null
          : parseFloat(this.roofSlopeForm.get('osbArea').value);
    }

    const psb_slopes = this.building.psb_measure.psb_slopes
      ? [...this.building.psb_measure.psb_slopes]
      : [];

    psb_slopes.push(slope);

    this.validateRange(psb_slopes);
  }

  validateRange(psb_slopes: PsbSlope[]) {
    const validPitchAngleLowSlope = this.validatePitchAngleRange(2, 3.9, psb_slopes);
    const validPitchAngleSteepSlope = this.validatePitchAngleRange(4, 24, psb_slopes);
    const validPitchAngleFlatRoof = this.validatePitchAngleRange(0, 1.9, psb_slopes);

    let psbMeasure: PsbMeasures = {
      ...this.building.psb_measure,
      psb_slopes
    };

    let options: string[] = [];
    if (validPitchAngleLowSlope) {
      if (!this.hasInwSelection()) {
        psbMeasure = this.removeSelectionCheck(psbMeasure, 12, false);
      }
    } else {
      psbMeasure = this.removeSelectionCheck(psbMeasure, 15, false);

      psbMeasure = {
        ...psbMeasure,
        eves_starters_lf_low_slope: 0,
        rakes_lf_low_steep_slope: 0,
        valleys_lf_low_slope: 0
      };
      options.push('low slope');

      if (this.notRequiredInw()) {
        psbMeasure = this.removeSelectionInW(psbMeasure);
      }
    }

    if (!validPitchAngleSteepSlope) {
      psbMeasure = this.removeSelectionCheck(psbMeasure, 16, false);

      psbMeasure = {
        ...psbMeasure,
        eves_starters_lf_steep_slope: 0,
        rakes_lf_steep_slope: 0,
        valleys_lf_steep_slope: 0
      };
      options.push('step slope');
    }

    if (!validPitchAngleFlatRoof) {
      psbMeasure = this.removeSelectionCheck(psbMeasure, 14, false);

      psbMeasure = {
        ...psbMeasure,
        eves_rakes_lf_flat_roof: 0
      };
      options.push('flat foof');
    }

    let message =
      `You are about to delete  all [${options.toString()}] ` +
      `but you have some measures in this type of slope and will also be deleted. ` +
      `Are you sure to continue?`;

    if (
      (!validPitchAngleLowSlope &&
        this.building?.psb_measure?.eves_starters_lf_low_slope > 0) ||
      (!validPitchAngleSteepSlope &&
        this.building?.psb_measure?.eves_starters_lf_steep_slope > 0) ||
      (!validPitchAngleFlatRoof &&
        this.building?.psb_measure?.eves_rakes_lf_flat_roof > 0)
    ) {
      this.openModalDelete(message, psbMeasure);
    } else {
      this.modalController.dismiss({
        psbMeasure
      });
    }
  }

  hasInwSelection() {
    return this.building.psb_measure.psb_selected_materials.some(x => x.id_material_category == 30 && !x.deletedAt);
  }

  removeSelectionCheck(psbMeasure: PsbMeasures, idResource: number, isVerified: boolean) {
    const psb_verifieds = psbMeasure?.psb_verifieds?.map(v => {
      if (v.id_resource == idResource) {
        return { ...v, is_verified: isVerified };
      } else {
        return { ...v };
      }
    });

    psbMeasure = {
      ...psbMeasure,
      psb_verifieds
    };

    return psbMeasure;
  }

  notRequiredInw() {
    return this.building.id_job_type == 14 || this.building.psb_measure.id_inwshield_rows == 3;
  }

  removeSelectionInW(psb_measure: any) {
    const psb_selected_materials = psb_measure?.psb_selected_materials?.map(v => {
      if (v.id_material_category == 30) {
        return { ...v, deletedAt: new Date() };
      } else {
        return { ...v };
      }
    });

    return { ...psb_measure, psb_selected_materials };

  }

  async openModalDelete(message: string, psbMeasure: PsbMeasures) {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete-border',
      componentProps: {
        message
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      this.modalController.dismiss({
        psbMeasure
      });
    } else {
      this.loadData();
    }
  }

  allowNumbers(event: any, name = null) {
    const charCode = event.which ? event.which : event.keyCode;
    if (name && charCode == 46) {
      let txt = this.roofSlopeForm.get(name).value;
      if (!(txt.indexOf('.') > -1)) {
        return true;
      }
    }
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true; //es permitido
  }

  prueba() {
    const area = this.roofSlopeForm.get('area').value;
    let osbArea = this.roofSlopeForm.get('osbArea').value;

    if (area) {
      if (parseInt(area) < osbArea) {
        osbArea = area;
        this.roofSlopeForm.get('osbArea').setValue(osbArea);
      }
    }
  }

  onClickOSB() {
    this.isCheckedOSB = this.roofSlopeForm.get('cbOsbArea').value;
    if (this.isCheckedOSB) {
      this.roofSlopeForm.get('osbArea').enable();
      const areaValue = this.roofSlopeForm.get('area').value;

      this.roofSlopeForm.get('osbArea').setValue(areaValue);
      this.roofSlopeForm
        .get('osbArea')
        .setValidators(
          Validators.compose([
            Validators.required,
            Validators.pattern(this.exp_regular),
            Validators.min(0.1),
            Validators.max(areaValue)
          ])
        );
    } else {
      this.roofSlopeForm.get('osbArea').disable();
      this.roofSlopeForm.get('osbArea').setValue('');
      this.roofSlopeForm.get('osbArea').setValidators([]);
    }
  }

  validatePitchAngleRange(startValue: number, endValue: number, psb_slopes: PsbSlope[]) {
    let valid = false;
    psb_slopes.forEach(element => {
      if (
        element.pitch >= startValue &&
        element.pitch <= endValue &&
        element.deletedAt == null
      ) {
        valid = true;
      }
    });
    return valid;
  }
}
