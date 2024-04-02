import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { ModalController, PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Generic } from 'src/app/models/generic.model';
import { Project } from 'src/app/models/project.model';
import { PsbCrickets } from 'src/app/models/psb_crickets.model';
import { WallMaterial } from 'src/app/models/wall-material.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { PopoverMultipleOptionsComponent } from '../../components/popover-multiple-options/popover-multiple-options.component';
import { PopoverOptionsListComponent } from '../../components/popover-options-list/popover-options-list.component';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { AddNoteComponent } from '../../components/add-note/add-note.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crickets',
  templateUrl: './crickets.component.html',
  styleUrls: ['./crickets.component.scss'],
})
export class CricketsComponent implements OnInit, OnDestroy {
  @Input() cricket: PsbCrickets;
  @Input() totalCrickets: number;
  project: Project;
  building: Building;
  buildings: Building[];
  psbMeasures: PsbMeasures;
  wallMaterials: WallMaterial[];
  genericSideWallMaterials: Generic[] = [];
  genericEndWallMaterials: Generic[] = [];
  genericSideWallSpecs: Generic[] = [];
  genericEndWallSpecs: Generic[] = [];

  exp_regular_one_decimal = /^(\d{1,7})(\.\d{1,1}){0,1}$/;
  exp_regular = /^(\d{1,7})(\.\d{1,2}){0,1}$/;
  ngForm: FormGroup;
  optionSecondValley: boolean;
  optionSideWall: boolean;
  optionEndWallOnCricket: boolean;
  sideWallMaterial: Generic;
  sideWallSpecsDesc: string;
  storeSubs: Subscription;
  endWallMaterial: Generic;
  endWallSpecsDesc: string;

  constructor(private readonly formBuilder: FormBuilder,
    private popoverController: PopoverController,
    private catalogsService: CatalogsService,
    private projectService: ProjectsService,
    private readonly modalCtrl: ModalController,
    private store: Store<AppState>) {

    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      const { buildings } = this.project.versions.find(
        (x) => x.active
      );
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
      if (this.building) {
        this.psbMeasures = this.building.psb_measure;
      }
    });
  }

  ngOnInit() {
    this.initForm();
    this.getWallMaterials();
    this.getSideWallSpecs();
    this.getEndWallSpecs();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  getSideWallSpecs() {
    this.genericSideWallSpecs = [];
    this.genericSideWallSpecs.push(
      { id: 1, option: 'Cut sidding on side wall', selected: false, disabled: true },
      { id: 2, option: 'Install new reglet', selected: false, disabled: true },
      { id: 3, option: 'Will have a leak exclusion', selected: false, disabled: true }
    );
  }

  getEndWallSpecs() {
    this.genericEndWallSpecs = [];
    this.genericEndWallSpecs.push(
      { id: 1, option: 'Cut sidding on end wall', selected: false, disabled: true },
      { id: 2, option: 'Install new reglet', selected: false, disabled: true },
      { id: 3, option: 'Will have a leak exclusion', selected: false, disabled: true }
    );
  }

  getWallMaterials() {
    this.catalogsService.getWallMaterials().then((result) => {
      this.wallMaterials = [...result.data];
      this.genericSideWallMaterials = [];
      this.genericEndWallMaterials = [];
      result.data.forEach(element => {
        this.genericEndWallMaterials.push({ id: element.id, option: element.wall_material, selected: false });
        this.genericSideWallMaterials.push({ id: element.id, option: element.wall_material, selected: false });
      });
      this.loadData();

    });
  }

  initForm() {
    this.ngForm = this.formBuilder.group({
      cricket: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(30),
        ]),
      ],
      area: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
        ]),
      ],
      pitch: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular_one_decimal),
          Validators.min(1),
          Validators.max(24),
        ]),
      ],
      firstValley: [
        '',
        Validators.compose([
          Validators.required,
          Validators.min(0),
          Validators.max(9999),
        ]),
      ],
      secondValley: [''],
      sideWall: [''],
      idSideWallMaterial: [''],
      endWall: [''],
      idEndWallMaterial: [''],
      adittionalCost: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
        ]),
      ],
      note: [''],
    });
  }

  loadData() {
    this.ngForm
      .get('cricket')
      .setValue(
        this.cricket
          ? this.cricket.cricket
          : 'Cricket ' + (this.totalCrickets + 1));
    this.ngForm
      .get('area')
      .setValue(this.cricket ? this.cricket.area : '');
    this.ngForm
      .get('pitch')
      .setValue(this.cricket ? this.cricket.pitch : '');
    this.ngForm
      .get('firstValley')
      .setValue(this.cricket ? this.cricket.first_valley_lf : '');
    this.ngForm
      .get('secondValley')
      .setValue(this.cricket ? this.cricket.second_valley_lf : '');
    this.ngForm
      .get('sideWall')
      .setValue(this.cricket ? this.cricket.sidewall_lf : '');
    this.ngForm
      .get('idSideWallMaterial')
      .setValue(this.cricket ? this.cricket.id_wall_material_sw : '');
    this.ngForm
      .get('endWall')
      .setValue(this.cricket ? this.cricket.endwall_lf : '');
    this.ngForm
      .get('idEndWallMaterial')
      .setValue(this.cricket ? this.cricket.id_wall_material_ew : '');
    this.ngForm
      .get('adittionalCost')
      .setValue(this.cricket ? this.cricket.aditional_cost : '');
    this.ngForm
      .get('note')
      .setValue(this.cricket ? this.cricket.note : '');

    if (this.cricket) {//Si existe crickets
      if (this.cricket.second_valley_lf) {
        this.optionSecondValley = true;
      } else if (this.cricket.sidewall_lf) {
        this.optionSideWall = true;
        this.genericSideWallMaterials.forEach((x) => {
          if (x.id == this.cricket.id_wall_material_sw) {
            x.selected = true;
            this.sideWallMaterial = x;
            this.validateOptionsSideWallSpecs(x, 1);
            let options = [];
            if (this.cricket.is_cut_sw)//1
              options.push(this.findElementSideWallSpecs(1));
            if (this.cricket.is_ridglet_sw)//2
              options.push(this.findElementSideWallSpecs(2));
            if (this.cricket.is_leak_sw)//3
              options.push(this.findElementSideWallSpecs(3));
            this.sideWallSpecsDesc = options.toString();
            if (this.cricket.id_wall_material_sw == 3 && !this.cricket.is_leak_sw)
              this.sideWallSpecsDesc += ', Remove and reinstall stones on chimney is required';
          }
        });
      }

      if (this.cricket.endwall_lf) {
        this.optionEndWallOnCricket = true;
        this.genericEndWallMaterials.forEach((x) => {
          if (x.id == this.cricket.id_wall_material_ew) {
            x.selected = true;
            this.endWallMaterial = x;
            this.validateOptionsSideWallSpecs(x, 2);
            let options = [];
            if (this.cricket.is_cut_ew)//1
              options.push(this.findElementEndWallSpecs(1));
            if (this.cricket.is_ridglet_ew)//2
              options.push(this.findElementEndWallSpecs(2));
            if (this.cricket.is_leak_ew)//3
              options.push(this.findElementEndWallSpecs(3));
            this.endWallSpecsDesc = options.toString();
            if (this.cricket.id_wall_material_ew == 3 && !this.cricket.is_leak_ew)
            this.endWallSpecsDesc += ', Remove and reinstall stones on chimney is required';
          }
        });

      }
    }
  }

  optionSelected(option: number) {
    if (option == 1) {
      this.optionSecondValley = true;
      this.optionSideWall = false;
      this.ngForm.get('secondValley').setValue(this.ngForm.get('firstValley').value);
      this.ngForm.get('secondValley').addValidators(Validators.required);

      this.ngForm.get('sideWall').setValue('');
      this.ngForm.get('sideWall').removeValidators(Validators.required);
      this.ngForm.get('sideWall').markAsDirty();
      this.ngForm.get('idSideWallMaterial').setValue(null);
      this.ngForm.get('idSideWallMaterial').removeValidators(Validators.required);
      this.ngForm.get('idSideWallMaterial').markAsDirty();
      this.sideWallMaterial = null;
      this.sideWallSpecsDesc = null;

    } else if (option == 2) {
      this.optionSecondValley = false;
      this.optionSideWall = true;
      this.ngForm.get('secondValley').setValue('');
      this.ngForm.get('secondValley').removeValidators(Validators.required);

      this.ngForm.get('sideWall').addValidators(Validators.required);
      this.ngForm.get('idSideWallMaterial').addValidators(Validators.required);
      this.sideWallSpecsDesc = null;
    }
    this.ngForm.get('secondValley').updateValueAndValidity();
    this.ngForm.get('sideWall').updateValueAndValidity();
    this.ngForm.get('idSideWallMaterial').updateValueAndValidity();
  }

  optionSelectedEndWall() {
    this.optionEndWallOnCricket = !this.optionEndWallOnCricket;
    if (this.optionEndWallOnCricket) {
      this.ngForm.get('endWall').addValidators(Validators.required);
      this.ngForm.get('idEndWallMaterial').addValidators(Validators.required);
    } else {
      this.ngForm.get('endWall').removeValidators(Validators.required);
      this.ngForm.get('endWall').setValue('');
      this.ngForm.get('endWall').markAsDirty();
      this.endWallMaterial = null;
      this.ngForm.get('idEndWallMaterial').removeValidators(Validators.required);
      this.ngForm.get('idEndWallMaterial').setValue(null);
      this.ngForm.get('idEndWallMaterial').markAsDirty();
      this.endWallSpecsDesc = null;
    }
    this.ngForm.get('endWall').updateValueAndValidity();
    this.ngForm.get('idEndWallMaterial').updateValueAndValidity();
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

  async openPopoverWallMaterials(event: any, option: number) {
    const modal = await this.popoverController.create({
      component: PopoverOptionsListComponent,
      event,
      side: 'bottom',
      componentProps: {
        options: option == 1 ? this.genericSideWallMaterials : this.genericEndWallMaterials,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    if (option == 1) {
      this.sideWallMaterial = data;
      this.ngForm.get('idSideWallMaterial').setValue(data.id);
      this.sideWallSpecsDesc = null;
      this.validateOptionsSideWallSpecs(data, option);
    } else {
      this.endWallMaterial = data;
      this.ngForm.get('idEndWallMaterial').setValue(data.id);
      this.endWallSpecsDesc = null;
      this.validateOptionsSideWallSpecs(data, option);
      if (data.id == 5) {
        this.endWallSpecsDesc = " ";
        this.ngForm.get('idEndWallMaterial').markAsDirty();
      }
    }
  }

  /**
   *
   * SideWallSpecs
   */
  validateOptionsSideWallSpecs(data, option) {
    if (option == 1)
      this.getSideWallSpecs();
    else
      this.getEndWallSpecs();
    if (data.option === 'sidding') {
      if (option == 1)
        this.genericSideWallSpecs = this.enabledOptionSideWallSpecs(1);
      else
        this.genericEndWallSpecs = this.enabledOptionEndWallSpecs(1);
    }
    if (data.option === 'stone' || data.option === 'stucko' || data.option === 'brick') {
      if (option == 1)
        this.genericSideWallSpecs = this.enabledOptionSideWallSpecs(2);
      else
        this.genericEndWallSpecs = this.enabledOptionEndWallSpecs(2);
    }
    if (data.option === 'stone') {
      if (option == 1)
        this.genericSideWallSpecs = this.enabledOptionSideWallSpecs(3);
      else
        this.genericEndWallSpecs = this.enabledOptionEndWallSpecs(3);
    }
  }

  enabledOptionSideWallSpecs(id: number) {
    const sideWallSpecsUpdated = this.genericSideWallSpecs.map((x) => {
      if (x.id == id) {
        return { ...x, disabled: false }
      } else {
        return { ...x }
      }
    });
    return sideWallSpecsUpdated
  }

  enabledOptionEndWallSpecs(id: number) {
    const endWallSpecsUpdated = this.genericEndWallSpecs.map((x) => {
      if (x.id == id) {
        return { ...x, disabled: false }
      } else {
        return { ...x }
      }
    });
    return endWallSpecsUpdated
  }

  async openNote(ev: any) {
    const modal = await this.popoverController.create({
      component: AddNoteComponent,
      cssClass: 'add-note',
      event: ev,
      side: 'bottom',
      componentProps: {
        note: this.ngForm.get('note').value,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    this.ngForm.get('note').setValue(data);
    this.ngForm.get('note').markAsDirty();
  }

  async openPopoverWallSpecs(ev: any, option) {
    const modal = await this.popoverController.create({
      component: PopoverMultipleOptionsComponent,
      cssClass: 'screen-width-400',
      event: ev,
      side: 'bottom',
      componentProps: {
        options: option === 1 ? this.genericSideWallSpecs : this.genericEndWallSpecs,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    let options = [];
    data.forEach(element => {
      if (element.selected)
        options.push(element.option);
    });

    const stoneId = 3;
    if (option === 1) {
      this.ngForm.get('idSideWallMaterial').setValue(this.ngForm.get('idSideWallMaterial').value);
      this.ngForm.get('idSideWallMaterial').markAsDirty();

      if (this.ngForm.get('idSideWallMaterial').value == stoneId && !data.find(x => x.id == 3).selected) {
        this.sideWallSpecsDesc = options.toString() + ', Remove and reinstall stones on chimney is required';
      }
      else {
        this.sideWallSpecsDesc = options.toString();
      }
    } else {
      this.ngForm.get('idEndWallMaterial').setValue(this.ngForm.get('idEndWallMaterial').value);
      this.ngForm.get('idEndWallMaterial').markAsDirty();

      if (this.ngForm.get('idEndWallMaterial').value == stoneId && !data.find(x => x.id == 3).selected) {
        this.endWallSpecsDesc = options.toString() + ', Remove and reinstall stones on chimney is required';
      }
      else {
        this.endWallSpecsDesc = options.toString();
      }
    }
  }

  confirm() {
    if (this.cricket) {
      this.update();
    } else {
      this.save();
    }
  }

  update() {

    const cricketUpdated = { ...this.cricket };
    cricketUpdated.cricket = this.ngForm.get('cricket').value;
    cricketUpdated.area = parseFloat(this.ngForm.get('area').value);
    cricketUpdated.pitch = parseFloat(this.ngForm.get('pitch').value);
    cricketUpdated.first_valley_lf = parseInt(this.ngForm.get('firstValley').value);
    cricketUpdated.aditional_cost = parseFloat(this.ngForm.get('adittionalCost').value);
    cricketUpdated.note = this.ngForm.get('note').value;
    cricketUpdated.isModified = true;

    if (this.optionSecondValley) {
      cricketUpdated.second_valley_lf = parseInt(this.ngForm.get('secondValley').value);
      cricketUpdated.sidewall_lf = null;
      cricketUpdated.id_wall_material_sw = null;
      cricketUpdated.is_cut_sw = false;
      cricketUpdated.is_ridglet_sw = false;
      cricketUpdated.is_leak_sw = false;
    } else if (this.optionSideWall) {
      cricketUpdated.second_valley_lf = null;
      cricketUpdated.sidewall_lf = parseInt(this.ngForm.get('sideWall').value);
      cricketUpdated.id_wall_material_sw = parseInt(this.ngForm.get('idSideWallMaterial').value);
      cricketUpdated.is_cut_sw = this.findSideWallSpecs(1);
      cricketUpdated.is_ridglet_sw = this.findSideWallSpecs(2);
      cricketUpdated.is_leak_sw = this.findSideWallSpecs(3);
    }

    if (this.optionEndWallOnCricket) {
      cricketUpdated.endwall_lf = parseInt(this.ngForm.get('endWall').value);
      cricketUpdated.id_wall_material_ew = parseInt(this.ngForm.get('idEndWallMaterial').value);
      cricketUpdated.is_cut_ew = this.findEndWallSpecs(1);
      cricketUpdated.is_ridglet_ew = this.findEndWallSpecs(2);
      cricketUpdated.is_leak_ew = this.findEndWallSpecs(3);
    } else {
      cricketUpdated.endwall_lf = null;
      cricketUpdated.id_wall_material_ew = null;
      cricketUpdated.is_cut_ew = false;
      cricketUpdated.is_ridglet_ew = false;
      cricketUpdated.is_leak_ew = false;
    }

    const psb_crickets_updated = this.psbMeasures.psb_crickets.map((x) => {
      if (x.id == cricketUpdated.id) {
        return cricketUpdated;
      } else {
        return x;
      }
    });

    const psbMeasuresUpdated = {
      ...this.psbMeasures,
      psb_crickets: psb_crickets_updated
    };

    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    this.modalCtrl.dismiss();


  }

  save() {
    let cricket: PsbCrickets = {
      id: uuidv4(),
      cricket: this.ngForm.get('cricket').value,
      area: parseFloat(this.ngForm.get('area').value),
      pitch: parseFloat(this.ngForm.get('pitch').value),
      first_valley_lf: parseInt(this.ngForm.get('firstValley').value),
      aditional_cost: parseFloat(this.ngForm.get('adittionalCost').value),
      note: this.ngForm.get('note').value,
      id_psb_measure: parseInt(this.building.psb_measure.id),
      isModified: true,
    }

    if (this.optionSecondValley) {
      cricket.second_valley_lf = parseInt(this.ngForm.get('secondValley').value);
    } else if (this.optionSideWall) {
      cricket.sidewall_lf = parseInt(this.ngForm.get('sideWall').value);
      cricket.id_wall_material_sw = parseInt(this.ngForm.get('idSideWallMaterial').value);
      cricket.is_cut_sw = this.findSideWallSpecs(1);
      cricket.is_ridglet_sw = this.findSideWallSpecs(2);
      cricket.is_leak_sw = this.findSideWallSpecs(3);
    }

    if (this.optionEndWallOnCricket) {
      cricket.endwall_lf = parseInt(this.ngForm.get('endWall').value);
      cricket.id_wall_material_ew = parseInt(this.ngForm.get('idEndWallMaterial').value);
      cricket.is_cut_ew = this.findEndWallSpecs(1);
      cricket.is_ridglet_ew = this.findEndWallSpecs(2);
      cricket.is_leak_ew = this.findEndWallSpecs(3);
    }

    const psb_crickets_updated = this.psbMeasures.psb_crickets ? [...this.psbMeasures.psb_crickets] : [];
    psb_crickets_updated.push(cricket);

    const psbMeasuresUpdated = {
      ...this.psbMeasures,
      psb_crickets: psb_crickets_updated
    };
    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    this.modalCtrl.dismiss();

  }

  findSideWallSpecs(id: number): boolean {
    const data = this.genericSideWallSpecs.find((x) => x.selected && x.id == id);
    return data ? true : false;
  }

  findElementSideWallSpecs(id: number) {
    for (let x = 0; x < this.genericSideWallSpecs.length; x++) {
      if (this.genericSideWallSpecs[x].id == id) {
        this.genericSideWallSpecs[x].selected = true;
        return this.genericSideWallSpecs[x].option
      }
    }
    return null;
  }

  findEndWallSpecs(id: number): boolean {
    const data = this.genericEndWallSpecs.find((x) => x.selected && x.id == id);
    return data ? true : false;
  }

  findElementEndWallSpecs(id: number) {
    for (let x = 0; x < this.genericEndWallSpecs.length; x++) {
      if (this.genericEndWallSpecs[x].id == id) {
        this.genericEndWallSpecs[x].selected = true;
        return this.genericEndWallSpecs[x].option
      }
    }
    return null;

  }



}
