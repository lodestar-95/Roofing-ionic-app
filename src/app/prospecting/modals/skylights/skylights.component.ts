import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { AppConfig } from 'src/app/config/app';
import { v4 as uuidv4 } from 'uuid';
import { Generic } from 'src/app/models/generic.model';
import { PsbSkylight } from 'src/app/models/psb_skylight.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { AddNoteComponent } from '../../components/add-note/add-note.component';
import { PopoverOptionsListComponent } from '../../components/popover-options-list/popover-options-list.component';
import { Project } from 'src/app/models/project.model';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-skylights',
  templateUrl: './skylights.component.html',
  styleUrls: ['./skylights.component.scss'],
})
export class SkylightsComponent implements OnInit, OnDestroy {
  @Input() skylight: PsbSkylight;
  @Input() totalSkylights: number;
  project: Project;
  building: Building;
  buildings: Building[];
  psbMeasures: PsbMeasures;
  exp_regular = /^(\d{1,7})(\.\d{2,2}){0,1}$/;
  ngForm: FormGroup;
  idSkylightSize: number;
  storeSubs: Subscription;
  fractionsCatalogWidth: Generic[] = [];
  fractionsCatalogLength: Generic[] = [];
  flashingKitCatalog: Generic[] = [];
  skylightSizeCatalog: Generic[];
  flashingKitSelected: Generic;
  isOverlay = false;
  isNewConstruction = false;

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
      this.loadPsbMeasures();
    });
  }

  ngOnInit() {
    this.getFractionsCatalog();
    this.getFlashingKit();
    this.getSkylightSize();
    this.initForm();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  loadPsbMeasures() {
    const { buildings } = this.project.versions.find((x) => x.active);
    this.buildings = buildings;
    this.building = buildings.find((x) => x.active);
    if (this.building) {
      this.psbMeasures = this.building.psb_measure;
      this.isOverlay = this.building.id_job_type == 14;
      this.isNewConstruction = this.building.id_job_type == 11;
    }
  }

  getFlashingKit() {
    this.flashingKitCatalog = [];
    this.flashingKitCatalog.push({
      id: 1,
      option: 'Flashing kit declined. Use E&H flashing.',
      selected: false,
    });
    this.flashingKitCatalog.push({
      id: 2,
      option: 'Flashing kit provided by E&H Roofing.',
      selected: false
    });
    this.flashingKitCatalog.push({
      id: 3,
      option: 'Flashing kit provided by home owner.',
      selected: false,
    });
  }

  getSkylightSize() {
    this.skylightSizeCatalog = [];
    this.skylightSizeCatalog.push({
      id: 1,
      option: 'Small (22.5 x 22.5)',
      selected: false,
    });
    this.skylightSizeCatalog.push({
      id: 2,
      option: 'Large (22.5 x 46.5)',
      selected: false,
    });
    this.skylightSizeCatalog.push({ id: 3, option: 'Custom', selected: false });
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
    });
  }

  initForm() {
    this.ngForm = this.formBuilder.group({
      skylights: [
        '',
        Validators.compose([Validators.required, Validators.maxLength(30)]),
      ],
      idSkylightSize: ['', Validators.compose([Validators.required])],
      width: [''],
      fWidth: [''],
      lenght: [''],
      fLenght: [''],
      needReplace: [false],
      idFkitOption: ['', Validators.compose([Validators.required])],
      adittionalCost: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(this.exp_regular),
        ]),
      ],
      note: [''],
    });
    this.loadData();
  }

  loadData() {
    this.ngForm
      .get('skylights')
      .setValue(
        this.skylight
          ? this.skylight.skylights
          : 'Skylights ' + (this.totalSkylights + 1)
      );
    this.ngForm
      .get('idSkylightSize')
      .setValue(this.skylight ? this.skylight.id_skylight_size : '');
    this.ngForm.get('width').setValue(this.skylight ? this.skylight.width : '');
    this.ngForm
      .get('fWidth')
      .setValue(this.skylight ? this.skylight.f_width : '');
    this.ngForm
      .get('lenght')
      .setValue(this.skylight ? this.skylight.lenght : '');
    this.ngForm
      .get('fLenght')
      .setValue(this.skylight ? this.skylight.f_lenght : '');
    this.ngForm
      .get('needReplace')
      .setValue(this.skylight ? this.skylight.need_replace : false);
    this.ngForm
      .get('adittionalCost')
      .setValue(this.skylight ? this.skylight.aditional_cost : '');
    this.ngForm.get('note').setValue(this.skylight ? this.skylight.note : '');
    this.ngForm
      .get('idFkitOption')
      .setValue(this.skylight ? this.skylight.id_fkit_option == 0 ? '' : this.skylight.id_fkit_option : '');

    if (this.skylight) {
      this.ngForm;
      this.idSkylightSize = this.skylight.id_skylight_size;
      this.getflashingKit(this.skylight.id_fkit_option);
    }
    if (this.isOverlay) {
      this.ngForm.get('idFkitOption').removeValidators(Validators.required);
      this.ngForm.get('idFkitOption').setValue(0);
      this.ngForm.get('idFkitOption').markAsDirty();
    }
  }

  getflashingKit(id) {
    let flashing = this.flashingKitCatalog.find((x) => x.id == id);
    this.flashingKitCatalog = this.flashingKitCatalog.map((x) => {
      if (x.id == id) {
        return {
          ...x,
          selected: true,
        };
      } else {
        return x;
      }
    });
    this.flashingKitSelected = flashing ? flashing : null;
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
            : this.fractionsCatalogLength,
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
    }
  }

  async openFlashingKit(ev: any) {
    const modal = await this.popoverController.create({
      component: PopoverOptionsListComponent,
      cssClass: '',
      event: ev,
      side: 'bottom',
      size: 'cover',
      componentProps: {
        options: this.flashingKitCatalog,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
    this.flashingKitSelected = data;
    this.ngForm.get('idFkitOption').setValue(data.id);
    this.ngForm.get('idFkitOption').markAsDirty();
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

  optionChange(event: any, option) {
    const checked = event.detail.checked;
    this.idSkylightSize = option;
    this.ngForm.get('idSkylightSize').setValue(option);
    this.ngForm.get('idSkylightSize').markAsDirty();
    if (option == 3) {
      this.ngForm.get('width').setValue('');
      this.ngForm.get('width').addValidators(Validators.required);
      this.ngForm.get('width').updateValueAndValidity();

      this.ngForm.get('fWidth').setValue('');
      this.ngForm.get('fWidth').addValidators(Validators.required);
      this.ngForm.get('fWidth').updateValueAndValidity();

      this.ngForm.get('lenght').setValue('');
      this.ngForm.get('lenght').addValidators(Validators.required);
      this.ngForm.get('lenght').updateValueAndValidity();

      this.ngForm.get('fLenght').setValue('');
      this.ngForm.get('fLenght').addValidators(Validators.required);
      this.ngForm.get('fLenght').updateValueAndValidity();
    } else {
      this.ngForm.get('width').setValue('');
      this.ngForm.get('width').removeValidators(Validators.required);
      this.ngForm.get('width').updateValueAndValidity();

      this.ngForm.get('fWidth').setValue('');
      this.ngForm.get('fWidth').removeValidators(Validators.required);
      this.ngForm.get('fWidth').updateValueAndValidity();

      this.ngForm.get('lenght').setValue('');
      this.ngForm.get('lenght').removeValidators(Validators.required);
      this.ngForm.get('lenght').updateValueAndValidity();

      this.ngForm.get('fLenght').setValue('');
      this.ngForm.get('fLenght').removeValidators(Validators.required);
      this.ngForm.get('fLenght').updateValueAndValidity();
    }
  }

  confirm() {
    if (this.skylight) {
      this.updateSkylight();
    } else {
      this.saveSkylight();
    }
  }

  updateSkylight() {
    const skylightUpdated = { ...this.skylight };
    skylightUpdated.skylights = this.ngForm.get('skylights').value;
    skylightUpdated.id_skylight_size = this.ngForm.get('idSkylightSize').value;
    skylightUpdated.need_replace = this.ngForm.get('needReplace').value;
    skylightUpdated.id_fkit_option = parseInt(
      this.ngForm.get('idFkitOption').value
    );
    skylightUpdated.aditional_cost = this.ngForm.get('adittionalCost').value;
    skylightUpdated.note = this.ngForm.get('note').value;
    skylightUpdated.id_psb_measure = parseInt(this.building.psb_measure.id);
    skylightUpdated.isModified = true;

    if (this.idSkylightSize == 3) {
      skylightUpdated.width = parseFloat(this.ngForm.get('width').value);
      skylightUpdated.f_width = this.ngForm.get('fWidth').value;
      skylightUpdated.lenght = parseFloat(this.ngForm.get('lenght').value);
      skylightUpdated.f_lenght = this.ngForm.get('fLenght').value;
    } else {
      skylightUpdated.width = null;
      skylightUpdated.f_width = null;
      skylightUpdated.lenght = null;
      skylightUpdated.f_lenght = null;
    }

    const psb_skylights_updated = this.psbMeasures.psb_skylights.map((x) => {
      if (x.id == skylightUpdated.id) {
        return skylightUpdated;
      } else {
        return x;
      }
    });

    const psbMeasuresUpdated = {
      ...this.psbMeasures,
      psb_skylights: psb_skylights_updated,
    };

    console.log('project_shingle_building update::', psbMeasuresUpdated);

    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    this.modalCtrl.dismiss();
  }

  saveSkylight() {
    let skylight: PsbSkylight = {
      id: uuidv4(),
      skylights: this.ngForm.get('skylights').value,
      id_skylight_size: this.ngForm.get('idSkylightSize').value,
      need_replace: this.ngForm.get('needReplace').value,
      id_fkit_option: parseInt(this.ngForm.get('idFkitOption').value),
      aditional_cost: this.ngForm.get('adittionalCost').value,
      note: this.ngForm.get('note').value,
      id_psb_measure: parseInt(this.building.psb_measure.id),
      isModified: true,
    };

    if (this.idSkylightSize == 3) {
      skylight.width = this.ngForm.get('width').value;
      skylight.f_width = this.ngForm.get('fWidth').value;
      skylight.lenght = this.ngForm.get('lenght').value;
      skylight.f_lenght = this.ngForm.get('fLenght').value;
    }

    const psb_skylights_updated = this.psbMeasures.psb_skylights
      ? [...this.psbMeasures.psb_skylights]
      : [];
    psb_skylights_updated.push(skylight);

    const psbMeasuresUpdated = {
      ...this.psbMeasures,
      psb_skylights: psb_skylights_updated,
    };

    this.projectService.saveProjectShingleBuilding(psbMeasuresUpdated);
    this.modalCtrl.dismiss();
  }
}
