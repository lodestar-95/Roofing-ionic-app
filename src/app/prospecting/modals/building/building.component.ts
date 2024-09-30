import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { JobType } from 'src/app/models/job-type.mode';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { JobMaterialType } from 'src/app/models/job-material-type.mode';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { v4 as uuidv4 } from 'uuid';
import * as prospectingActions from '../../prospecting.actions';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

@Component({
  selector: 'app-building',
  templateUrl: './building.component.html',
  styleUrls: ['./building.component.scss'],
})
export class BuildingComponent implements OnInit {
  @Input() building: Building;
  @Input() idProject: number;
  @Input() idProjectVersion: number;
  @Input() project: Project;
  @Input() descBuilding: string;
  jobType: JobType;
  materialType: JobMaterialType;
  buildingForm: FormGroup;

  materialTypeList: JobMaterialType[] = [];
  jobTypeList: JobType[] = [];

  constructor(
    private projectService: ProjectsService,
    private catalogsService: CatalogsService,
    private readonly formBuilder: FormBuilder,
    private readonly modalCtrl: ModalController,
    private general: GeneralService,
    private store: Store<AppState>
  ) { }

  async loadCatalogs() {
    const idJobTypeRepair = 17;
    await this.catalogsService.getJobTypes().then((result) => {
      result.data.forEach((element) => {
        if(element.id !== idJobTypeRepair){
          this.jobTypeList.push(element);
          //element.job_type;
        }
      });
    });
    await this.catalogsService.getMaterialTypes().then((result) => {
      result.data.forEach((element) => {
        if (element.active) {
          this.materialTypeList.push(element);
        }
      });
    });
    this.loadData();
  }

  onClickMaterialType(materialType: JobMaterialType) {
    this.materialType = materialType;
  }

  onClickJobType(jobType: JobType) {
    this.jobType = jobType;
  }

  ngOnInit() {
    this.project = JSON.parse(JSON.stringify(this.project));
    this.initForm();
    this.loadCatalogs();
  }

  initForm() {
    this.buildingForm = this.formBuilder.group({
      materialType: ['', Validators.compose([Validators.required])],
      jobType: ['', Validators.compose([Validators.required])],
      description: [
        '',
        Validators.compose([Validators.required, Validators.minLength(3)]),
      ],
    });
  }

  loadData() {
    this.buildingForm
      .get('description')
      .setValue(this.building ? this.building.description : this.descBuilding);
    this.buildingForm
      .get('materialType')
      .setValue(this.building ? this.building.job_material_type?.material : '');
    this.buildingForm
      .get('jobType')
      .setValue(this.building ? this.building.job_type?.job_type : '');
  }

  confirm() {
    if (!this.isValidBuildingName()) {
      return;
    }

    if (this.building) {
      this.updateBuilding();
    } else {
      this.saveBuilding();
    }
  }

  isValidBuildingName() {
    const name = this.buildingForm.get('description').value;
    const index = this.project.versions.findIndex((projectVersion) => projectVersion.id == this.idProjectVersion);

    if (this.building) {
      return !(this.project?.versions[index]?.buildings?.some(x =>
        x.description == name
        && x.id != this.building.id
        && x.deletedAt == null) ?? false);
    } else {
      return !(this.project?.versions[index]?.buildings?.some(x =>
        x.description == name
        && x.deletedAt == null) ?? false);
    }
  }

  saveBuilding() {
    
    
    const lastversion = this.project.versions[this.project.versions.length - 1];
    let newItemId;
    try {
      newItemId = lastversion.buildings[ lastversion.buildings.length - 1].id + 1;
    } catch (error) {
      newItemId = 1
    }

    console.log("newItemId", lastversion.buildings);
    
    const building: Building = {
      // id: newItemId,
      id_job_material_type: this.materialType.id,
      job_material_type: this.materialType,
      description: this.buildingForm.get('description').value,
      id_project: this.idProject,
      id_job_type: this.jobType.id,
      job_type: this.jobType,
      is_main_building: false,
      psb_measure: null,
      active: false,
      pb_scopes: [],
      isModified: true,
    };
    const index = this.project.versions.findIndex(
      (projectVersion) => projectVersion.id == this.idProjectVersion
    );
    this.project.isModified = true;
    this.project.versions[index].buildings.push(building);
    this.projectService.update(this.project.id, this.project).then((result) => {
      this.store.dispatch(
        prospectingActions.editProject({ project: this.project })
      );
      this.store.dispatch(
        prospectingActions.setProject({ project: this.project })
      );
      this.dismissModal();
    });
  }

  async updateBuilding() {
    let buildingUpdated: Building = { ...this.building, isModified: true };

    if (this.buildingForm.get('description').dirty) {
      buildingUpdated = {
        ...buildingUpdated,
        description: this.buildingForm.get('description').value,
      };
    }

    if (this.buildingForm.get('jobType').dirty) {

      const needCaptureLayers = await this.validateChangeLayers();
      if (needCaptureLayers) {
        buildingUpdated = this.removeCheckRoofSlope(buildingUpdated);
      }

      if ((await this.jobTypeChangeOverlay('from'))) {
        buildingUpdated = this.removeCheckOtherMeasures(buildingUpdated);
        buildingUpdated = this.removeDMetalPreviousOptions(buildingUpdated);
      }

      if ((await this.jobTypeChangeOverlay('to'))) {
        buildingUpdated = this.removeDMetalSelection(buildingUpdated);
      }

      const needCaptureSelection = await this.validateFromOverlay();
      if (needCaptureSelection) {
        buildingUpdated = this.removeCheckSelection(buildingUpdated);
      }

      const needCleanSelectionInW = await this.validateToOverlay();
      if (needCleanSelectionInW && !this.hasLowSlope()) {
        buildingUpdated = this.removeSelectionInWUnderlayment(buildingUpdated);
      }

      buildingUpdated = {
        ...buildingUpdated,
        id_job_type: this.jobType.id,
        job_type: this.jobType,
      };
    }

    if (this.buildingForm.get('materialType').dirty) {
      buildingUpdated = {
        ...buildingUpdated,
        id_job_material_type: this.materialType.id,
        job_material_type: this.materialType,
      };
    }

    this.project.isModified = true;
    const index = this.project.versions.findIndex(
      (projectVersion) => projectVersion.id == this.idProjectVersion
    );
    this.project.versions[index].buildings = this.project.versions[
      index
    ].buildings.map((item) => {
      if (item.id === buildingUpdated.id) {
        return {
          ...buildingUpdated,
        };
      } else {
        return item;
      }
    });

    this.projectService.update(this.project.id, this.project).then((result) => {
      this.store.dispatch(
        prospectingActions.editProject({ project: this.project })
      );
      this.store.dispatch(
        prospectingActions.setProject({ project: this.project })
      );
      this.dismissModal();
    });
  }

  removeCheckOtherMeasures(buildingUpdated: Building): Building {
    const otherMeasuresResourceId = 9;
    return this.removeCheck(buildingUpdated, otherMeasuresResourceId,false);
  }

  hasLowSlope(): boolean {
    return this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 2 && x.pitch < 4 && !x.deletedAt) ?? false;
  }

  removeCheckSelection(buildingUpdated: Building): Building {
    return this.removeCheck(buildingUpdated, 12, false);
  }

  removeCheckRoofSlope(buildingUpdated: Building): Building {
    const roofSlopeResourceId = 7;
    return this.removeCheck(buildingUpdated, roofSlopeResourceId, false);
  }
  removeSelectionInWUnderlayment(buildingUpdated: Building) {
    const psb_selected_materials = buildingUpdated.psb_measure?.psb_selected_materials?.map(v => {
      if (v.id_material_category == 30 || v.id_material_category == 34) {
        return { ...v, deletedAt: new Date() };
      } else {
        return { ...v };
      }
    });

    const psb_measure = { ...buildingUpdated.psb_measure, psb_selected_materials };

    buildingUpdated = {
      ...buildingUpdated,
      psb_measure
    };

    return buildingUpdated;
  }

  removeCheck(buildingUpdated: Building, resourceId: number, verified: boolean): Building {
    const psb_verifieds = buildingUpdated.psb_measure?.psb_verifieds?.map(v => {
      if (v.id_resource == resourceId) {
        return { ...v, is_verified: verified };
      } else {
        return { ...v };
      }
    });

    const psb_measure = { ...buildingUpdated.psb_measure, psb_verifieds };

    buildingUpdated = {
      ...buildingUpdated,
      psb_measure
    };

    return buildingUpdated;
  }

  removeDMetalSelection(buildingUpdated: Building): Building {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(17, true, buildingUpdated);

    const psb_measure = {
      ...buildingUpdated.psb_measure,
      psb_verifieds
    };

    buildingUpdated = {
      ...buildingUpdated,
      psb_measure
    };

    return buildingUpdated;
  }

  removeDMetalPreviousOptions(buildingUpdated: Building): Building {
    const psb_verifieds = this.projectService.getShingleVerifiedInformation(17, false, buildingUpdated);

    const psb_measure = {
      ...buildingUpdated.psb_measure,
      id_metal_eves_rakes_flat_roof: 0,
      id_metal_eves_starters_low_slope: 0,
      id_metal_rakes_low_steep_slope: 0,
      psb_verifieds
    };

    buildingUpdated = {
      ...buildingUpdated,
      psb_measure
    };

    return buildingUpdated;
  }

  async validateChangeLayers() {
    const job_types_tear_off = await this.general.getConstDecimalValue('job_types_tear_off');
    const job_types_tear_off_only = await this.general.getConstDecimalValue('job_types_tear_off_only');

    return (this.jobType.id == job_types_tear_off
      || this.jobType.id == job_types_tear_off_only
      &&
      (this.building.id_job_type != job_types_tear_off
        && this.building.id_job_type != job_types_tear_off_only
      ));
  }

  async jobTypeChangeOverlay(type: 'from' | 'to') {
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');

    switch (type) {
      case 'from':
        return this.building.id_job_type == job_types_overlay && this.jobType?.id && this.jobType.id != job_types_overlay;
      case 'to':
        return this.building.id_job_type != job_types_overlay && this.jobType?.id && this.jobType.id == job_types_overlay;
    }
  }

  async validateFromOverlay() {
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');
    return this.jobType.id != job_types_overlay && this.building.id_job_type == job_types_overlay;
  }

  async validateToOverlay() {
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');
    return this.jobType.id == job_types_overlay && this.building.id_job_type != job_types_overlay;
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }
}
