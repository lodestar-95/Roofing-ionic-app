import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, NavParams } from '@ionic/angular';
// Services
import { ProjectsService } from './../../../services/projects.service';
import { CatalogsService } from './../../../services/catalogs.service';
// Models
import { ApiResponse } from 'src/app/shared/interfaces/api-response';
/*import { ConceptType } from 'src/app/models/concept_type.mdoel';
import { CostIntegration } from 'src/app/models/cost-integration.model';
import { CostType } from 'src/app/models/cost_type.model';
import { Description } from 'src/app/models/description.model';
import { Expens } from 'src/app/models/expens.model';
import { General } from 'src/app/models/general.model';
import { Group, GroupColor } from 'src/app/models/group.model';
import { InspectorCostType } from 'src/app/models/inspector-cost-type.model';
import { InwshieldRow } from 'src/app/models/in-wshield-row.model';

import { JobType } from 'src/app/models/job-type.mode';
import { LaborPitchPrice } from 'src/app/models/labor-pitch-price.model';
import { LaborPrice } from 'src/app/models/labor-price.model';
import { MaterialPriceList } from 'src/app/models/material-price-list.model';
import { MeasuresMaterialType } from 'src/app/models/measures-material-types.model';
import { MaterialColor } from 'src/app/models/material-color.model';
import { MaterialPrice } from 'src/app/models/material-price.model';
import { MaterialUnit } from 'src/app/models/material-unit.model';
import { Material } from 'src/app/models/material.model';
import { PriceList } from 'src/app/models/price-list.model';
import { JobMaterialType } from 'src/app/models/job-material-type.mode';
import { ProspectingType } from 'src/app/models/prospecting-type.model';*/
import { Resource } from 'src/app/models/resource.model';
/*import { RoleResource } from 'src/app/models/role-resource.model';
import { ShingleTypesRemove } from 'src/app/models/shingle_types_remove.model';
import { Suppiler } from 'src/app/models/supplier.model';
import { Trademark } from 'src/app/models/trademark.model';
import { Upgrade } from 'src/app/models/upgrade.model';
import { UsersService } from 'src/app/common/services/storage/users.service';
import { WallMaterial } from 'src/app/models/wall-material.model';
import { Warranty } from 'src/app/models/warranty.model';
import { WarrantyType } from 'src/app/models/warranty-type.model';
import { WarrantyOption } from 'src/app/models/warranty-option.model';
import { MaterialCategory } from 'src/app/models/material-category.model';*/
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-bugs-report-modal',
  templateUrl: './bugs-report.component.html',
  styleUrls: ['./bugs-report.component.scss'],
})
export class BugsReportModalComponent implements OnInit, OnDestroy {

  tablesName: String[];
  bugsReportForm: FormGroup;
  caption: SafeResourceUrl;
  user: User;
    constructor(
    private modalController: ModalController,
    private readonly formBuilder: FormBuilder,
    private projectService: ProjectsService,
    private catalogService: CatalogsService,
    //private proposalDescriptionsService: ProposalDescriptionsService,
    //private materialService: MaterialService,
    //private usersService: UsersService,
    private auth: AuthService,
    private navParams: NavParams,
    private _sanitizer: DomSanitizer
  ) {
   this.loadAsync().then(() => {
    this.tablesName = [
      'users',
      `syncDate_${this.user.id}`,
      `resource_${this.user.id}`,
      'user',
      /*
      'compatibilities', // one
      'concept_types',
      'cost_integrations',
      'cost_type',
      'descriptions',
      'expenses',
      'general',
      'group-colors',
      'groups',
      'inspector_cost_types',
      'inwshield_rows', //two
      'job_types',
      'labor_pitch_prices',
      'labor_prices',
      'material-price-list',
      'material-types',
      'material_categories',
      'material_colors',
      'material_prices',
      'material_units',
      'materials',// three
      'price-list',
      'prospecting-material-types',
      'prospecting-types',
      `resource_${this.user.id}`,
      'role_resources',
      'shingle_types_remove',
      'suppliers',
      `syncDate_${this.user.id}`,
      'trademarks',
      'upgrades',
      'user',
      'users',
      'wall-material',
      'warranties',
      'warranty-types',
      'warranty_option'*/
    ]
   })




  }
  private loadAsync = async () => {
    this.user = await this.auth.getAuthUser()
  };
  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    this.initForm()

    this.caption = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
    + this.navParams.data.caption);


    this.navParams.data.caption;
  }

  initForm() {
    this.bugsReportForm = this.formBuilder.group({
      action: ['', Validators.compose([Validators.required])],
      description: [
        '',
        Validators.compose([Validators.required, Validators.minLength(3)]),
      ],
    });
  }

  /**
   * Save lodal data and close modal
   */
  async onConfirm() {
    const { idProject } = localStorage;
    let localDBCopy = {}
    let proposal;
    if (idProject)
    {
      const { data: project } = await this.projectService.get(idProject)
      localDBCopy['projects'] =  [project]
      proposal = `${project.project_name} ${idProject}`
    } else {
      proposal = 'Sin proyecto definido';
    }


    const promises: [
      Promise<any>,
      Promise<ApiResponse<String[]>>,
      Promise<ApiResponse<Resource[]>>,
      Promise<ApiResponse<User[]>>,
    ] = [
      this.catalogService.getUsers(),
      this.catalogService.getSyncDate(),
      this.catalogService.getMenu(),
      this.catalogService.getUser(),

    ];
    (await Promise.all(promises)).map((item, i) => {
      localDBCopy[`${this.tablesName[i]}`] =  item.data? item.data: item;
      return item

    });
   /* const promisesOne: [
      Promise<ApiResponse<Compability[]>>,
      Promise<ApiResponse<ConceptType[]>>,
      Promise<ApiResponse<CostType[]>>,
      Promise<ApiResponse<CostIntegration[]>>,
      Promise<ApiResponse<Description[]>>,
      Promise<ApiResponse<Expens[]>>,
      Promise<ApiResponse<General[]>>,
      Promise<ApiResponse<GroupColor[]>>,
      Promise<ApiResponse<Group[]>>,
      Promise<ApiResponse<InspectorCostType[]>>,

    ] = [
        this.catalogService.getCompabilities(),
        this.catalogService.getConceptTypes(),
        this.catalogService.getCostTypes(),
        this.catalogService.getCostIntegrations(),
        this.proposalDescriptionsService.get(),
        this.catalogService.getExpenses(),
        this.catalogService.getGeneral(),
        this.catalogService.getGroupColors(),
        this.catalogService.getGroups(),
        this.catalogService.getInspectorCostTypes(),

    ];
    const promisesTwo: [
      Promise<ApiResponse<InwshieldRow[]>>,
      Promise<ApiResponse<JobType[]>>,
      Promise<ApiResponse<LaborPitchPrice[]>>,
      Promise<ApiResponse<LaborPrice[]>>,
      Promise<ApiResponse<MaterialPriceList[]>>,
      Promise<ApiResponse<MeasuresMaterialType[]>>,
      Promise<ApiResponse<MaterialCategory[]>>,
      Promise<ApiResponse<MaterialColor[]>>,
      Promise<ApiResponse<MaterialPrice[]>>,
      Promise<ApiResponse<MaterialUnit[]>>
    ] = [
        this.catalogService.getInwshieldRows(),
        this.catalogService.getJobTypes(),
        this.catalogService.getLaborPitchPrices(),
        this.catalogService.getLaborPrices(),
        this.materialService.getMaterialPricesList(),
        this.catalogService.getMeasuresMaterialTypes(),
        this.catalogService.getMaterialCategories(),
        this.catalogService.getMaterialColors(),
        this.catalogService.getMaterialPrices(),
        this.catalogService.getMaterialUnits(),

    ];
    const promisesThree: [
      Promise<ApiResponse<Material[]>>,
      Promise<ApiResponse<PriceList[]>>,
      Promise<ApiResponse<JobMaterialType[]>>,
      Promise<ApiResponse<ProspectingType[]>>,
      Promise<ApiResponse<Resource[]>>,
      Promise<ApiResponse<RoleResource[]>>,
      Promise<ApiResponse<ShingleTypesRemove[]>>,
      Promise<ApiResponse<Suppiler[]>>,
      Promise<ApiResponse<String[]>>,
      Promise<ApiResponse<Trademark[]>>,

    ] = [
        this.materialService.getMaterials(),
        this.catalogService.getPriceList(),
        this.catalogService.getMaterialTypes(),
        this.catalogService.getProspectingTypes(),
        this.catalogService.getMenu(),
        this.catalogService.getRoleResources(),
        this.catalogService.getCShingleTypesRemoves(),
        this.catalogService.getSuppliers(),
        this.catalogService.getSyncDate(),
        this.catalogService.getTrademarks(),

    ];
    const promisesFour: [
      Promise<ApiResponse<Upgrade[]>>,
      Promise<any>,
      Promise<any>,
      Promise<ApiResponse<WallMaterial[]>>,
      Promise<ApiResponse<Warranty[]>>,
      Promise<ApiResponse<WarrantyType[]>>,
      Promise<ApiResponse<WarrantyOption[]>>
    ] = [
      this.catalogService.getUpgrades(),
      this.usersService.getUserAll(),
      this.catalogService.getUsers(),
      this.catalogService.getWallMaterials(),
      this.catalogService.getWarranties(),
      this.catalogService.getWarrantyType(),
      this.catalogService.getWarrantiesOptions()
    ];
    (await Promise.all(promisesOne)).map((item, i) => {
      localDBCopy[`${this.tablesName[i]}`] =  item.data;
      return item

    });
    (await Promise.all(promisesTwo)).map((item, i) => {
      localDBCopy[`${this.tablesName[10+i]}`] =  item.data;
      return item

    });
    (await Promise.all(promisesThree)).map((item, i) => {
      localDBCopy[`${this.tablesName[20+i]}`] =  item.data;
      return item

    });
    (await Promise.all(promisesFour)).map((item, i) => {
      localDBCopy[`${this.tablesName[30+i]}`] =  item.data? item.data: item;
      return item

    });*/

//    const blob = new Blob([JSON.stringify(localDBCopy)], { type: 'text/plain' });

    this.modalController.dismiss({
      localStorageCopy: JSON.stringify(localStorage),
      localDBCopy: JSON.stringify(localDBCopy),
      proposal: proposal,
      action: this.bugsReportForm.get('action').value,
      description: this.bugsReportForm.get('description').value,
    });
  }
}
