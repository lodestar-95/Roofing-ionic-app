import { Component, OnDestroy, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import { GroupColor } from 'src/app/models/group-color.model';
import { Group } from 'src/app/models/group.model';
import { Project } from 'src/app/models/project.model';
import { PvColor } from 'src/app/models/pv_color.model';
import { Version } from 'src/app/models/version.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { PopoverGroupColorsComponent } from '../popover-group-colors/popover-group-colors.component';
import { v4 as uuidv4 } from 'uuid';
import { ProjectsService } from 'src/app/services/projects.service';
import { Subscription } from 'rxjs';
import { RolesPermissionsService } from 'src/app/shared/helpers/roles-permissions.service';
import { GeneralService } from '../../calculation/materials/general.service';

@Component({
  selector: 'app-costs-colors',
  templateUrl: './costs-colors.component.html',
  styleUrls: ['./costs-colors.component.scss'],
})
export class CostsColorsComponent implements OnInit, OnDestroy {
  groups: Group[];
  groupColors: GroupColor[];
  version: Version;
  storeSubs: Subscription;
  canModifyProposal = true;
  userDisabledPermision = false;
  project: Project;
  alwaysAllowModification: boolean;

  constructor(
    private popoverCtrl: PopoverController,
    private catalogs: CatalogsService,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private rolesPermissionsService: RolesPermissionsService,
    private general: GeneralService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }

      this.canModifyProposal = this.project?.project_status?.id == 1 || this.project?.project_status?.id == 2;
      this.validateRolePermission();

      this.version = this.project.versions.find((x) => x.active);
      if (this.version) {
        this.loadGroups();
      }
    });
    this.getAlwaysAllowModification();
  }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() { }

  loadGroups() {
    this.catalogs
      .getGroupColors()
      .then((result) => (this.groupColors = result.data));

    this.catalogs.getGroups().then((result: any) => {
      this.groups = result.data.filter(x => x.id!=4);

      if (this.version?.pv_colors) {
        this.groups = this.groups.map((element) => {
          const pvColor = this.version.pv_colors.find(
            (x) => x.id_group == element.id
          );

          if (pvColor) {
            const groupColor = this.groupColors.find(
              (x) => x.id == pvColor.id_group_color
            );

            return { ...element, groupColor };
          } else {
            return { ...element };
          }
        });
      }
    });
  }

  async openPopoverColors(event: any, idGroup: number) {
    let colors = this.groupColors.filter((x) => x.id_group == idGroup);
    const shingle_lines = this.version.shingle_lines;
    const materialTypeId = (shingle_lines.length>0)?shingle_lines[0].id_material_type:null;
    if(materialTypeId && idGroup == 4){
        colors = this.groupColors.filter(x => x.id_group == idGroup && x.id_material_type==materialTypeId);
    }

    const popover = await this.popoverCtrl.create({
      component: PopoverGroupColorsComponent,
      event,
      side: 'top',
      componentProps: {
        colors,
      },
    });

    await popover.present();
    const result = await popover.onWillDismiss();
    if (result.data) {
      this.saveColor(result.data.id, idGroup);
    }
  }

  saveColor(idGroupColor: number, idGroup: number) {
    const color: PvColor = {
      id: uuidv4(),
      id_group_color: idGroupColor,
      id_version: this.version.id,
      id_group: idGroup,
      isModified: true
    };

    if (this.version?.pv_colors) {
      const exist = this.version.pv_colors.find((x) => x.id_group == idGroup);

      if (exist) {
        const pv_colors = this.version.pv_colors.map((x) => {
          if (x.id_group == idGroup) {
            return { ...x, id_group_color: idGroupColor, isModified: true };
          } else {
            return { ...x };
          }
        });
        const version = { ...this.version, pv_colors, isModified: true };
        this.projectService.saveVersion(version);
      } else {
        const version = {
          ...this.version,
          pv_colors: [...this.version.pv_colors, color],
          isModified: true
        };
        this.projectService.saveVersion(version);
      }
    } else {
      const pv_colors = [];
      pv_colors.push(color);
      const version = { ...this.version, pv_colors };
      this.projectService.saveVersion(version);
    }
  }


  validateRolePermission() {
    if (this.project) {
      this.rolesPermissionsService.validateUserPermision(this.project.id_project_status, this.project.user_saleman.id_user, this.project).
        then((result) => {
          this.userDisabledPermision = result;
        });
    }
  }
}
