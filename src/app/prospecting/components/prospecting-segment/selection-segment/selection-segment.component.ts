import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PvTrademarks } from 'src/app/models/pv_trademarks.model';
import { Version } from 'src/app/models/version.model';
import { selectProjectWithoutRidgeHips } from 'src/app/prospecting/state/propsecting.selectors';
import { ProjectsService } from 'src/app/services/projects.service';
import { SyncProjectsService } from 'src/app/services/sync-projects.service';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';

@Component({
  selector: 'app-selection-segment',
  templateUrl: './selection-segment.component.html',
  styleUrls: ['./selection-segment.component.scss'],
})
export class SelectionSegmentComponent implements OnInit, OnDestroy {
  @Output() showBuildingsEmmited = new EventEmitter<any>();
  verifiedActive: boolean;
  showIconError: boolean;
  version: Version;
  building: Building;
  trademarksSelected: PvTrademarks[];
  storeSubs: Subscription;
  isCompleted: boolean;
  isAllSegmentsOk: boolean = false;
  userDisabledPermision = false;
  project: Project;
  buildingVerified = false;
  withOutRidge:boolean;
  notRequired:boolean = false;
  constructor(
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private synProjects: SyncProjectsService,
    private rolesPermissionsService: RolesPermissionsService
  ) {
    this.store.pipe(select(selectProjectWithoutRidgeHips)).subscribe(value => this.withOutRidge = value);

    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      const project = state.project;
      if (!project) {
        return;
      }

      this.version = project.versions.find((x) => x.active);
      if (!this.version) {
        return;
      }

      this.building = this.version.buildings.find((x) => x.active);
      this.buildingVerified = project.versions.find((x) => x.active).is_verified;
      this.initData();
      this.validateSegments();
      this.validateRolePermission();
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() { }


  /**
   * Initial info
   */
  initData() {
    this.verifiedActive = this.findResource(12);//Check if the resource is validated.
    if(!this.isNotRequired()){
        //Revisamos si existen trademarks
        if (!this.version?.pv_trademarks) {
          return;
        }
    
        //recuperamos todos los trademarks que estan seleccionados
        this.trademarksSelected = this.version.pv_trademarks.filter(
          (x) => x.selected == true
        );
    
        console.log('this.trademarksSelected', this.trademarksSelected)
        console.log('this.building.psb_measure.psb_selected_materials', this.building.psb_measure.psb_selected_materials)
        
        if (!this.building.psb_measure.psb_selected_materials) {
          return;
        }
        this.isCompleted = this.trademarksSelected?.length > 0;
        this.trademarksSelected.forEach((element) => {
          const materials = this.building.psb_measure.psb_selected_materials.filter(
            (x) => x.id_trademark_shingle == element.id_trademarks
          );
    
          const materialCount = materials.filter(x => !x.deletedAt && x.id_material_category !== 15).length;
          const hasLowS = this.hasLowSlope();
          if (
            materialCount == 3 ||
            (this.isRidgeVentsDeclined() && materialCount == 2) ||
            (this.isRidgeVentsDeclined() && this.withOutRidge && materialCount == 1) ||
            (this.building.psb_measure.id_inwshield_rows == 3 && ((materialCount == 2 && !hasLowS) || (materialCount == 3 && hasLowS))) ||
            (this.building.psb_measure.id_inwshield_rows == 4 && materialCount == 2) ||
            ((!hasLowS && this.isOverlay()) && materialCount == 1) ||
            (hasLowS && this.isOverlay() && materialCount == 2)
          ) {
            this.isCompleted = this.isCompleted && true;
          } else {
            this.isCompleted = false;
          }
        });
    }
  }

  isNotRequired(){
    if(
        (this.building.psb_measure.ridge_lf && this.building.psb_measure.ridge_lf > 0) ||
        (this.building.psb_measure.hips_lf && this.building.psb_measure.hips_lf > 0)
    ){
        //hay RidgeCap seleccionado, por lo tanto si se requiere la seleccion
        return false;
    }

    //No se requiere
    this.setAsNoRequired(12)
    return true;
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

  setAsNoRequired(idResource: number){
        this.isCompleted = true;
        this.notRequired = true;
        //this.verifiedActive = true;
  }

  hasLowSlope(): boolean {
    return this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 2 && x.pitch < 4 && !x.deletedAt) ?? false;
  }

  isOverlay(): boolean {
    return this.building.id_job_type == 14;
  }

  /**
   * Check if the information is correct
   */
  onVerifiedCheked(event) {
    if (this.isCompleted || event) {
      this.showIconError = false;

      const psb_no_requireds = this.projectService.getShingleNoRequired(12, true, true);
      const psb_verifieds = this.projectService.getShingleVerifiedInformation(
        12,
        !this.verifiedActive
      );
      const project_shingle_building: PsbMeasures = {
        ...this.building.psb_measure,
        psb_verifieds,
        psb_no_requireds
      };

      this.projectService.saveProjectShingleBuilding(project_shingle_building);
      setTimeout(() => {
        if (!event) {
          this.synProjects.syncOffline();
        }
      }, 500);
    } else {
      this.showIconError = true;
    }
  }

  

  /**
   * Show buildings list
   */
  showBuildings() {
    this.showBuildingsEmmited.emit(true);
  }

  /**
   * Is Ridge Vents declined?
   * @returns
   */
  isRidgeVentsDeclined(): boolean {
    if (!this.building.psb_measure?.psb_upgrades) {
      return false
    }

    return (
      this.building.psb_measure.psb_upgrades.find((x) => x.id_upgrade == 2)
        .id_cost_integration == 3
    );
  }

  validateSegments() {
    this.isAllSegmentsOk =
      this.projectService.findResourceId(6) &&
      this.projectService.findResourceId(7) &&
      this.projectService.findResourceId(8) &&
      this.projectService.findResourceId(9) &&
      this.projectService.findResourceId(10) &&
      this.projectService.findResourceId(11) &&
      this.projectService.findResourceId(12);
  }

  validateRolePermission() {
    this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project).
      then((result) => {
        this.userDisabledPermision = result;
      });
  }
}
