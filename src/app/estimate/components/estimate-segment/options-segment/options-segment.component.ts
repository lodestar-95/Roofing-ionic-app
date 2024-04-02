import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbOption } from 'src/app/models/psb-option.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { OptionsRadio } from '../../options-radio-buttons/options-radio-buttons.component';
import { PopoverBuildingsComponent } from '../../popover-buildings/popover-buildings.component';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

@Component({
  selector: 'app-options-segment',
  templateUrl: './options-segment.component.html',
  styleUrls: ['./options-segment.component.scss'],
})
export class OptionsSegmentComponent implements OnInit {
  buildingAux: Building;

  project: Project;
  buildings: Building[];
  buildingSelected: Building;
  buildingsSelected: Building[] = [];
  radiosByBuilding: any[] = [];
  storeSubs: Subscription;
  canModifyProposal = true;
  userDisabledPermision = false;
  alwaysAllowModification: boolean;

  constructor(
    private store: Store<AppState>,
    private popoverController: PopoverController,
    private projectService: ProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private general: GeneralService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }

      this.initData();
      this.getAlwaysAllowModification();
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() { }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
  }
  /**
   * Get the information of the main building
   */
  initData() {
    this.canModifyProposal = this.project?.project_status?.id == 1 || this.project?.project_status?.id == 2;
    this.buildingsSelected = [];
    const { buildings } = this.project.versions.find((x) => x.active);
    this.buildings = buildings.filter(x => x.deletedAt == null);

    if (!this.buildings.find((x) => x.id == 0)) {
      this.buildingAux = {
        active: false,
        description: 'All buildings',
        id: 0,
        id_job_material_type: null,
        id_job_type: null,
        id_project: null,
        isModified: false,
        job_material_type: null,
        job_type: null,
        psb_measure: null,
        deletedAt: null,
        is_main_building: null,
        pb_scopes: []
      };
      this.buildings.unshift(this.buildingAux);
    }

    this.buildings = this.buildings.map((building: any) => {
      return { ...building, selected: (building.id == 0) };
    });

    this.buildingSelected = this.buildings.find(building => building.id == 0);
    this.buildings.forEach((building) => {
      this.buildingsSelected.push(building);
    });

    this.getOptions();
    this.validateRolePermission();
  }

  /**
   * Fill in the information of the selected building or buildings
   * @param event
   * @returns
   */
  async selectBuilding(event) {
    this.buildingsSelected = [];
    const popover = await this.popoverController.create({
      component: PopoverBuildingsComponent,
      cssClass: '',
      event: event,
      side: 'right',
      componentProps: {
        buildings: this.buildings,
      },
    });

    await popover.present();
    const { data } = await popover.onWillDismiss();

    if (!data) {
      return;
    }

    this.buildingSelected = data;
    if (this.buildingSelected.id == 0) {
      this.buildings.forEach((building) => {
        this.buildingsSelected.push(building);
      });
    } else {
      this.buildingsSelected.push(this.buildingSelected);
    }
    this.getOptions();
  }

  /**
   * Get the list of options for each building
   */
  getOptions() {
    if (!this.buildingsSelected) {
      return;
    }

    this.radiosByBuilding = [];
    if (this.buildingsSelected.length == 1) {
      let items: any[] = [];
      const options = this.buildingSelected.psb_measure.psb_options;
      options.forEach((building: any) => {
        const item: any = {
          title: building.option,
          value: building.is_built_in ? 1 : 2,
          total: building.cost * building.qty_hours,
          options: [
            {
              id: 1,
              idOption: building.id,
              idPsbMeasure: this.buildingSelected.psb_measure.id,
              isChecked: building.is_built_in,
              text: 'Built in',
            },
            {
              id: 2,
              idOption: building.id,
              idPsbMeasure: this.buildingSelected.psb_measure.id,
              isChecked: !building.is_built_in,
              text: 'Optional',
            },
          ],
        };
        items.push(item);
      });

      this.radiosByBuilding.push({
        building: this.buildingSelected,
        items,
      });
    } else {
      this.buildingsSelected.forEach((buildingSelected) => {
        let items: OptionsRadio[] = [];
        const options = buildingSelected?.psb_measure?.psb_options;
        if (!options) {
          return;
        }
        options.forEach((building: any) => {
          const item: any = {
            title: building.option,
            value: building.is_built_in ? 1 : 2,
            total: building.cost * building.qty_hours,
            options: [
              {
                id: 1,
                idOption: building,
                idPsbMeasure: buildingSelected.psb_measure.id,
                isChecked: building.is_built_in,
                text: 'Built in',
              },
              {
                id: 2,
                idOption: building,
                idPsbMeasure: buildingSelected.psb_measure.id,
                isChecked: !building.is_built_in,
                text: 'Optional',
              },
            ],
          };
          items.push(item);
        });

        this.radiosByBuilding.push({
          building: buildingSelected,
          items,
        });
      });
    }
  }

  onOptionChanged(item) {
    const building = this.buildings.find((x) => x.id == item.idBuilding);
    const options = building.psb_measure.psb_options;
    const option: PsbOption = options.find((x) => x.id == item.idOption.id);

    const optionsUpdated = options.map((x) => {
      if (x.id == option.id) {
        return { ...x, is_built_in: item.id == 1, isModified: true };
      } else {
        return x;
      }
    });

    const buildingUpdated = {
      ...building,
      psb_measure: {
        ...building.psb_measure,
        psb_options: [...optionsUpdated],
      },
    };

    this.projectService.saveProjectBuilding(buildingUpdated);
  }

  validateRolePermission(){
    if(this.project){
      this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project).
      then((result) => {
        this.userDisabledPermision = result;
      });
    }
   }
}
