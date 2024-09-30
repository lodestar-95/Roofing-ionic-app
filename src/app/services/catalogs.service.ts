import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { environment } from '../../environments/environment';
import { NetworkValidateService } from 'src/app/shared/helpers/network-validate.service';
import { AuthService } from '../login/services/auth/auth.service';
import { Resource } from '../models/resource.model';
import { ApiResponse } from '../shared/interfaces/api-response';
import { InitialCatalogs } from '../models/initial-catalogs.model';
import { JobMaterialType } from '../models/job-material-type.mode';
import { JobType } from '../models/job-type.mode';
import { ProspectingType } from '../models/prospecting-type.model';
import { ResourcesRepository } from '../db/resources.respository';
import { JobTypesRepository } from '../db/job-types.repository';
import { ProspectingMaterialTypesRepository } from '../db/prospecting-material-types.repository';
import { ProspectingTypesRepository } from '../db/prospecting-types.repository';
import { WarrantyTypesRepository } from '../db/warranty-types.respository';
import { UsersRepository } from '../db/users.respository';
import { UserRepository } from '../db/user.respository';
import { RoleResourcesRepository } from '../db/role-resources.respository';
import { InwshieldRowsRepository } from '../db/inwshield-rows.repository';
import { CostIntegrationsRepository } from '../db/cost-integrations.respository';
import { WarrantyOptionsRepository } from '../db/warranty-options.repository';
import { WarrantyOption } from '../models/warranty-option.model';
import { InwshieldRow } from '../models/in-wshield-row.model';
import { CostIntegration } from '../models/cost-integration.model';
import { ShingleTypesRemove } from '../models/shingle_types_remove.model';
import { ShingleTypesRemovesRepository } from '../db/shingle_types_remove.repository';
import { MeasuresMaterialType } from '../models/measures-material-types.model';
import { MeasuresMaterialTypesRepository } from '../db/measures-material-types.repository';
import { WallMaterialsRepository } from '../db/wall-materials.repository';
import { WallMaterial } from '../models/wall-material.model';
import { GeneralRepository } from '../db/general.repository';
import { General } from '../models/general.model';
import { TrademarksRepository } from '../db/trademarks.respository';
import { Trademark } from '../models/trademark.model';
import { MaterialColorsRepository } from '../db/material-colors.respositor';
import { MaterialColor } from '../models/material-color.model';
import { GroupColorsRepository } from '../db/group-colors.respositor';
import { GroupsRepository } from '../db/groups.respository';
import { Group } from '../models/group.model';
import { GroupColor } from '../models/group-color.model';
import { CostTypeRepository } from '../db/cost-type.respository';
import { CostType } from '../models/cost_type.model';
import { CompabilitiesRepository } from '../db/compatibilities.repository';
import { Compability } from '../models/compability.model';
import { PriceListRepository } from '../db/price-list.repository';
import { PriceList } from '../models/price-list.model';
import { MaterialCategoriesRepository } from '../db/material-categories.respository';
import { MaterialCategory } from '../models/material-category.model';
import { ExpensesRepository } from '../db/expenses.repository';
import { UpgradesRepository } from '../db/upgrades.repository';
import { MaterialPricesRepository } from '../db/material-prices.repository';
import { Expens } from '../models/expens.model';
import { Upgrade } from '../models/upgrade.model';
import { MaterialPrice } from '../models/material-price.model';
import { ConceptTypesRepository } from '../db/concept-types.repository';
import { ConceptType } from '../models/concept_type.mdoel';
import { LaborPricesRepository } from '../db/labor-prices.repository';
import { MaterialUnitsRepository } from '../db/material-units.repository';
import { SuppliersRepository } from '../db/suppliers.repository';
import { InspectorCostTypesRepository } from '../db/inspector-cost-types.repository';
import { LaborPrice } from '../models/labor-price.model';
import { LaborPitchPricesRepository } from '../db/labor-pitch-prices.repository';
import { MaterialUnit } from '../models/material-unit.model';
import { Suppiler } from '../models/supplier.model';
import { InspectorCostType } from '../models/inspector-cost-type.model';
import { LaborPitchPrice } from '../models/labor-pitch-price.model';
import { WarrantiesRepository } from '../db/warranties.repository';
import { Warranty } from '../models/warranty.model';
import { RoleResource } from '../models/role-resource.model';
import { SyncDateRepository } from '../db/sync-date.repository';
import { User } from '../models/user.model';
import { WarrantyType } from '../models/warranty-type.model';

@Injectable({
  providedIn: 'root',
})
/**
 * @author: Carlos Rodríguez
 */
export class CatalogsService {
  private url = environment.url;
  resorceRepository: ResourcesRepository;
  jobTypeRepository: JobTypesRepository;
  prospectingMaterialTypeRepository: ProspectingMaterialTypesRepository;
  prospectingTypeRepository: ProspectingTypesRepository;
  warrantyTypeRepository: WarrantyTypesRepository;
  usersRepository: UsersRepository;
  roleResourcesRepository: RoleResourcesRepository;
  inwshieldRowsRepository: InwshieldRowsRepository;
  costIntegrationsRepository: CostIntegrationsRepository;
  warrantyOptionsRepository: WarrantyOptionsRepository;
  shingleTypesRemovesRepository: ShingleTypesRemovesRepository;
  measuresMaterialTypeRepository: MeasuresMaterialTypesRepository;
  wallMaterialsRepository: WallMaterialsRepository;
  generalRepository: GeneralRepository;
  trademarksRepository: TrademarksRepository;
  materialColorsRepository: MaterialColorsRepository;
  groupsRepository: GroupsRepository;
  groupColorsRepository: GroupColorsRepository;
  costTypeRepository: CostTypeRepository;
  compabilitiesRepository: CompabilitiesRepository;
  priceListRepository: PriceListRepository;
  materialCategoryRepository: MaterialCategoriesRepository;
  expensesRepository: ExpensesRepository;
  upgradesRepository: UpgradesRepository;
  materialPricesRepository: MaterialPricesRepository;
  conceptTypesRepository: ConceptTypesRepository;
  laborPricesRepository: LaborPricesRepository;
  materialUnitsRepository: MaterialUnitsRepository;
  suppliersRepository: SuppliersRepository;
  inspectorCostTypesRepository: InspectorCostTypesRepository;
  laborPitchPricesRepository: LaborPitchPricesRepository;
  warrantiesRepository: WarrantiesRepository;
  syncDateRepository: SyncDateRepository;
  userRepository: UserRepository;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private readonly networkService: NetworkValidateService,
    private auth: AuthService
  ) {
    this.jobTypeRepository = new JobTypesRepository(this.storage, `job_types`);
    this.prospectingMaterialTypeRepository =
      new ProspectingMaterialTypesRepository(
        this.storage,
        `prospecting-material-types`
      );
    this.prospectingTypeRepository = new ProspectingTypesRepository(
      this.storage,
      `prospecting-types`
    );
    this.warrantyTypeRepository = new WarrantyTypesRepository(
      this.storage,
      `warranty-types`
    );
    this.usersRepository = new UsersRepository(this.storage, 'users');
    this.userRepository = new UserRepository(this.storage, 'user');
    this.roleResourcesRepository = new RoleResourcesRepository(
      this.storage,
      'role_resources'
    );
    this.inwshieldRowsRepository = new InwshieldRowsRepository(
      this.storage,
      'inwshield_rows'
    );
    this.costIntegrationsRepository = new CostIntegrationsRepository(
      this.storage,
      'cost_integrations'
    );
    this.warrantyOptionsRepository = new WarrantyOptionsRepository(
      this.storage,
      'warranty_option'
    );
    this.shingleTypesRemovesRepository = new ShingleTypesRemovesRepository(
      this.storage,
      'shingle_types_remove'
    );
    this.measuresMaterialTypeRepository = new MeasuresMaterialTypesRepository(
      this.storage,
      'material-types'
    );
    this.wallMaterialsRepository = new WallMaterialsRepository(
      this.storage,
      'wall-material'
    );
    this.generalRepository = new GeneralRepository(this.storage, 'general');
    this.trademarksRepository = new TrademarksRepository(
      this.storage,
      'trademarks'
    );
    this.materialColorsRepository = new MaterialColorsRepository(
      this.storage,
      'material_colors'
    );
    this.groupsRepository = new GroupsRepository(this.storage, 'groups');
    this.groupColorsRepository = new GroupColorsRepository(
      this.storage,
      'group-colors'
    );
    this.costTypeRepository = new CostTypeRepository(this.storage, 'cost_type');
    this.compabilitiesRepository = new CompabilitiesRepository(
      this.storage,
      'compatibilities'
    );
    this.priceListRepository = new PriceListRepository(
      this.storage,
      'price-list'
    );
    this.materialCategoryRepository = new MaterialCategoriesRepository(
      this.storage,
      'material_categories'
    );
    this.expensesRepository = new ExpensesRepository(
      this.storage,
      'expenses'
    );
    this.materialPricesRepository = new MaterialPricesRepository(
      this.storage,
      'material_prices'
    );
    this.upgradesRepository = new UpgradesRepository(
      this.storage,
      'upgrades'
    );
    this.conceptTypesRepository = new ConceptTypesRepository(
      this.storage,
      'concept_types'
    );
    this.laborPricesRepository = new LaborPricesRepository(
      this.storage,
      'labor_prices'
    );
    this.materialUnitsRepository = new MaterialUnitsRepository(
      this.storage,
      'material_units'
    );
    this.suppliersRepository = new SuppliersRepository(
      this.storage,
      'suppliers'
    );
    this.inspectorCostTypesRepository = new InspectorCostTypesRepository(
      this.storage,
      'inspector_cost_types'
    );
    this.laborPitchPricesRepository = new LaborPitchPricesRepository(
      this.storage,
      'labor_pitch_prices'
    );
    this.warrantiesRepository = new WarrantiesRepository(
      this.storage,
      'warranties'
    );
  }

  /**
   * Get the menu resources
   * @returns
   */
  async getMenu(): Promise<ApiResponse<Resource[]>> {
    await this.auth.getAuthUser().then((result) => {
      this.resorceRepository = new ResourcesRepository(
        this.storage,
        `resource_${result.id}`
      );
    });

    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        this.http
          .get<ApiResponse<Resource[]>>(`${this.url}/catalogs/menu`)
          .subscribe(
            (result) => {
              this.resorceRepository.createSeveral(result.data);
              resolve(result);
            },
            () => {
              this.resorceRepository.findAll().then(
                (result) => resolve(result),
                (error) => reject(error)
              );
            }
          );
      } else {
        this.resorceRepository.findAll().then(
          (result) => resolve(result),
          (error) => reject(error)
        );
      }
    });
  }

  /**
   * create the menu resources
   * @returns
   */
  async createMenu(data): Promise<void> {
    await this.auth.getAuthUser().then((result) => {
      this.resorceRepository = new ResourcesRepository(
        this.storage,
        `resource_${result.id}`
      );
    });
    this.resorceRepository.createSeveral(data);

  }
  /**
   * create the sync resources
   * @returns
   */
  async createSyncDate(data): Promise<void> {
    await this.auth.getAuthUser().then((result) => {
      this.syncDateRepository = new SyncDateRepository(
        this.storage,
        `syncDate_${result.id}`
      );
    });
    this.syncDateRepository.createSeveral(data);

  }

  /**
   * Get initial catalogs from api and save in local db
   * @returns
   */
  getInitialcatalogs() {
    this.http
      .get<InitialCatalogs>(`${this.url}/catalogs/initial-catalogs`)
      .subscribe(
        (result) => {
          this.jobTypeRepository.createSeveral(result.jobTypes);
          this.prospectingMaterialTypeRepository.createSeveral(
            result.jobMaterialTypes
          );
          this.prospectingTypeRepository.createSeveral(result.prospectingTypes);
          this.warrantyTypeRepository.createSeveral(result.warrantyTypes);
          this.usersRepository.createSeveral(result.users);
          this.roleResourcesRepository.createSeveral(result.roleResources);
          this.inwshieldRowsRepository.createSeveral(result.inwshieldRows);
          this.costIntegrationsRepository.createSeveral(
            result.costIntegrations
          );
          this.warrantyOptionsRepository.createSeveral(result.warrantyOptions);
          this.shingleTypesRemovesRepository.createSeveral(
            result.shingleTypesRemoves
          );
          this.measuresMaterialTypeRepository.createSeveral(
            result.materialTypes
          );
          this.wallMaterialsRepository.createSeveral(result.wallMaterial);
          this.generalRepository.createSeveral(result.general);
          this.trademarksRepository.createSeveral(result.trademarks);
          this.materialColorsRepository.createSeveral(result.materialColors);
          this.groupsRepository.createSeveral(result.groups);
          this.groupColorsRepository.createSeveral(result.groupColors);
          this.costTypeRepository.createSeveral(result.costTypes);
          this.compabilitiesRepository.createSeveral(result.compatibilities);
          this.expensesRepository.createSeveral(result.expenses);
          this.upgradesRepository.createSeveral(result.upgrades);
          this.materialPricesRepository.createSeveral(result.materialPrices);
          this.conceptTypesRepository.createSeveral(result.conceptTypes);
          this.laborPricesRepository.createSeveral(result.laborPrices);
          this.materialUnitsRepository.createSeveral(result.materialUnits);
          this.suppliersRepository.createSeveral(result.suppilers);
          this.inspectorCostTypesRepository.createSeveral(result.inspectorCostTypes);
          this.laborPitchPricesRepository.createSeveral(result.laborPitchPrices);
          this.warrantiesRepository.createSeveral(result.warranties);
          this.priceListRepository.createSeveral(result.priceList);

          this.materialCategoryRepository.createSeveral([
            {
              id: 7,
              material_category: 'Flat Ridge Cap Size',
            },
            {
              id: 34,
              material_category: 'Underlayment',
            },
            {
              id: 30,
              material_category: 'Ice and Water Shields',
            },
            // {
            //   id: 15,
            //   material_category: 'Ridge Vent',
            // },
          ]);
        },
        (error) => {}
      );
  }

  /**
   * Get MaterialType catalog
   * @returns
   */
  getMeasuresMaterialTypes(): Promise<ApiResponse<MeasuresMaterialType[]>> {
    return new Promise((resolve, reject) => {
      this.measuresMaterialTypeRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get WallMaterials catalog
   * @returns
   */
  getWallMaterials(): Promise<ApiResponse<WallMaterial[]>> {
    return new Promise((resolve, reject) => {
      this.wallMaterialsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get ProspectingMaterialType catalog
   * @returns
   */
  getMaterialTypes(): Promise<ApiResponse<JobMaterialType[]>> {
    return new Promise((resolve, reject) => {
      this.prospectingMaterialTypeRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get JobType catalog
   * @returns
   */
  getJobTypes(): Promise<ApiResponse<JobType[]>> {
    return new Promise((resolve, reject) => {
      this.jobTypeRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get ProspectingTypes catalog
   * @returns
   */
  getProspectingTypes(): Promise<ApiResponse<ProspectingType[]>> {
    return new Promise((resolve, reject) => {
      this.prospectingTypeRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get WarrantyOption catalog
   * @returns
   */
  getWarrantiesOptions(): Promise<ApiResponse<WarrantyOption[]>> {
    return new Promise((resolve, reject) => {
      this.warrantyOptionsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get InwshieldRow catalog
   * @returns
   */
  getInwshieldRows(): Promise<ApiResponse<InwshieldRow[]>> {
    return new Promise((resolve, reject) => {
      this.inwshieldRowsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get Cost Integrations catalog
   * @returns
   */
  getCostIntegrations(): Promise<ApiResponse<CostIntegration[]>> {
    return new Promise((resolve, reject) => {
      this.costIntegrationsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get ShingleTypesRemove catalog
   * @returns
   */
  getCShingleTypesRemoves(): Promise<ApiResponse<ShingleTypesRemove[]>> {
    return new Promise((resolve, reject) => {
      this.shingleTypesRemovesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get General catalog
   * @returns
   */
  getGeneral(): Promise<ApiResponse<General[]>> {
    return new Promise((resolve, reject) => {
      this.generalRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get Trademark catalog
   * @returns
   */
  getTrademarks(): Promise<ApiResponse<Trademark[]>> {
    return new Promise((resolve, reject) => {
      this.trademarksRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get Material Color catalog
   * @returns
   */
  getMaterialColors(): Promise<ApiResponse<MaterialColor[]>> {
    return new Promise((resolve, reject) => {
      this.materialColorsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getGroups(): Promise<ApiResponse<Group[]>> {
    return new Promise((resolve, reject) => {
      this.groupsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getGroupColors(): Promise<ApiResponse<GroupColor[]>> {
    return new Promise((resolve, reject) => {
      this.groupColorsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getCostTypes(): Promise<ApiResponse<CostType[]>> {
    return new Promise((resolve, reject) => {
      this.costTypeRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getCompabilities(): Promise<ApiResponse<Compability[]>> {
    return new Promise((resolve, reject) => {
      this.compabilitiesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Get PriceList catalog
   * @returns
   */
  getPriceList(): Promise<ApiResponse<PriceList[]>> {
    return new Promise((resolve, reject) => {
      this.priceListRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getMaterialCategories(): Promise<ApiResponse<MaterialCategory[]>> {
    return new Promise((resolve, reject) => {
      this.materialCategoryRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getExpenses(): Promise<ApiResponse<Expens[]>> {
    return new Promise((resolve, reject) => {
      this.expensesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getUpgrades(): Promise<ApiResponse<Upgrade[]>> {
    return new Promise((resolve, reject) => {
      this.upgradesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getMaterialPrices(): Promise<ApiResponse<MaterialPrice[]>> {
    return new Promise((resolve, reject) => {
      this.materialPricesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getConceptTypes(): Promise<ApiResponse<ConceptType[]>> {
    return new Promise((resolve, reject) => {
      this.conceptTypesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getLaborPrices(): Promise<ApiResponse<LaborPrice[]>> {
    return new Promise((resolve, reject) => {
      this.laborPricesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getMaterialUnits(): Promise<ApiResponse<MaterialUnit[]>> {
    return new Promise((resolve, reject) => {
      this.materialUnitsRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getSuppliers(): Promise<ApiResponse<Suppiler[]>> {
    return new Promise((resolve, reject) => {
      this.suppliersRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getLaborPitchPrices(): Promise<ApiResponse<LaborPitchPrice[]>> {
    return new Promise((resolve, reject) => {
      this.laborPitchPricesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getWarranties(): Promise<ApiResponse<Warranty[]>> {
    return new Promise((resolve, reject) => {
      this.warrantiesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

  getInspectorCostTypes(): Promise<ApiResponse<InspectorCostType[]>> {
    return new Promise((resolve, reject) => {
      this.inspectorCostTypesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }
  getRoleResources(): Promise<ApiResponse<RoleResource[]>> {
    return new Promise((resolve, reject) => {
      this.roleResourcesRepository.findAll().then((result) => {
        resolve(result);
      });
    });
  }

    /**
   * Get the menu resources
   * @returns
   */
    async getSyncDate(): Promise<ApiResponse<String[]>> {
      await this.auth.getAuthUser().then((result) => {
        this.syncDateRepository = new SyncDateRepository(
          this.storage,
          `syncDate_${result.id}`
        );
      });

      return new Promise((resolve, reject) => {
        this.syncDateRepository.findAll().then((result) => {
          resolve(result);
        });
      });
    }

    getUsers(): Promise<ApiResponse<any[]>> {
      return new Promise((resolve, reject) => {
        this.usersRepository.findAll().then((result) => {
          resolve(result);
        });
      });
    }

    getUser(): Promise<ApiResponse<User[]>> {
      return new Promise((resolve, reject) => {
        this.userRepository.findAll().then((result) => {
          resolve(result);
        });
      });
    }

    createUser(data): void {
      
        this.userRepository.createSeveral(data)
    }
    createUsers(data): void {
        this.usersRepository.createSeveral(data)
    }

    getWarrantyType(): Promise<ApiResponse<WarrantyType[]>> {
      return new Promise((resolve, reject) => {
        this.warrantyTypeRepository.findAll().then((result) => {
          resolve(result);
        });
      });
    }
}
