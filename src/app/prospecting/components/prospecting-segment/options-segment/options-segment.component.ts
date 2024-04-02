import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { OptionsComponent } from 'src/app/prospecting/modals/options/options.component';
import { ProjectsService } from 'src/app/services/projects.service';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';

@Component({
  selector: 'app-options-segment',
  templateUrl: './options-segment.component.html',
  styleUrls: ['./options-segment.component.scss'],
})

/**
 * @author: Carlos Rodríguez
 */
export class OptionsSegmentComponent implements OnInit, OnDestroy {
  @Output() changeSegmentEmmited = new EventEmitter<string>();
  
  isRequired: boolean = true;
  project: Project;
  building: Building;
  buildings: Building[];
  verifiedActive: boolean;
  showIconError: boolean;
  storeSubs: Subscription;
  userDisabledPermision = false;
  buildingVerified = false;

  constructor(
    private modalController: ModalController,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private synProjects: SyncProjectsService,
    private rolesPermissionsService: RolesPermissionsService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;

      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find((x) => x.active);
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
      this.buildingVerified = this.project.versions.find((x) => x.active).is_verified;

      if (!this.building) {
        return;
      }
      if (this.building.psb_measure) {
        this.verifiedActive = this.findResource(10);
      }

      if (!this.building?.psb_measure?.psb_no_requireds) {
        return;
      }

      if (!this.building?.psb_measure?.psb_no_requireds) {
        return;
      }

      let psbNoRequireds = this.building?.psb_measure?.psb_no_requireds.find(x => x.id_resource == 10);
      if (psbNoRequireds != undefined) {
        this.isRequired = !psbNoRequireds.no_required;
      }
      this.validateRolePermission();
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() {}

  /**
   * Open options modal
   */
  async openModalOptions() {
    const modal = await this.modalController.create({
      component: OptionsComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (!data) {
      return;
    }
  }

  onRequiredChanged() {
    this.isRequired = !this.isRequired;
    const psb_no_requireds = this.projectService.getShingleNoRequired(
      10,
      !this.isRequired,
      true
    );
    const psbMeasure: PsbMeasures = {
      ...this.building.psb_measure,
      psb_no_requireds,
    };

    this.projectService.saveProjectShingleBuilding(psbMeasure);

    // this.onVerifiedCheked();
  }

  onVerifiedCheked(event?) {
    if (
      (this.building.psb_measure.psb_options &&
        this.building.psb_measure.psb_options.length > 0) ||
      event ||
      !this.isRequired
    ) {
      this.showIconError = false;

      const psb_verifieds = this.projectService.getShingleVerifiedInformation(
        10,
        !this.verifiedActive
      );

      const project_shingle_building: PsbMeasures = {
        ...this.building.psb_measure,
        psb_verifieds,
      };

      this.projectService.saveProjectShingleBuilding(project_shingle_building);

      setTimeout(() => {
        if(!event){
          this.synProjects.syncOffline();
          this.changeSegmentEmmited.emit('upgrade');
        }
      }, 500);
    } else {
      this.showIconError = true;
    }
  }

  findResource(idResource: number) {
    if (!this.building.psb_measure.psb_verifieds) {
      return false;
    }

    const verifiedInformation = this.building.psb_measure.psb_verifieds.find(
      (x) => x.id_resource == idResource
    );
    return verifiedInformation ? verifiedInformation.is_verified : false;
  }

  validateRolePermission(){
    this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project).
    then((result) => {
     this.userDisabledPermision = result;
    });
   }
}
