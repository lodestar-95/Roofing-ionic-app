import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Building } from 'src/app/models/building.model';
import { Description } from 'src/app/models/description.model';
import { PbScope } from 'src/app/models/pb-scope.model';
import { Project } from 'src/app/models/project.model';
import { Version } from 'src/app/models/version.model';
import { DeleteComponent } from 'src/app/prospecting/modals/delete/delete.component';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { ProposalDescriptionsService } from 'src/app/services/proposal-descriptions.service';



@Component({
  selector: 'app-scope-edit-modal',
  templateUrl: './scope-edit-modal.component.html',
  styleUrls: ['./scope-edit-modal.component.scss']
})
export class ScopeEditModalComponent implements OnInit {
  @Input() building: Building;
  @Input() isArchitectural: boolean;
  @Input() project: Project;
  scope: PbScope;
  descriptions: Description[];
  text = '';
  version: Version;
  materials: any;


  constructor(
    private projectService: ProjectsService,
    private descriptionsService: ProposalDescriptionsService,
    private modalController: ModalController,
    private catalogService: CatalogsService,
  ) {


  }

  async ngOnInit() {
    this.materials = await this.catalogService.getMeasuresMaterialTypes();
    this.loadScope();
  }

  /**
   * Change ownership if verified
   *
   * @param event
   * @param idScope
   */
  async onVerifiedClick(event, idScope) {
    if (!this.text) {
      await this.getDescriptions();
    }

    const scopes = this.building.pb_scopes.map(x => {
      if (x.id == idScope) {
        return {
          ...x,
          is_verified: !event,
          is_modified: true,
          isModified: true,
          scope_of_work: this.text
        };
      } else {
        return { ...x };
      }
    });

    this.building = { ...this.building, pb_scopes: scopes };
    this.projectService.saveProjectBuilding(this.building);
    this.loadScope();
  }
  /**
   * Load init data scope
   */
  loadScope() {
    this.scope = this.building.pb_scopes.find(
      x => x.is_architectural === this.isArchitectural
    );

    if (!this.scope.scope_of_work) {
      this.getDescriptions().then(() => {
        this.updateSWText(this.scope.id);
      });
    } else {
      this.text = this.scope.scope_of_work;
    }
  }

  updateSWText(idScope) {
    const scopes = this.building.pb_scopes.map(x => {
      if (x.id == idScope) {
        return {
          ...x,
          scope_of_work: this.text
        };
      } else {
        return { ...x };
      }
    });

    this.building = { ...this.building, pb_scopes: scopes };
    this.projectService.saveProjectBuilding(this.building);
  }

  /**
   *
   */
  async getDescriptions() {
    this.text = '';
    await this.descriptionsService.get().then(async result => {
      if (this.isArchitectural) {
        this.descriptions = result.data
          .filter(x => x.is_architectural == true)
          .sort((a, b) => a.order - b.order);
      } else {
        this.descriptions = result.data
          .filter(x => x.is_presidential == true)
          .sort((a, b) => a.order - b.order);
      }
      await this.textAppendTags();
    });
  }

  textAppendOptions() {
    if (this.building?.psb_measure?.psb_options?.filter(x => x.is_built_in && x?.deletedAt == null)?.length > 0) {
      this.building.psb_measure.psb_options
        .filter(x => x.is_built_in)
        .forEach(option => {
          this.text += `- ${option.option} \n`;
        });
    }
  }
  async textAppendTags() {
    this.text =  await this.descriptionsService.generateText(
      this.scope,
      this.building,
      this.version,
      this.materials,
      this.project
    );
  }

  /**
   * Save scope info
   */
  save() {
    const scope: PbScope = {
      ...this.scope,
      scope_of_work: this.text,
      is_modified: true,
      isModified: true,
      title: this.building.job_type.job_type
    };
    const exist = this.building.pb_scopes.find(x => x.id == scope.id);
    let scopes: PbScope[] = [];

    if (exist) {
      scopes = this.building.pb_scopes.map(element => {
        if (element.id == scope.id) {
          return { ...scope };
        } else {
          return { ...element };
        }
      });
    } else {
      scopes.push(scope);
    }

    const building: Building = { ...this.building, pb_scopes: scopes };
    this.projectService.saveProjectBuilding(building);
    this.modalController.dismiss();
  }

  cancel() {
    this.modalController.dismiss();
  }

  async generate() {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete',
      componentProps: {
        message: 'Are you sure to generate the scope of work?'
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      await this.getDescriptions();
    }
  }
}
