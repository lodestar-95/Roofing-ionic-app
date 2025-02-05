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

  selectionJobType:number|null = null;
  selectionWindWarrantyDeclined:boolean = false;
  selectionHasRidgecap:boolean = false;
  selectionHasSlopes:boolean = false;
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
  getJobType(){
    this.selectionJobType = this.building.id_job_type;
    return this.building.id_job_type;
  }
  getWindWarranty(){
    const hasWindWarrantyDeclined = this.building.psb_measure.id_inwshield_rows==3?true:false;
    this.selectionWindWarrantyDeclined = hasWindWarrantyDeclined;
    return hasWindWarrantyDeclined;
  }
  getRidgecap(){
    if(
        (this.building.psb_measure.ridge_lf && this.building.psb_measure.ridge_lf > 0) ||
        (this.building.psb_measure.hips_lf && this.building.psb_measure.hips_lf > 0)
    ){
        //hay RidgeCap seleccionado, por lo tanto si se requiere la seleccion
        this.selectionHasRidgecap = true;
        return true;
    }
    return false;
  }
  getLowSlope(): boolean {
    const hasLowSlopes = this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 2 && x.pitch < 4 && !x.deletedAt) ?? false
    this.selectionHasSlopes = hasLowSlopes
    return hasLowSlopes;
  }
  getStepSlope(): boolean {
    const hasStepSlopes = this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 4 && !x.deletedAt) ?? false
    this.selectionHasSlopes = hasStepSlopes;
    return hasStepSlopes;
  }

  initData() {
    this.selectionJobType = this.getJobType();
    this.selectionWindWarrantyDeclined = this.getWindWarranty();
    this.selectionHasRidgecap = this.getRidgecap();
//    this.selectionHasSlopes = this.getLowSlope();
    this.selectionHasSlopes = this.getStepSlope();

    this.verifiedActive = this.findResource(12);//Check if the resource is validated.
    if(this.isRequired()){
        //Revisamos si existen trademarks
        if (!this.version?.pv_trademarks) {
          return;
        }

        //recuperamos todos los trademarks que estan seleccionados
        console.log('this.version.pv_trademarks', this.version.pv_trademarks)
        const pv_trademarks = this.removeDuplicateTradeMarks(this.version.pv_trademarks);

        console.log('_pv_trademarks', pv_trademarks)

        this.trademarksSelected = pv_trademarks.filter(
          (x) => x.selected == true
        );

        if (!this.building.psb_measure.psb_selected_materials) {
          return;
        }

        const materialSelected = this.removeDuplicateMaterialSelected(this.building.psb_measure.psb_selected_materials);

        this.isCompleted = this.trademarksSelected?.length > 0;
        this.trademarksSelected.forEach((element) => {
          const materials = materialSelected.filter(
            (x) => x.id_trademark_shingle == element.id_trademarks
          );

          const materialCount = materials.filter(x => !x.deletedAt && x.id_material_category !== 15).length;
          this.isCompleted = this.validateMaterialCount(materialCount);
        });
    }
  }

  removeDuplicateTradeMarks(arr) {
    const seen = new Map();

    return arr.filter(item => {
      if (seen.has(item.id_trademarks)) {
        return false;
      } else {
        seen.set(item.id_trademarks, true);
        return true;
      }
    });
  }

  removeDuplicateMaterialSelected(arr) {
        const seen = new Map();

        return arr.filter(item => {
            const key = `${item.id_trademark_shingle}-${item.id_material_type_selected}`;
            if (seen.has(key)) {
                return false;
            } else {
                seen.set(key, true);
                return true;
            }
        });
    }


  validateMaterialCount(materialCount:number){
    const isThreeMaterials = materialCount == 3;
    const isRidgeVentsDeclined = this.isRidgeVentsDeclined();
    const isWithoutRidge = this.withOutRidge;
    const inwshieldRows = this.building.psb_measure.id_inwshield_rows;
    const isOverlay = this.isOverlay();
    const hasLowS = this.hasLowSlope();

    const condition1 = isThreeMaterials;
    const condition2 = isRidgeVentsDeclined && materialCount == 2;
    const condition3 = isRidgeVentsDeclined && isWithoutRidge && materialCount == 1;
    const condition4 = inwshieldRows == 3 && ((materialCount == 2 && !hasLowS) || (materialCount == 3 && hasLowS));
    const condition5 = inwshieldRows == 4 && materialCount == 2;
    const condition6 = ((!this.isInWShieldCompleteRoof() && !hasLowS) || isOverlay) && materialCount == 1;
    const condition7 = (hasLowS || isOverlay) && materialCount == 2;

    if (condition1 || condition2 || condition3 || condition4 || condition5 || condition6 || condition7) {
        return this.isCompleted && true;
    } else {
        return  false;
    }
  }

  isRequired(){
    let needRidgecap = true;
    let needUnderlayment = true;
    let needIWShields = true;
    //RidgeCap
    if (this.selectionJobType === 16 || !this.selectionHasRidgecap){
        needRidgecap = false;
    }

    //Uderlayment
    /*if (!this.selectionHasSlopes && !this.selectionWindWarrantyDeclined) {
        needUnderlayment = false;
    }*/
    if (!this.selectionHasSlopes) {
      needUnderlayment = false;
    }

    if (this.selectionJobType === 16 || this.selectionJobType === 14) {
        needUnderlayment = false;
    }
    if (this.isInWShieldCompleteRoof()) {
        needUnderlayment = false;
    }

    //Ice and Water Shields
    if (this.selectionWindWarrantyDeclined) {
        needIWShields = false
    }
    if (this.selectionJobType === 16 || this.selectionJobType === 14) {
        needIWShields = false
    }

    if(needRidgecap || needUnderlayment || needIWShields){
        return true;
    }else{
        //No se requiere
        this.setAsNoRequired(12)
        return false;
    }


  }
  setAsNoRequired(idResource: number){
    this.isCompleted = true;
    this.notRequired = true;
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



  hasLowSlope(): boolean {
    return this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 2 && x.pitch < 4 && !x.deletedAt) ?? false;
  }

  isOverlay(): boolean {
    return this.building.id_job_type == 14;
  }
  isInWShieldCompleteRoof(): boolean {
    return this.building.psb_measure.id_inwshield_rows == 4;
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
    console.log(this.building.psb_measure.psb_upgrades);
    try {
      return (
        this.building.psb_measure.psb_upgrades.find((x) => x.id_upgrade == 2)
          .id_cost_integration == 3
      );
    } catch (error) {
      return true;
    }
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
