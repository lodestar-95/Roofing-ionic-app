import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { v4 as uuidv4 } from 'uuid';

import { AppState } from 'src/app/app.reducer';
import { ShingleLine } from 'src/app/models/shingle-lines.model';
import { Version } from 'src/app/models/version.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { Subscription } from 'rxjs';
import { Trademark } from 'src/app/models/trademark.model';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { Project } from 'src/app/models/project.model';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

interface Options {
  id: number;
  id_material_category: number;
  id_trademark: number;
  material_type: string;
  is_selected?: boolean;
  idShingleLine?: number;
}

interface shingleLinesRadios {
  title: string;
  color: string;
  options: Options[];
}

@Component({
  selector: 'app-single-lines-checkbox',
  templateUrl: './single-lines-checkbox.component.html',
  styleUrls: ['./single-lines-checkbox.component.scss'],
})
export class SingleLinesCheckboxComponent implements OnInit {
  canModifyProposal = true;
  options: shingleLinesRadios[] = [];
  version: Version;
  storeSubs: Subscription;
  idAux: number;
  trademarkSelection = [];
  project: Project;
  userDisabledPermision = false;
  alwaysAllowModification: boolean;

  constructor(
    private catalogsService: CatalogsService,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private general: GeneralService
  ) {
    // debugger
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      // debugger
      this.project = state.project;
      if (!this.project || this.project.versions.length == 0) {
        return;
      }
      this.canModifyProposal = this.project?.project_status?.id == 1 || this.project?.project_status?.id == 2;
      this.validateRolePermission();
      this.version = this.project.versions.find((x) => x.active);
      const trademarkSelectionChanged = this.isTrademarkSelecionChanged();

      if (this.idAux != this.version.id || trademarkSelectionChanged) {
        this.getRadioButtons();
      }
      this.getAlwaysAllowModification();
    });
  }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
  }

  isTrademarkSelecionChanged() {
    const currentSelection = this.version.pv_trademarks.filter(x => x.selected == true).map(x => x.id_trademarks);
    if (this.trademarkSelection.length != currentSelection.length) {
      return true;
    }

    if (this.trademarkSelection.some(x => !currentSelection.includes(x))) {
      return true;
    }

    return false;
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() {
    // debugger
    // this.getRadioButtons();
  }

  /**
   * Get titles and radio buttons
   */
  getRadioButtons() {
    this.idAux = this.version.id;
    this.options = [];

    this.catalogsService.getTrademarks().then(async (result1) => {
      let trademarks = [...result1.data];
      trademarks = trademarks.filter((x) => x.is_shingle_trademark == true);

      const trademarksSelected = this.version.pv_trademarks.filter(
        (x) => x.selected == true
      );

      let trademarksAux: Trademark[] = [];
      trademarksSelected.forEach(element => {
        const exist = trademarks.find(x => x.id == element.id_trademarks);
        if (exist) {
          trademarksAux.push(exist);
        }
        else {
          trademarksAux = trademarks.filter(x => x.id != element.id_trademarks);
        }
      });

      trademarks = trademarksAux;
      this.trademarkSelection = trademarks.map(x => x.id);

      let allMaterialTypes = [];
      await this.catalogsService
        .getMeasuresMaterialTypes()
        .then((result2) => {
          allMaterialTypes = result2.data.filter((x) => x.id_material_category == 2
            || x.id_material_category == 3
            || x.id_material_category == 36
            || x.id_material_category == 37
          );

          for (let trademark of trademarks) {
            const materialTypes = allMaterialTypes.filter(
              (x) => x.id_trademark == trademark.id
            );
            this.options.push({
              title: trademark.trademark,
              color: `color: ${trademark.color}`,
              options: materialTypes,
            });
          }

          this.saveInitialRadios(this.options, allMaterialTypes);
        });
    });
  }

  /**
   * Save en local inicitial radio buttons
   * @param elements
   */
  saveInitialRadios(elements: shingleLinesRadios[], allMaterialTypes: any[]) {
    let shinlesLines: ShingleLine[] = [];

    elements.forEach((element) => {
      element.options.forEach((option) => {

        const shingleLine = this.version.shingle_lines ? this.version.shingle_lines.find(
          (x) => x.id_material_type == option.id
        ) : undefined;

        const sl: ShingleLine = {
          id: uuidv4(),
          id_material_type: option.id,
          id_version: this.version.id,
          is_selected: false,
          isModified: true
        };

        const exist = this.version.shingle_lines.find(x => x.id_material_type == option.id);
        if (exist) {
          shinlesLines.push(exist);
        }
        else {
          shinlesLines.push(sl);
        }
        option.idShingleLine = shingleLine?.id ? shingleLine?.id : sl.id;
        option.is_selected =
          shingleLine?.is_selected != undefined
            ? shingleLine.is_selected
            : false;
      });
    });

    let shingleLines = [];
    for (const materialType of allMaterialTypes) {
      const shingleMaterial = shinlesLines.find(x => x.id_material_type == materialType.id);
      if (shingleMaterial) {
        shingleLines.push({ ...shingleMaterial, isModified: true });
      } else {
        const shingleVersion = this.version.shingle_lines.find(x => x.id_material_type == materialType.id);
        if (shingleVersion) {
          shingleLines.push({ ...shingleVersion, is_selected: false, isModified: true });
        }
      }
    }

    const version = { ...this.version, shingle_lines: shingleLines, isModified: true };

    // if (
    //   !this.version.shingle_lines ||
    //   this.version.shingle_lines?.length == 0
    // ) {
    this.projectService.saveVersion(version);
    // }
  }

  /**
   *
   * @param radio
   */
  onCheckboxChanged(radio: Options) {
    const { shingle_lines } = this.version;

    const shingleLinesUpdated = shingle_lines.map((x) => {
      if (x.id == radio.idShingleLine) {
        return { ...x, is_selected: radio.is_selected, isModified: true };
      } else {
        return { ...x };
      }
    });

    if(!shingleLinesUpdated.some(x=>x.id == radio.idShingleLine)){
      const sl: ShingleLine = {
        id: uuidv4(),
        id_material_type: radio.id,
        id_version: this.version.id,
        is_selected: radio.is_selected,
        isModified: true
      };

      shingleLinesUpdated.push(sl);
    }

    const version = { ...this.version, shingle_lines: shingleLinesUpdated };
    this.projectService.saveVersion(version);
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
