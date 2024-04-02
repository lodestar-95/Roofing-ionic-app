import { Injectable } from '@angular/core';
import { Building } from '../models/building.model';
import { Storage } from '@ionic/storage';
import { PsbMaterialCalculation } from '../models/psb-material-calculation.model';
import { ProjectsService } from './projects.service';
import { Suppiler } from '../models/supplier.model';
import { SuppliersRepository } from '../db/suppliers.repository';
import { v4 as uuidv4 } from 'uuid';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';
import { HttpClient } from '@angular/common/http';
import { PriceList } from '../models/price-list.model';
import { PriceListRepository } from '../db/price-list.repository';
import { GeneralService } from '../estimate/calculation/materials/general.service';
import { MaterialRepository } from '../db/material.repository';
import { MaterialPricesListRepository as MaterialPriceListRepository } from '../db/material-price-lists.repository';
import { ProjectsRepository } from '../db/projects.respository';
import { SyncProjectsService } from './sync-projects.service';
import { ToastController } from '@ionic/angular';
import { LoadingService } from '../shared/helpers/loading.service';
import { AuthService } from '../login/services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '../shared/interfaces/api-response';
import { MaterialPriceList } from '../models/material-price-list.model';
import { Material } from '../models/material.model';

@Injectable({
    providedIn: 'root'
})
export class MaterialService {
    private url = environment.url;
    supplierRepository: SuppliersRepository;
    priceListRepository: PriceListRepository;
    materialPriceListRepository: MaterialPriceListRepository;
    materialRepository: MaterialRepository;
    projectsRepository: ProjectsRepository;
    id_material_shingle: number;

    constructor(
        private http: HttpClient,
        private storage: Storage,
        private projectService: ProjectsService,
        private networkService: NetworkValidateService,
        private generalService: GeneralService,
        private toastController: ToastController,
        private loading: LoadingService,
        private syncService: SyncProjectsService,
        private authService: AuthService) {

        this.supplierRepository = new SuppliersRepository(this.storage, 'suppliers');
        this.priceListRepository = new PriceListRepository(this.storage, 'price-list');
        this.materialPriceListRepository = new MaterialPriceListRepository(this.storage, 'material-price-list');
        this.materialRepository = new MaterialRepository(this.storage, 'materials');
        this.projectsRepository = new ProjectsRepository(this.storage, 'projects');
    }

    async moveMaterial(material: PsbMaterialCalculation, supplierId: number, cost: number) {
        const priceListIds = await this.getPriceListsIdBySupplierId(supplierId);
        const materialPrice = await this.getMaterialPriceList(material.id_concept, priceListIds, cost, supplierId);

        material.id_material_price_list = materialPrice.id;
        material.cost = cost;
        material.is_updated = true;
        material.isModified = true;

        await this.saveMaterial(material);
    }

    private async getPriceListsIdBySupplierId(supplierId: number) {
        const priceLists = (await this.priceListRepository.findAll()).data;
        let priceListIds = priceLists.filter(x => ('' + x.id_supplier) == ('' + supplierId) && x.is_current)?.map(x => ('' + x.id));
        if (!priceListIds || priceListIds.length == 0) {
            const newId = (await this.addPriceList(supplierId)).id;
            return [('' + newId)];
        }
        return priceListIds;
    }


    private async getMaterialPriceList(id_material: number, priceListIds: string[], cost: number, supplierId: number) {
        const priceLists = (await this.materialPriceListRepository.findAll()).data;
        const materialPriceList = priceLists.filter(x => ('' + x.id_material) == ('' + id_material) && priceListIds.includes(('' + x.id_price_list)));
        let materialPrice = materialPriceList?.find(x => x.cost == cost);

        if (!materialPrice) {
            if (priceListIds && priceListIds.length == 1 && isNaN(+priceListIds[0])) {
                materialPrice = await this.addMaterialPriceList(id_material, priceListIds[0], cost);
            } else {
                const priceList = await this.addPriceList(supplierId);
                materialPrice = await this.addMaterialPriceList(id_material, priceList.id, cost);
            }
        }

        return materialPrice;
    }

    private async saveMaterial(material: PsbMaterialCalculation) {
        let version = await this.getActiveVersion();

        const buildings = version.buildings.map(b => {
            if (b.psb_measure.id == material.id_psb_measure) {
                const calculations = b.psb_measure.psb_material_calculations.map(c => {
                    if (c.id == material.id) {
                        return { ...material, isModified: true };
                    } else {
                        return c;
                    }
                });
                const measure = { ...b.psb_measure, psb_material_calculations: calculations };
                return { ...b, psb_measure: measure };
            }

            return b;
        });

        version = { ...version, buildings };
        this.projectService.saveVersion(version);
    }

    async moveMaterialNewSupplier(material: PsbMaterialCalculation, cost: number, supplierName: string, supplierEmail: string = '') {
        const supplier = await this.addSupplier(supplierName, supplierEmail);
        const priceList = await this.addPriceList(supplier.id);
        const materialPrice = await this.addMaterialPriceList(material.id_material, priceList.id, cost);

        material.id_material_price_list = materialPrice.id;
        material.cost = cost;
        material.is_updated = true;

        this.saveMaterial(material);
    }

    async addSupplier(supplierName: string, supplierEmail: string = '') {
        const currentUser = await this.authService.getAuthUser();
        const supplier: Suppiler = {
            id: uuidv4(),
            supplier: supplierName,
            email: supplierEmail,
            created_by: currentUser.username,
            address: ''
        };

        this.supplierRepository.create(supplier);

        return supplier;
    }

    async addPriceList(supplierId: number) {
        const priceList: PriceList = {
            id: uuidv4(),
            id_supplier: supplierId,
            is_current: true,
            start_date: new Date(Date.now()),
            toLowerCase: function (): unknown {
                throw new Error('Function not implemented.');
            }
        };

        this.priceListRepository.create(priceList);

        return priceList;
    }

    async addMaterialPriceList(id_material, id_price_list, cost) {
        const materialPriceList = {
            id: uuidv4(),
            id_material,
            id_price_list,
            cost
        };

        this.materialPriceListRepository.create(materialPriceList);

        return materialPriceList;
    }

    async registerNewMaterial(supplierId, materialName, price, unitId, qtys: { id: number, quantity: number }[]) {
        const otherMaterialTypeId = await this.generalService.getConstDecimalValue('other_material_type_id');
        const currentUser = await this.authService.getAuthUser();

        const material = {
            id: uuidv4(),
            material: materialName,
            id_material_type: otherMaterialTypeId,
            is_default: true,
            id_unit_buy: unitId,
            id_trademark: null,
            id_supplier_default: supplierId,
            is_active: true,
            coverage_lf: 1,
            coverage_sq: 1,
            created_by: currentUser.username
        };

        this.materialRepository.create(material);

        return this.addExtraMaterial(supplierId, material.id, price, qtys);
    }

    async addExtraMaterial(supplierId, materialId, price, qtys: { id: number, quantity: number }[]) {
        const priceListIds = await this.getPriceListsIdBySupplierId(supplierId);
        const materialPriceList = await this.getMaterialPriceList(materialId, priceListIds, price, supplierId);
        let version = await this.getActiveVersion();

        const buildings = version.buildings.map(b => {
            const qty = qtys.find(q => q.id == b.id)?.quantity ?? 0;
            if (qty > 0) {
                const material: PsbMaterialCalculation = {
                    id: uuidv4(),
                    cost: price,
                    from_original_proposal: false,
                    is_updated: true,
                    quantity: qty,
                    isModified: true,
                    deletedAt: null,
                    id_psb_measure: b.psb_measure.id,
                    id_material_price_list: materialPriceList.id,
                    id_concept: materialId,
                    id_concept_type: 0,
                    id_material_shingle: this.id_material_shingle,
                    id_material: materialId
                };

                const updatedMaterials = [...b.psb_measure.psb_material_calculations, material];
                const updatedMeasures = { ...b.psb_measure, psb_material_calculations: updatedMaterials };
                const updatedBuilding = { ...b, psb_measure: updatedMeasures };

                return updatedBuilding;
            } else {
                return b;
            }
        });

        version = { ...version, buildings };
        this.projectService.saveVersion(version);

    }

    async getActiveVersion() {
        const projectId = parseInt(localStorage.getItem('idProject'));
        const project = (await this.projectService.get(projectId)).data;

        return project.versions.find(x => x.active) ?? project.versions.find(x => x.is_current_version);
    }

    async downloadMaterialData() {
        try {
            //this.loading.show();
            const syncData = await this.getMaterialData();

            this.supplierRepository.createSeveral(syncData.suppliers);
            this.materialRepository.createSeveral(syncData.materials);
            this.priceListRepository.createSeveral(syncData.priceLists);
            this.materialPriceListRepository.createSeveral(syncData.materialPriceLists);

            //this.loading.hide();
        } catch (error) {
            console.error(error);
            const toast = await this.toastController.create({
                message: 'Error',
                color: 'danger',
                duration: 2000,
                position: 'bottom',
            });

            toast.present();
        } finally {
            //this.loading.hide();
        }

    }

    async syncMaterialData() {
        try {
            this.loading.show();
            const suppliers = (await this.supplierRepository.findAll()).data.filter(x => isNaN(x.id));
            const materials = (await this.materialRepository.findAll()).data.filter(x => isNaN(x.id));
            const materialPriceLists = (await this.materialPriceListRepository.findAll()).data.filter(x => isNaN(x.id));
            const priceLists = (await this.priceListRepository.findAll()).data.filter(x => isNaN(x.id));
            const { calculations, ids } = await this.getProjectCalculations();

            const data = { suppliers, materials, priceLists, materialPriceLists, calculations };
            const syncData = await this.postMaterialData(data);

            this.supplierRepository.createSeveral(syncData.suppliers);
            this.materialRepository.createSeveral(syncData.materials);
            this.priceListRepository.createSeveral(syncData.priceLists);
            this.materialPriceListRepository.createSeveral(syncData.materialPriceLists);

            this.loading.hide();
            await this.syncService.syncOfflineOnlyGet(ids, true);
        } catch (error) {
            console.error(error);
            const toast = await this.toastController.create({
                message: 'Error',
                color: 'danger',
                duration: 2000,
                position: 'bottom',
            });

            toast.present();
        } finally {
            this.loading.hide();
        }

    }

    async getProjectCalculations() {
        const allProjects = (await this.projectsRepository.findAll()).data;
        const projects = allProjects.filter(x => x.id_project_status == 4);
        let calculations = [];
        projects.forEach(p => {
            const activeVersion = p.versions.find(x => x.active);
            activeVersion.buildings.map(b => b.psb_measure)
                .forEach(m => {
                  console.log(m);
                  if (m && m.psb_material_calculations){
                    calculations = [...calculations, ...m.psb_material_calculations.filter(x => x.isModified || isNaN(x.id))];
                  }else{
                    calculations = [...calculations]
                  }
                });
        });

        const ids = allProjects.filter(x => x.id_project_status != 4).map(x=>x.id);
        return { calculations, ids };
    }

    private postMaterialData(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.networkService.isConnected) {
                this.http
                    .post<any>(`${this.url}/catalogs/post-material-data`, data)
                    .subscribe(
                        async result => {
                            if (result) {
                                const data = await this.getMaterialData();
                                resolve(data);
                            } else {
                                resolve(null);
                            }
                        },
                        error => reject(error)
                    );
            } else {
                resolve(null);
            }
        });
    }

    private getMaterialData(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.networkService.isConnected) {
                this.http
                    .get<any>(`${this.url}/catalogs/get-material-data`)
                    .subscribe(
                        result => {
                            resolve(result);
                        },
                        error => reject(error)
                    );
            } else {
                resolve(null);
            }
        });
    }

    saveMaterialCalculation(building: Building, material: PsbMaterialCalculation) {
        if (!building || !material) return;
        let calculations: PsbMaterialCalculation[];

        const originalCalculations = building.psb_measure.psb_material_calculations;
        if (originalCalculations.find(x => x.id == material.id)) {
            calculations = originalCalculations.map(c => {
                if (c.id == material.id) {
                    if (c.from_original_proposal && material.deletedAt)
                        return c; //No se permite eliminar los datos orignales
                    return { ...material, is_updated: true };
                }
                return c;
            });
        } else {
            calculations = [...originalCalculations, material];
        }

        const updatedMeasure = { ...building.psb_measure, psb_material_calculations: calculations };
        const updatedBuilding = { ...building, psb_measure: updatedMeasure };

        this.projectService.saveProjectBuilding(updatedBuilding);
    }

    getMaterialPricesList(): Promise<ApiResponse<MaterialPriceList[]>> {
        return new Promise((resolve, reject) => {
          this.materialPriceListRepository.findAll().then((result) => {
            resolve(result);
          });
        });
      }

      getMaterials(): Promise<ApiResponse<Material[]>> {
        return new Promise((resolve, reject) => {
          this.materialRepository.findAll().then((result) => {
            resolve(result);
          });
        });
      }
}
