import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { AppConfig } from 'src/app/config/app';
import { Building } from 'src/app/models/building.model';
import { Generic } from 'src/app/models/generic.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbChimney } from 'src/app/models/psb_chimney.model';
import { WallMaterial } from 'src/app/models/wall-material.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { PopoverOptionsListComponent } from '../../components/popover-options-list/popover-options-list.component';
import { v4 as uuidv4 } from 'uuid';
import { AddNoteComponent } from '../../components/add-note/add-note.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chimneys',
  templateUrl: './chimneys.component.html',
  styleUrls: ['./chimneys.component.scss'],
})
export class ChimneysComponent implements OnInit, OnDestroy {
  @Input() chimney: PsbChimney;
  @Input() totalChimneys: number;
  needLeakExclusion: boolean;
  needEndWall: boolean;
  wallMaterials: WallMaterial[];
  genericWallMaterials: Generic[] = [];
  wallMaterial: Generic;
  fractionsCatalogWidth: Generic[] = [];
  fractionsCatalogLength: Generic[] = [];
  fractionsCatalogHeight: Generic[] = [];
  pitchCalalog: Generic[] = [];
  project: Project;
  building: Building;
  buildings: Building[];
  psbMeasures: PsbMeasures;
  exp_regular_one_decimal = /^(\d{1,7})(\.\d{1,1}){0,1}$/;
  exp_regular = /^(\d{1,7})(\.\d{2,2}){0,1}$/;
  ngForm: FormGroup;
  disabledHeight: boolean;
  disabledNeedCutsidding: boolean;
  disabledNeedRidglet: boolean;
  disabledNeedLeakexclusion: boolean;
  storeSubs: Subscription;

  constructor(
    private readonly formBuilder: FormBuilder,
    private popoverController: PopoverController,
    private catalogsService: CatalogsService,
    private projectService: ProjectsService,
    private readonly modalCtrl: ModalController,
    private store: Store<AppState>
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find((x) => x.active);
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
      if (this.building) {
        let projectShingleSlopes = this.building.psb_measure.psb_slopes?.filter(
          (slope) => slope.deletedAt == null
        );
        if (projectShingleSlopes == null || projectShingleSlopes == undefined) {
          projectShingleSlopes = [];
        }
        let i = 0;
        projectShingleSlopes.forEach((element) => {
          i++;
          this.pitchCalalog.push({
            id: element.pitch,
            option: `${element.pitch}/12`,
            selected: false,
          });
        });

        this.psbMeasures = this.building.psb_measure;
      }
    });
  }

  ngOnInit() {
    this.disabledNeedCutsidding = true;
    this.disabledNeedRidglet = true;
    this.disabledNeedLeakexclusion = true;
    this.initForm();
    this.getWallMaterials();
    this.getFractionsCatalog();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  getFractionsCatalog() {
    const fractions = AppConfig.FRACTIONS_CATALOG;
    fractions.forEach((element) => {
      this.fractionsCatalogWidth.push({
        id: element.id,
        option: element.option,
        selected: element.selected,
      });
      this.fractionsCatalogLength.push({
        id: element.id,
        option: element.option,
        selected: element.selected,
      });
      this.fractionsCatalogHeight.push({
        id: element.id,
        option: element.option,
        selected: element.selected,
      });
    });
  }

  getWallMaterials() {
    this.catalogsService.getWallMaterials().then((result) => {
      this.wallMaterials = [...result.data];
      this.genericWallMaterials = [];
      result.data.forEach((element) => {
        this.genericWallMaterials.push({
          id: element.id,
          option: element.wall_material,
          selected: false,
        });
      });
      this.loadData();
    });
  }

  initForm() {
    this.ngForm = this.formBuilder.group({
      chimneys: [
        '',
        Validators.compose([Validators.required, Validators.maxLength(30)]),
      ],
      onRigde: [false],
      width: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
        ]),
      ],
      fWidth: ['', Validators.compose([Validators.required])],
      lenght: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
        ]),
      ],
      fLenght: ['', Validators.compose([Validators.required])],
      cricketExists: [false],
      pitch: ['', Validators.compose([Validators.pattern(this.exp_regular_one_decimal)])],
      scHeight: [
        '',
        Validators.compose([Validators.pattern(this.exp_regular)]),
      ],
      fHeight: [''],
      idWallMaterial: ['', Validators.compose([Validators.required])],
      needCutsidding: [false],
      needRidglet: [false],
      needLeakexclusion: [false],
      needEndwall: [false],
      adittionalCost: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
        ]),
      ],
      note: [''],
      ridgletLF: ['']
    });
  }

  loadData() {
    this.ngForm
      .get('chimneys')
      .setValue(
        this.chimney
          ? this.chimney.chimneys
          : 'Chimneys ' + (this.totalChimneys + 1)
      );
    this.ngForm
      .get('onRigde')
      .setValue(this.chimney ? this.chimney.on_rigde : false);
    this.ngForm.get('width').setValue(this.chimney ? this.chimney.width : '');
    this.ngForm
      .get('fWidth')
      .setValue(this.chimney ? this.chimney.f_width : '');
    this.ngForm.get('lenght').setValue(this.chimney ? this.chimney.lenght : '');
    this.ngForm
      .get('fLenght')
      .setValue(this.chimney ? this.chimney.f_lenght : '');
    this.ngForm
      .get('cricketExists')
      .setValue(this.chimney ? this.chimney.cricket_exists : false);
    this.ngForm.get('pitch').setValue(this.chimney ? this.chimney.pitch : '');
    this.ngForm
      .get('scHeight')
      .setValue(this.chimney ? this.chimney.cricket_height : '');
    this.ngForm
      .get('fHeight')
      .setValue(this.chimney ? this.chimney.f_height : '');
    if (this.chimney) {
      this.genericWallMaterials.forEach((x) => {
        if (x.id == this.chimney.id_wall_material) {
          x.selected = true;
          this.wallMaterial = x;
          this.ngForm.get('idWallMaterial').setValue(x.id);
          this.validateOptionsNeed(x);
        }
      });
    }
    this.ngForm
      .get('needCutsidding')
      .setValue(this.chimney ? this.chimney.need_cutsidding : false);
    this.ngForm
      .get('needRidglet')
      .setValue(this.chimney ? this.chimney.need_ridglet : false);
    this.ngForm
      .get('needLeakexclusion')
      .setValue(this.chimney ? this.chimney.need_leakexclusion : false);
    this.ngForm
      .get('needEndwall')
      .setValue(this.chimney ? this.chimney.need_endwall : false);
    this.ngForm
      .get('adittionalCost')
      .setValue(this.chimney ? this.chimney.aditional_cost : '');
    this.ngForm.get('note').setValue(this.chimney ? this.chimney.note : '');
    this.ngForm
      .get('ridgletLF')
      .setValue(this.chimney ? this.chimney.ridglet_lf : '');
  }

  async openPopoverPitch(ev: any) {
    const modal = await this.popoverController.create({
      component: PopoverOptionsListComponent,
      cssClass: '',
      event: ev,
      side: 'bottom',
      componentProps: {
        options: this.pitchCalalog,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    this.ngForm.get('pitch').setValue(data.id);
    this.ngForm.get('pitch').markAsDirty();
  }

  async openPopoverWallMaterials(ev: any) {
    const modal = await this.popoverController.create({
      component: PopoverOptionsListComponent,
      cssClass: '',
      event: ev,
      side: 'bottom',
      componentProps: {
        options: this.genericWallMaterials,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    this.wallMaterial = data;
    this.ngForm.get('idWallMaterial').setValue(data.id);
    this.validateOptionsNeed(data);
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

  async openPopoverFractions(ev: any, option: number) {
    const modal = await this.popoverController.create({
      component: PopoverOptionsListComponent,
      cssClass: '',
      event: ev,
      side: 'bottom',
      componentProps: {
        options:
          option == 1
            ? this.fractionsCatalogWidth
            : option == 2
              ? this.fractionsCatalogLength
              : this.fractionsCatalogHeight,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    if (option == 1) {
      this.ngForm.get('fWidth').setValue(data.option);
      this.ngForm.get('fWidth').markAsDirty();
    } else if (option == 2) {
      this.ngForm.get('fLenght').setValue(data.option);
      this.ngForm.get('fLenght').markAsDirty();
    } else if (option == 3) {
      this.ngForm.get('fHeight').setValue(data.option);
      this.ngForm.get('fHeight').markAsDirty();
    }
  }

  validateOptionsNeed(data) {
    this.ngForm.get('needCutsidding').setValue(false);
    this.ngForm.get('needRidglet').setValue(false);
    this.ngForm.get('needLeakexclusion').setValue(false);
    this.ngForm.get('needEndwall').setValue(false);

    if (data.option === 'sidding') this.disabledNeedCutsidding = false;
    else this.disabledNeedCutsidding = true;

    if (data.option === 'stucko')
      this.disabledNeedRidglet = false;
    else this.disabledNeedRidglet = true;

    if (data.option === 'stone' ||
      data.option === 'brick') {
      this.ngForm.get('needRidglet').setValue(true);
      this.onChangeNewRidglet();
    }

    if (data.option === 'stone') this.disabledNeedLeakexclusion = false;
    else this.disabledNeedLeakexclusion = true;
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

  onChangeWidthCricketExists() {
    const cricketExists = this.ngForm.get('cricketExists').value;
    const width = parseInt(this.ngForm.get('width').value);
    if (!cricketExists && width >= 30) {
      const sc_height = this.chimney && this.chimney.cricket_height ? (this.chimney.cricket_height ?? 6) : 6;
      this.ngForm.get('scHeight').setValue(sc_height);
    } else {
      this.ngForm.get('scHeight').setValue('');
    }
  }

  validatePitch(): boolean {
    const cricketExists = this.ngForm.get('cricketExists').value;
    const width = parseInt(this.ngForm.get('width').value);
    if (!cricketExists && width >= 30) {
      this.disabledHeight = false;
      this.ngForm.get('pitch').addValidators(Validators.required);
      this.ngForm.get('pitch').updateValueAndValidity();
      this.ngForm
        .get('scHeight')
        .addValidators([
          Validators.required,
          Validators.min(6),
          Validators.max(12),
        ]);
      this.ngForm.get('scHeight').updateValueAndValidity();
      this.ngForm.get('fHeight').addValidators(Validators.required);
      this.ngForm.get('fHeight').updateValueAndValidity();
      return true;
    } else {
      this.disabledHeight = true;
      this.ngForm.get('pitch').setValue('');
      this.ngForm.get('pitch').removeValidators(Validators.required);
      this.ngForm.get('pitch').updateValueAndValidity();
      this.ngForm.get('scHeight').setValue('');
      this.ngForm.get('scHeight').setValidators(null);
      this.ngForm.get('scHeight').updateValueAndValidity();
      this.ngForm.get('fHeight').setValue('');
      this.ngForm.get('fHeight').setValidators(null);
      this.ngForm.get('fHeight').updateValueAndValidity();
      return false;
    }
  }

  getDescLength(): string {
    const width = this.ngForm.get('width').value;
    const length = this.ngForm.get('lenght').value;
    if (width == null || length == null || width == '' || length == '')
      return null;
    const total = parseInt(width) * parseInt(length);
    if (total > 1000) return '(Large)';
    else return '(Small)';
  }

  getDescWidth(): string {
    const width = this.ngForm.get('width').value;
    const onRigde = this.ngForm.get('onRigde').value;
    if (width == null || width == '' || onRigde == true) return null;
    if (parseInt(width) >= 30) return '(It needs a cricket)';
    else return '(Saddle metal will be installed)';
  }

  confirm() {
    if (this.chimney) {
      this.update();
    } else {
      this.save();
    }
  }

  update() {
    const chimneyUpdated = {
      ...this.chimney,
      chimneys: this.ngForm.get('chimneys').value,
      on_rigde: this.ngForm.get('onRigde').value,
      width: parseInt(this.ngForm.get('width').value),
      f_width: this.ngForm.get('fWidth').value,
      lenght: parseInt(this.ngForm.get('lenght').value),
      f_lenght: this.ngForm.get('fLenght').value,
      cricket_exists: this.ngForm.get('cricketExists').value,
      id_wall_material: this.wallMaterial.id,
      need_cutsidding: this.ngForm.get('needCutsidding').value,
      need_ridglet: this.ngForm.get('needRidglet').value,
      need_leakexclusion: this.ngForm.get('needLeakexclusion').value,
      need_endwall: this.ngForm.get('needEndwall').value,
      aditional_cost: parseFloat(this.ngForm.get('adittionalCost').value),
      note: this.ngForm.get('note').value,
      id_psb_measure: parseInt(this.building.psb_measure.id),
      isModified: true,
      ridglet_lf: this.ngForm.get('ridgletLF').value ?
        this.ngForm.get('ridgletLF').value : null,
    };

    const cricketExists = this.ngForm.get('cricketExists').value;
    const width = parseInt(this.ngForm.get('width').value);

    //Si no existe cricket en la chimenea y el ancho de la misma es mayor o igual a 30 habilitar el input del roof pitch.
    //La altura del cricket para la chimenea solo se habilita si no hay cricket y el ancho es mayor igual a 30 pulgadas.
    if (!cricketExists && width >= 30) {
      chimneyUpdated.pitch = parseFloat(this.ngForm.get('pitch').value);
      chimneyUpdated.cricket_height = parseInt(this.ngForm.get('scHeight').value);
      chimneyUpdated.f_height = this.ngForm.get('fHeight').value;
    } else {
      chimneyUpdated.pitch = null;
      chimneyUpdated.cricket_height = null;
      chimneyUpdated.f_height = null;
    }

    const psb_chimneys_updated = this.psbMeasures.psb_chimneys.map((x) => {
      if (x.id == chimneyUpdated.id) {
        return chimneyUpdated;
      } else {
        return x;
      }
    });

    const psbMeasuresUpdated = {
      ...this.psbMeasures,
      psb_chimneys: psb_chimneys_updated,
    };

    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    this.modalCtrl.dismiss();
  }

  save() {
    let chimney: PsbChimney = {
      id: uuidv4(),
      chimneys: this.ngForm.get('chimneys').value,
      on_rigde: this.ngForm.get('onRigde').value,
      width: parseInt(this.ngForm.get('width').value),
      f_width: this.ngForm.get('fWidth').value,
      lenght: parseInt(this.ngForm.get('lenght').value),
      f_lenght: this.ngForm.get('fLenght').value,
      cricket_exists: this.ngForm.get('cricketExists').value,
      id_wall_material: this.wallMaterial.id,
      need_cutsidding: this.ngForm.get('needCutsidding').value,
      need_ridglet: this.ngForm.get('needRidglet').value,
      need_leakexclusion: this.ngForm.get('needLeakexclusion').value,
      need_endwall: this.ngForm.get('needEndwall').value,
      aditional_cost: parseFloat(this.ngForm.get('adittionalCost').value),
      note: this.ngForm.get('note').value,
      id_psb_measure: parseInt(this.building.psb_measure.id),
      isModified: true,
      ridglet_lf: this.ngForm.get('ridgletLF').value ?
        this.ngForm.get('ridgletLF').value : null,
    };

    const cricketExists = this.ngForm.get('cricketExists').value;
    const width = parseInt(this.ngForm.get('width').value);
    //Si no existe cricket en la chimenea y el ancho de la misma es mayor o igual a 30 habilitar el input del roof pitch.
    //La altura del cricket para la chimenea solo se habilita si no hay cricket y el ancho es mayor igual a 30 pulgadas.
    if (!cricketExists && width >= 30) {
      chimney.pitch = parseFloat(this.ngForm.get('pitch').value);
      chimney.cricket_height = parseInt(this.ngForm.get('scHeight').value);
      chimney.f_height = this.ngForm.get('fHeight').value;
    }

    const psb_chimneys_updated = this.psbMeasures.psb_chimneys
      ? [...this.psbMeasures.psb_chimneys]
      : [];
    psb_chimneys_updated.push(chimney);

    const psbMeasuresUpdated = {
      ...this.psbMeasures,
      psb_chimneys: psb_chimneys_updated,
    };
    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    this.modalCtrl.dismiss();
  }

  onChangeNewRidglet() {
    const needRidglet = this.ngForm.get('needRidglet').value;
    if (needRidglet) {
      this.ngForm.get('ridgletLF').enable();
      this.ngForm.controls["ridgletLF"].clearValidators();
      this.ngForm.controls['ridgletLF'].setValidators([Validators.required]);
      this.ngForm.controls['ridgletLF'].updateValueAndValidity();
      // this.ngForm.controls["ridgletLF"].addValidators([Validators.required]);

      // this.ngForm.get('ridgletLF').addValidators(Validators.required);
    } else {
      this.ngForm.get('ridgletLF').disable();
      this.ngForm.get('ridgletLF').removeValidators(Validators.required);
      this.ngForm.get('ridgletLF').setValue('');
    }
  }
}
