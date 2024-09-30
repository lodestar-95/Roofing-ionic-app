import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { PbScope } from 'src/app/models/pb-scope.model';
import { Project } from 'src/app/models/project.model';
import { ScopeEditModalComponent } from '../../modals/scope-edit-modal/scope-edit-modal.component';
import { v4 as uuidv4 } from 'uuid';
import { ProjectsService } from 'src/app/services/projects.service';
import { Version } from 'src/app/models/version.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProposalDescriptionsService } from 'src/app/services/proposal-descriptions.service';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';
import { Router } from '@angular/router';
import { HashCodeService } from 'src/app/shared/helpers/hash-code.service';
import { LoadingService } from 'src/app/shared/helpers/loading.service';

interface BuldingListItem extends Building { }

@Component({
  selector: 'app-scope-of-work-list',
  templateUrl: './scope-of-work-list.component.html',
  styleUrls: ['./scope-of-work-list.component.scss']
})
export class ScopeOfWorkListComponent implements OnInit, OnDestroy {
  storeSubs: Subscription;
  project: Project;
  buildings: BuldingListItem[] | Building[];
  version: Version;
  arquictectural: boolean;
  notArquitectural: boolean;
  materials: any;
  processing = false;
  private processCount = 0;

  constructor(
    private store: Store<AppState>,
    private modalController: ModalController,
    private projectService: ProjectsService,
    private catalogService: CatalogsService,
    private dS: ProposalDescriptionsService,
    private general: GeneralService,
    private router: Router,
    private hash: HashCodeService,
    private loadingService: LoadingService
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.project = state.project;

      if (!this.project) {
        return;
      }

      if (!this.router.url.includes('/scope-of-work')) {
        return;
      }

      this.arquictectural = false;
      this.notArquitectural = false;
      this.version = this.project.versions.find(x => x.active);

      if (!this.version) {
        return;
      }
      const { buildings } = this.version;
      const _buildingsActive = buildings.filter(x => x.deletedAt == null);
      this.buildings = [..._buildingsActive];
      this.assingCategoryMaterial();
    });
  }

  ngOnInit() { }

  async assingCategoryMaterial() {
    const category_architectural_regular_shingle =
      await this.general.getConstDecimalValue('category_architectural_regular_shingle');
    const category_presidential_shingle = await this.general.getConstDecimalValue(
      'category_presidential_shingle'
    );
    const category_architectural_thick_shingle = await this.general.getConstDecimalValue(
      'category_architectural_thick_shingle'
    );
    const category_presidential_tl_shingle = await this.general.getConstDecimalValue(
      'category_presidential_tl_shingle'
    );

    this.materials = await this.catalogService.getMeasuresMaterialTypes();
    const newShinglesLines = this.version.shingle_lines.map(elementt => {
      const newPropsObj = {
        ...elementt,
        id_material_category: this.findMaterialCategory(
          this.materials,
          elementt.id_material_type
        )
      };
      return newPropsObj;
    });
    newShinglesLines.forEach(elementShingle => {
      if (elementShingle.is_selected === true) {
        if (
          elementShingle.id_material_category ===
          category_architectural_regular_shingle ||
          elementShingle.id_material_category === category_architectural_thick_shingle
        ) {
          this.arquictectural = true;
        } else if (
          elementShingle.id_material_category === category_presidential_shingle ||
          elementShingle.id_material_category === category_presidential_tl_shingle
        ) {
          this.notArquitectural = true;
        }
      }
    });

    this.initScopes();
  }

  findMaterialCategory(materials, materialId) {
    const found = materials.data.find(obj => obj.id === materialId);
    return found.id_material_category;
  }

  validateStatus(scope) {
    if (scope.is_architectural === true) {
      return this.arquictectural;
    } else {
      return this.notArquitectural;
    }
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Initializes the values of the first scopes when they do not exist
   */
  async initScopes() {
    if (this.processCount == 0) {
      this.loadingService.show();
    }
    this.processCount++;
    let buildings: Building[] = [];
    let count = 0;

    if (this.processing) {
      this.hideLoading();
      return;
    }
    const proposalHaveChanges = this.validateProposalHaveChanges();
    if (proposalHaveChanges) {
      this.processing = true;
    }

    for (let element of this.buildings) {
      let scopes: PbScope[] = [];
      if (element.pb_scopes) {
        scopes = [...element.pb_scopes];
      }

      const slopes = scopes.filter(x => x.id_building == element.id);

      const existArchitectural = slopes.find(x => x.is_architectural);
      const existPresidential = slopes.find(x => x.is_architectural == false);

      if (!existArchitectural) {
        const scope = new PbScope(
          uuidv4(),
          element.id,
          '',
          false,
          false,
          null,
          true,
          false,
          null
        );
        scopes.push(scope);
        count++;
      }
      if (!existPresidential) {
        const scope = new PbScope(
          uuidv4(),
          element.id,
          '',
          false,
          false,
          null,
          false,
          false,
          null
        );
        scopes.push(scope);
        count++;
      }

      let newScopes: PbScope[] = [];
      for (const scope of scopes) {
        let _scope = { ...scope };
        if (!scope.scope_of_work || scope.scope_of_work === '' || proposalHaveChanges) {
          const building = this.buildings.find(x => x.id == scope.id_building);
          _scope.is_modified = false;
          _scope.scope_of_work = await this.dS.generateText(
            scope,
            building,
            this.version,
            this.materials,
            this.project
          );
          count++;
        }
        newScopes.push(_scope);
      }
console.log("await this.dS.generateText finished");
      const previosLength = newScopes.length;
      const architecturalScope = newScopes.find(x => x.is_architectural == true);
      const presidentialScope = newScopes.find(x => x.is_architectural == false);
      newScopes = [architecturalScope, presidentialScope];
      if (previosLength != newScopes.length) count++;

      const building: Building = this.buildings.find(x => x.id == element.id);
      const buildingUpdated = { ...building, isModified: true, pb_scopes: newScopes };
      buildings.push(buildingUpdated);
    }
    console.log("updateBuildings");

    if (count > 0) {
      const version: Version = { ...this.version, isModified: true, buildings };
      this.projectService.saveVersion(version);
      const versionWithoutScope = this.getVersionWithoutScope(version);
      const hashcode = this.hash.getHashCode(JSON.stringify(versionWithoutScope));
      localStorage.setItem('versionCode', hashcode.toString());
      this.processing = false;
      console.log("versionCode");
    }
    console.log("hideLoading");
    this.hideLoading();
    console.log("hideLoading finished");
  }

  private hideLoading() {
    this.processCount--;
    console.log(this.processCount);

    if (this.processCount <= 0) {
      console.log("this.loadingService.hide()");
      this.loadingService.hide();
    }
  }

  validateProposalHaveChanges() {
    const versionWithoutScope = this.getVersionWithoutScope(this.version);
    const versionText = JSON.stringify(versionWithoutScope);
    const hash = this.hash.getHashCode(versionText);

    const previousCode = localStorage.getItem('versionCode');
    return hash.toString() !== previousCode;

  }

  getVersionWithoutScope(version: Version) {
    const buildings = version.buildings.map(x => {
      return { ...x, pb_scopes: [] };
    });

    return { ...version, buildings };
  }

  /**
   * Open the modal window to edit a scope
   * @param building
   */
  async onClickEdit(building: BuldingListItem, isArchitectural: boolean) {
    const modal = await this.modalController.create({
      component: ScopeEditModalComponent,
      componentProps: {
        building,
        isArchitectural,
        project: this.project
      },
      backdropDismiss: false
    });

    await modal.present();
    await modal.onWillDismiss();
  }
}
