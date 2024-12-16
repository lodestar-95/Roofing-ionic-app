import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { Project } from 'src/app/models/project.model';
import { PsbNoRequired } from 'src/app/models/psb_no_required.model';
import { CricketsComponent } from 'src/app/prospecting/modals/crickets/crickets.component';
import { PsbVerified } from 'src/app/models/psb_verified.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-details-segment',
  templateUrl: './details-segment.component.html',
  styleUrls: ['./details-segment.component.scss'],
})
export class DetailsSegmentComponent implements OnInit, OnDestroy {
  @Output() changeSegmentEmmited = new EventEmitter<string>();

  project: Project;
  buildings: Building[];
  building: Building;
  psbMeasures: PsbMeasures;
  projectShingleNoRequired: PsbNoRequired[];
  psbVerifieds: PsbVerified[];

  totalCrickets: number = 0;
  totalChimneys: number = 0;
  totalSkylights: number = 0;
  cricketsNoRequired: boolean;
  chimneysNoRequired: boolean;
  skylightsNoRequired: boolean;
  detailsActive: boolean;
  showIconError: boolean;
  openTargets: string[] = ['crickets'];
  userDisabledPermision = false;
  storeSubs: Subscription;
  buildingVerified = false;

  constructor(
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private modalController: ModalController,
    private synProjects: SyncProjectsService,
    private rolesPermissionsService: RolesPermissionsService) {
      this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      this.loadProjectShingleBuilding();
      this.validateRolePermission();

    });
  }

  ngOnInit() { }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  accordionGroupChange(event) {
    this.openTargets = event.detail.value;
  }

  loadProjectShingleBuilding() {
    if (!this.project || this.project?.versions?.length == 0) {
      return
    }
    
    const { buildings } = this.project.versions.find(
      (x) => x.active
    );

    this.buildings = buildings;
    this.building = buildings.find((x) => x.active);
    this.buildingVerified = this.project.versions.find((x) => x.active).is_verified;

    if (this.building) {
      this.psbMeasures = {
        ...this.building.psb_measure,
      };

      this.projectShingleNoRequired = this.psbMeasures
        .psb_no_requireds
        ? [...this.psbMeasures.psb_no_requireds]
        : [];

      this.psbVerifieds = this.psbMeasures
        .psb_verifieds
        ? [...this.psbMeasures.psb_verifieds]
        : [];
      this.totalCrickets = this.psbMeasures.psb_crickets ? this.psbMeasures.psb_crickets.filter((x)=> x.deletedAt == null).length : 0;
      this.totalChimneys = this.psbMeasures.psb_chimneys ? this.psbMeasures.psb_chimneys.filter((x)=> x.deletedAt == null).length : 0;
      this.totalSkylights = this.psbMeasures.psb_skylights ? this.psbMeasures.psb_skylights.filter((x)=> x.deletedAt == null).length : 0;
    }

    this.cricketsNoRequired = this.findModuleNoRequired(1);
    this.chimneysNoRequired = this.findModuleNoRequired(2);
    this.skylightsNoRequired = this.findModuleNoRequired(3);
    this.detailsActive = this.findModal(8);
  }

  findModuleNoRequired(idResource: number) {
    const required = this.projectShingleNoRequired.find(
      (x) => x.id_resource == idResource
    );
    return required ? required.no_required : false;
  }

  findModal(idResource: number) {
    const verifiedInformation = this.psbVerifieds.find(
      (x) => x.id_resource == idResource
    );
    return verifiedInformation ? verifiedInformation.is_verified : false;
  }

  async openModalCricket() {
    const modal = await this.modalController.create({
      component: CricketsComponent,
      cssClass: 'screen-750',
      componentProps: {
        totalCrickets: this.totalCrickets,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (!data) {
      return;
    }
  }

  onNoRequiredCheked(event, option: number) {
    let optionUpdated = true;
    if(option==1){
      optionUpdated = !this.cricketsNoRequired; 
    }else if(option==2){
      optionUpdated = !this.chimneysNoRequired;
    }else if(option==3){
      optionUpdated = !this.skylightsNoRequired;
    }

    const psb_no_requireds = this.projectService.getShingleNoRequired(option, optionUpdated);

    const project_shingle_building: PsbMeasures = {
      ...this.building.psb_measure,
      psb_no_requireds
    };

    this.projectService.saveProjectShingleBuilding(project_shingle_building);

  }

  /**
 * Verified information before save data
 * @returns
 */
  onVerifiedCheked(event) {
    if (event || (this.cricketsNoRequired || this.totalCrickets > 0) && 
      (this.chimneysNoRequired || this.totalChimneys > 0) && 
      (this.skylightsNoRequired || this.totalSkylights > 0)) {
      this.showIconError = false;
      const psb_verifieds = this.projectService.getShingleVerifiedInformation(8, !this.detailsActive);

      const project_shingle_building: PsbMeasures = {
        ...this.building.psb_measure,
        psb_verifieds
      };

      this.projectService.saveProjectShingleBuilding(project_shingle_building);
      setTimeout(() => {
        if(!event){
          this.synProjects.syncOffline();
          this.changeSegmentEmmited.emit('other-measures');
        }
      }, 500);
    } else {
      this.showIconError = true;
    }
  }

  validateRolePermission(){
    this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project ).
    then((result) => {
     this.userDisabledPermision = result;
    });
   }

}
