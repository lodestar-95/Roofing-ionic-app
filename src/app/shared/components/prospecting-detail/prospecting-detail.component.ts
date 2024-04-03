import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import moment from 'moment';
import { AppState } from 'src/app/app.reducer';
import { v4 as uuidv4 } from 'uuid';

import { Building } from 'src/app/models/building.model';
import { Version } from 'src/app/models/version.model';
import { Project } from 'src/app/models/project.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { PopoverProspectingVersionComponent } from '../../../prospecting/components/popover-prospecting-version/popover-prospecting-version.component';
import { Subscription } from 'rxjs';
import { InAppBrowser } from '@ionic-native/in-app-browser';

@Component({
  selector: 'app-prospecting-detail',
  templateUrl: './prospecting-detail.component.html',
  styleUrls: ['./prospecting-detail.component.scss'],
})

/**
 * @author: Carlos Rodríguez
 */
export class ProspectingDetailComponent implements OnInit {
  @Output() showBuildingsEmited = new EventEmitter<boolean>();
  @Output() changeVersionEmited = new EventEmitter<boolean>();
  @Input() allowChangeVersion: boolean = true;
  project: Project;
  totalProjectBuildings: number;
  nextContactDate: string;
  version: Version;
  isLastVersion: boolean = false;
  showDetail: boolean = false;
  canCollpase: boolean = false;
  building: Building;
  buildings: Building[];
  text: string;
  storeSubs: Subscription;

  constructor(
    private popoverController: PopoverController,
    private projectService: ProjectsService,
    private store: Store<AppState>
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      this.initData();

      if (!this.project || this.project.versions.length == 0) {
        return;
      }

      const { buildings } = this.project.versions.find(
        (x) => x.active || x.is_current_version
      ) ? this.project.versions.find(
        (x) => x.active || x.is_current_version
      ) : this.project.versions[0];


      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);

      if (this.building) {
        this.showDetail = false;
        this.canCollpase = true;

        this.text = '';
        this.text += `${this.project.prospecting_type?.prospecting_type}`;

        this.text += this.building?.job_material_type?.material
          ? `/${this.building?.job_material_type?.material}`
          : '';
        /*
        this.text += this.building?.description
          ? `/${this.building?.description}`
          : '';
        */
        this.text += this.building?.job_type?.job_type
          ? `/${this.building?.job_type?.job_type}`
          : '';
      } else {
        this.showDetail = true;
        this.canCollpase = false;

        this.text = '';
        const totalProjectBuildings =
          buildings.filter((b) => b.deletedAt == null).length - 1;
        const building = buildings.find((x) => x.is_main_building);
        this.text =
          `${this.project.prospecting_type?.prospecting_type}` +
          `/${building?.job_material_type?.material}` +
          `/${building?.job_type?.job_type}` +
          `${totalProjectBuildings >= 1
            ? ' +' +
            totalProjectBuildings +
            (totalProjectBuildings == 1 ? ' building' : ' buildings')
            : ''
          }`;
      }
    });
  }

  ngOnInit() {
    this.initData();
  }
  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Get init params for detail view
   * @returns
   */
  initData() {
    if (!this.project) {
      return;
    }

    this.version = this.project.versions.find((x) => x.active || x.is_current_version) ? this.project.versions.find(
      (x) => x.active || x.is_current_version
    ) : this.project.versions[0];

    if (!this.version) {
      return;
    }

    if(this.project.next_contact_date){
        let m = moment.utc(this.project.next_contact_date);
        this.nextContactDate = m.format('DD/MM/YYYY'); // 06/01/2019
    }else{
        this.nextContactDate = 'No contact date';
    }

    this.project.versions.forEach((projectVersion) => {
      if (projectVersion.is_current_version) {
        this.totalProjectBuildings =
          projectVersion.buildings.length - 1;
      }
    });

    const lastVersion =
      this.project.versions[this.project.versions.length - 1];
    this.isLastVersion = this.version.id === lastVersion.id;
  }

  /**
   * Open popover for select de current version
   */
  async openPopoverVersion(ev: any) {
    const modal = await this.popoverController.create({
      component: PopoverProspectingVersionComponent,
      event: ev,
      componentProps: {
        versions: this.project.versions,
        salesManId: this.project.user_saleman.id_user
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }

    let versions: Version[];
    if (data.createNew) {
      const activeVersion = this.project.versions.find(x => x.active);
      const newVersion = this.createNewVersion(activeVersion);

      versions = [...this.project.versions.map((x) => {
        return { ...x, active: false, is_current_version: false, isModified: true };
      }), newVersion];

    } else {
      versions = this.project.versions.map((x) => {
        if (data.id == x.id) {
          return { ...x, active: true, is_current_version: true, isModified: true };
        } else {
          return { ...x, active: false, is_current_version: false, isModified: true };
        }
      });
    }

    const projectUpdated = { ...this.project, versions: versions, isModified:true };
    await this.projectService.update(this.project.id, projectUpdated);
    this.changeVersionEmited.emit(true);
  }


  private createNewVersion(activeVersion: Version) {
    this.projectService.saveVersion({...this.version, active: false, is_current_version: false});

    const lastVersion = this.project.versions[this.project.versions.length - 1];
    const nextProjectVersion = this.getNextProjectVersion(lastVersion.project_version);
    const newVersionId = uuidv4();

    return {
      ...activeVersion,
      id: newVersionId,
      project_version: nextProjectVersion,
      active: true,
      is_current_version: true,
      isModified: true,
      id_cost_type: activeVersion.id_cost_type ?? 1,
      shingle_lines: activeVersion.shingle_lines.map(x => ({ ...x, id: uuidv4(), id_version: newVersionId, isModified: true })),
      pv_trademarks: activeVersion.pv_trademarks.map(x => ({ ...x, id: uuidv4(), id_version: newVersionId, isModified: true })),
      buildings: activeVersion.buildings.map((building) => {
        const newBuildingId = uuidv4();
        let newMeasure = null;
        if (building.psb_measure) {
          const newMeasureId = uuidv4();
          const newVerifies = building.psb_measure.psb_verifieds?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newNoRequireds = building.psb_measure.psb_no_requireds?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newSlopes = building.psb_measure.psb_slopes?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newLayers = building.psb_measure.psb_layers?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newOptions = building.psb_measure.psb_options?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newCrickets = building.psb_measure.psb_crickets?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newChimneys = building.psb_measure.psb_chimneys?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newSkylights = building.psb_measure.psb_skylights?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newMaterials = building.psb_measure.psb_selected_materials?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));
          const newUpgrades = building.psb_measure.psb_upgrades?.map((v) => ({ ...v, id: uuidv4(), id_psb_measure: newMeasureId, isModified: true }));

          newMeasure = {
            ...building.psb_measure,
            id: newMeasureId,
            id_project_building: newBuildingId,
            psb_verifieds: newVerifies,
            psb_no_requireds: newNoRequireds,
            psb_slopes: newSlopes,
            psb_layers: newLayers,
            psb_options: newOptions,
            psb_crickets: newCrickets,
            psb_chimneys: newChimneys,
            psb_skylights: newSkylights,
            psb_selected_materials: newMaterials,
            psb_upgrades: newUpgrades,
            isModified: true
          };
        }

        return { ...building, pb_scopes: [], id: newBuildingId, psb_measure: newMeasure, isModified: true };
      })
    };
  }

  getNextProjectVersion(projectVersion: string) {
    let versionNumber = +projectVersion.toLowerCase().match(/v(\d+)/)[1];
    return `V${++versionNumber}-${new Date().toLocaleDateString()}`;
  }

  goToMaps(adress: string){
    adress = adress.replace(' ', '+');
    // window.open('https://www.google.com/maps/place/' + adress, '_blank');
    const url = `https://www.google.com/maps/place/${encodeURIComponent(adress)}`;
    InAppBrowser.create(url, '_system');
  }
}
