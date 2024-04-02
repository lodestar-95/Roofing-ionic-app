import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbOption } from 'src/app/models/psb-option.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})

/**
 * @author: Carlos Rodríguez
 */
export class OptionsComponent implements OnInit, OnDestroy {
  @Input() option: PsbOption;
  name: string;
  time: number;
  price: number;
  total: number;
  options: any[] = [
    { val: 'Built In ', isChecked: false, id: 1, name: 'built' },
    { val: 'Optional', isChecked: false, id: 2, name: 'optional' }
  ];

  project: Project;
  building: Building;
  buildings: Building[];
  storeSubs: Subscription;

  constructor(
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private modalController: ModalController
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;

      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find(x => x.active);
      this.buildings = buildings;
      this.building = buildings.find(x => x.active);
    });
  }

  ngOnInit() {
    if (this.option) {
      this.name = this.option.option;
      this.price = this.option.cost;
      this.time = this.option.qty_hours;

      if (this.option.is_built_in) {
        this.options.map(x => {
          if (x.id == 1) {
            x.isChecked = true;
          }
        });
      } else {
        this.options.map(x => {
          if (x.id == 2) {
            x.isChecked = true;
          }
        });
      }

      this.calculateTotal();
    }
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   *
   * @param option
   */
  optionSelcted(option) {
    this.options.map(x => {
      if (x.id === option.id) {
        x.isChecked = true;
      } else {
        x.isChecked = false;
      }
    });
  }

  /**
   * Save or update de psb option
   */
  confirm() {
    if (this.option) {
      this.update();
    } else {
      this.create();
    }
  }

  /**
   * Create a new psb option
   */
  create() {
    const is_built_in = this.options.find(x => x.id == 1).isChecked;

    const option: PsbOption = {
      id: uuidv4(),
      cost: this.price,
      option: this.name,
      qty_hours: this.time,
      is_built_in: is_built_in,
      id_psb_measure: null,
      isModified: true
    };

    if (!this.building.psb_measure.psb_options) {
      const psb: PsbMeasures = {
        ...this.building.psb_measure,
        psb_options: [option]
      };

      this.projectService.saveProjectShingleBuilding(psb);
      this.modalController.dismiss();
    } else {
      const psb: PsbMeasures = {
        ...this.building.psb_measure,
        psb_options: [...this.building.psb_measure.psb_options, option]
      };

      this.projectService.saveProjectShingleBuilding(psb);
      this.modalController.dismiss();
    }
  }

  /**
   * Update a psb option
   */
  update() {
    const is_built_in = this.options.find(x => x.id == 1).isChecked;

    const optionUpdated: PsbOption = {
      ...this.option,
      cost: this.price,
      option: this.name,
      qty_hours: this.time,
      is_built_in,
      id_psb_measure: null,
      isModified: true
    };

    const options = this.building.psb_measure.psb_options.map(x => {
      if (x.id == optionUpdated.id) {
        return optionUpdated;
      } else {
        return x;
      }
    });

    const psb: PsbMeasures = {
      ...this.building.psb_measure,
      psb_options: options
    };

    this.projectService.saveProjectShingleBuilding(psb);
    this.modalController.dismiss();
  }

  /**
   * total = price * time
   */
  calculateTotal() {
    this.total = this.price * this.time;
  }

  /**
   *
   * @param form
   * @returns
   */
  isValidForm(form) {
    return this.options.filter(x => x.isChecked).length > 0 && !form.invalid;
  }
}
