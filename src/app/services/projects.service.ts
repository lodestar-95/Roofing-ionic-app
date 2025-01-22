import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';

import { ProjectsRepository } from '../db/projects.respository';
import { ApiResponse } from 'src/app/shared/interfaces/api-response';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';
import { Project } from 'src/app/models/project.model';
import { AppState } from '../app.reducer';
import * as prospectingActions from '../prospecting/prospecting.actions';
import { PsbMeasures } from '../models/psb-measures.model';
import { Building } from '../models/building.model';
import { PsbVerified } from '../models/psb_verified.model';
import { environment } from 'src/environments/environment';
import { PsbNoRequired } from '../models/psb_no_required.model';
import { Version } from '../models/version.model';
import { AuthService } from '../login/services/auth/auth.service';
import { User } from '../models/user.model';
import Pako from 'pako';
import { Buffer } from 'buffer';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  repository: ProjectsRepository;
  project: Project;
  building: Building;
  mainBuilding: Building;
  buildings: Building[];
  isActive: boolean = false;
  private url = environment.url;
  // private url = 'http://localhost:8082/api';
  user: User;

  constructor(
    private storage: Storage,
    private networkService: NetworkValidateService,
    private store: Store<AppState>,
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.auth.getAuthUser().then(x => {
      this.user = x;
    });

    this.repository = new ProjectsRepository(this.storage, `projects`);
    this.store.select('projects').subscribe(state => {
      this.project = state.project;

      if (this.project && this.project.versions.length > 0) {
        const version = this.project.versions.find(x => x.active);
        if (!version) {
          return;
        }
        const { buildings } = this.project.versions.find(x => x.active);
        this.buildings = buildings;
        this.building = buildings.find(x => x.active);
        this.mainBuilding = buildings.find(x => x.is_main_building);
      }
    });
  }

  async loadProjects(projects: Project[]) {
    this.repository.createSeveral(projects);
  }

  getLocalProjects(): Promise<ApiResponse<Project[]>> {
    return new Promise((resolve, reject) => {
      this.repository.findAll().then(result => {
        if (result) {
          result.data.map(x => {
            this.returnProjectsMaped(x);
          });
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get the projects assigned to the user
   * @param ids
   * @returns
   * @author: Carlos Rodríguez
   */
  async getOnlineProjects(ids: number[]): Promise<ApiResponse<Project[]>> {
    await this.auth.getAuthUser().then(x => {
      this.user = x;
    });

    const date = new Date(await this.storage.get('syncDate_' + this.user.id));

    const body = {
      ids,
      date: date == null ? new Date(2021, 0).toISOString() : date.toISOString()
    };

    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        this.http
          .post<ApiResponse<string>>(`${this.url}/projects/getProjects/`, body)
          // .post<ApiResponse<string>>(
          //   `${this.url}/projects/getProjects/`,
          //   body
          // )
          .subscribe(
            response => {
              console.log('response', response);

              const compressedData = Buffer.from(response.data, 'base64'); // Decode from base64
              const inflator = new Pako.Inflate({ to: 'string' });
              inflator.push(compressedData, true);
              const decompressedData = inflator.result as string;

              let parsedResponse: Project[];
              if (decompressedData) {
                parsedResponse = JSON.parse(decompressedData);
                console.log('parsedResponse', parsedResponse);

                parsedResponse.map(x => {
                  this.returnProjectsMaped(x);
                });
                resolve(
                  new ApiResponse(
                    parsedResponse.length,
                    parsedResponse,
                    true,
                    response.messagge
                  )
                );
              } else {
                resolve(new ApiResponse(0, parsedResponse, true, response.messagge));
              }

              this.storage.set('syncDate_' + this.user.id, new Date());
            },
            error => reject(error)
          );
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get the projects assigned to the user
   * @param id
   * @returns
   * @author: Carlos Rodríguez
   */
  async getOnlineProjectStatus(id: number): Promise<number> {
    await this.auth.getAuthUser().then(x => {
      this.user = x;
    });


    const body = {
      id,
    };

    return new Promise((resolve, reject) => {
      const url = 'http://localhost:8202/api';
      if (this.networkService.isConnected) {
        this.http
          .post<number>(`${this.url}/projects/getProjectStatus/`, body)
          // .post<ApiResponse<string>>(
          //   `${this.url}/projects/getProjects/`,
          //   body
          // )
          .subscribe(
            response => {
              const onlineStatusId = response;
              resolve(onlineStatusId);
            },
            error => reject(error)
          );
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get the projects assigned to the user
   * @param id
   * @returns
   * @author: Carlos Rodríguez
   */
  async getOnlineProjectFiles(id: number): Promise<any[]> {
    await this.auth.getAuthUser().then(x => {
      this.user = x;
    });


    const body = {
      id,
    };

    return new Promise((resolve, reject) => {
      const url = 'http://localhost:8202/api';
      if (this.networkService.isConnected) {
        this.http
          .post<any[]>(`${this.url}/projects/getProjectFiles/`, body)
          // .post<ApiResponse<string>>(
          //   `${this.url}/projects/getProjects/`,
          //   body
          // )
          .subscribe(
            response => {
              const onlineFiles = response;
              resolve(onlineFiles);
            },
            error => reject(error)
          );
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get project by id from (STORAGE)
   * @param id
   * @returns
   * @author: Carlos Rodríguez
   */
  get(id: number): Promise<ApiResponse<Project>> {
    return new Promise((resolve, reject) => {
      if (false) {
        reject(null);
        //console.warn('getProgect no esta implementado en online.');
      } else {
        this.repository.findOne(id).then(
          result => {
            result.data = this.returnProjectsMaped(result.data);
            resolve(result);
          },
          error => reject(error)
        );
      }
    });
  }

  /**
   * Update a project object in (STORAGE)
   * @param id
   * @param project
   * @returns
   * @author: Carlos Rodríguez
   */
  update(id: number, project: Project, withRedux: boolean = true): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.repository.update(id, project).then(
        result => {
          if (withRedux) {
            this.reduxUpdate(project);
          }
          resolve(result);
        },
        error => reject(error)
      );
    });
  }

  /**
   * Send projects array to (API)
   * @param projects
   * @returns
   */
  post(projects: Project[]): Promise<Project[]> {
    console.log('postProjects',projects)
    const jsonString = JSON.stringify(projects);

    const deflator = new Pako.Deflate({
      level: 6,
      //to: 'string',
      gzip: true,
      header: {
        text: true,
        time: +new Date(),
        comment: ''
      }
    });

    deflator.push(jsonString, true);
    console.log('post');

    // Obtain the compressed data as a Uint8Array
    const compressedData = deflator.result;

    const base64Data = Buffer.from(compressedData).toString('base64');
    console.log('base64Data', base64Data);

    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        this.http
          // .post<Project[]>(`${this.url}/projects/postProjects/`, base64Data)
          .post<Project[]>(`${this.url}/projects/postProjects/`, { base: base64Data })
          .subscribe(
            async result => {
              if (result) {
                console.log('>>>>base64Data', base64Data);

                const projects = (await this.getOnlineProjects([])).data;
                resolve(projects);
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

  /**
   * Update redux store when the case is required
   * @param project
   * @author: Carlos Rodríguez
   */
  private reduxUpdate(project: Project) {
    this.store.dispatch(prospectingActions.editProject({ project: project }));
    this.store.dispatch(prospectingActions.setProject({ project: project }));
  }

  getShingleNoRequired(idResourse: number, isNoRequired = false, isModified = false) {
    const psbNoRequired = this.building.psb_measure.psb_no_requireds
      ? [...this.building.psb_measure.psb_no_requireds]
      : [];
    const element = psbNoRequired.find(element => element.id_resource == idResourse);

    if (!element) {
      const shingleNoRequired: PsbNoRequired = {
        id: uuidv4(),
        id_psb_measure: this.building.psb_measure.id,
        id_resource: idResourse,
        no_required: isNoRequired,
        isModified
      };
      psbNoRequired.push(shingleNoRequired);
      return psbNoRequired;
    } else {
      const projectShingleNoRequiredUpdated = psbNoRequired.map(x => {
        if (x.id_resource == idResourse) {
          return { ...x, no_required: isNoRequired, isModified };
        } else {
          return { ...x };
        }
      });

      return projectShingleNoRequiredUpdated;
    }
  }

  getShingleVerifiedInformation(
    idResource: number,
    isVerified = true,
    building: Building = this.building
  ): PsbVerified[] {
    const psbVerifieds = building.psb_measure.psb_verifieds
      ? this.removeDuplicateResources([...building.psb_measure.psb_verifieds])
      : [];

    const element = psbVerifieds.find(element => element.id_resource === idResource);

    if (!element) {
      // Crear nueva entrada si no existe
      const shingleVerifiedInfo: PsbVerified = {
        id: uuidv4(),
        id_psb_measure: building.psb_measure.id,
        id_resource: idResource,
        is_verified: isVerified
      };
      return [...psbVerifieds, shingleVerifiedInfo];
    } else {
      // Actualizar entrada existente
      return psbVerifieds.map(x =>
        x.id_resource === idResource ? { ...x, is_verified: isVerified } : { ...x }
      );
    }
  }

  removeDuplicateResources(arr) {
    const seen = new Map();

    return arr.filter(item => {
      if (seen.has(item.id_resource)) {
        return false;
      } else {
        seen.set(item.id_resource, true);
        return true;
      }
    });
  }

  findResourceId(idResource: number) {
    const psbVerifieds = this.building?.psb_measure?.psb_verifieds
      ? [...this.building.psb_measure.psb_verifieds]
      : [];
    const verifiedInformation = psbVerifieds.find(x => x.id_resource == idResource);
    return verifiedInformation ? verifiedInformation.is_verified : false;
  }

  /**
   * Update project information locally and in redux
   * @param versions
   * @author: Carlos Rodríguez
   */
  saveProjectShingleBuilding(psb_measure: PsbMeasures, withRedux: boolean = true) {
    const promise = new Promise((resolve, reject) => {
      const buildingUpdated: Building = {
        ...this.building,
        isModified: true,
        psb_measure: { ...psb_measure, isModified: true }
      };

      console.log('saveProjectShingleBuilding PsbMeasures : ', psb_measure);
      const buildingsUpdated = this.buildings.map(x => {
        if (x.id == buildingUpdated.id) {
          return { ...buildingUpdated };
        } else {
          return { ...x };
        }
      });

      const version: Version = {
        ...this.project.versions.find(x => x.active),
        buildings: buildingsUpdated,
        isModified: true
      };

      const versions = this.project.versions.map(x => {
        if (x.id == version.id) {
          return { ...version };
        } else {
          return { ...x };
        }
      });

      const projectUpdated: Project = {
        ...this.project,
        isModified: true,
        versions: versions
      };

      this.update(this.project.id, projectUpdated, withRedux);
      resolve(null);
    });
    return promise;
  }

  /**
   * Update project information locally and in redux
   * @param versions
   * @author: Carlos Rodríguez
   */
  async savePsbMesaureMainBuilding(psb_measure: PsbMeasures, withRedux: boolean = true) {
    const buildingUpdated: Building = {
      ...this.mainBuilding,
      isModified: true,
      psb_measure: { ...psb_measure, isModified: true }
    };

    const buildingsUpdated = this.buildings.map(x => {
      if (x.id == buildingUpdated.id) {
        return { ...buildingUpdated };
      } else {
        return { ...x };
      }
    });

    const version = {
      ...this.project.versions.find(x => x.active),
      buildings: buildingsUpdated
    };

    const versions = this.project.versions.map(x => {
      if (x.id == version.id) {
        return { ...version };
      } else {
        return { ...x };
      }
    });

    const projectUpdated: Project = {
      ...this.project,
      isModified: true,
      versions: versions
    };

    await this.update(this.project.id, projectUpdated, withRedux);
  }

  /**
   * Update project information locally and in redux
   * @param building
   * @author: Carlos Rodríguez
   */
  saveProjectBuilding(building: Building, withRedux: boolean = true) {
    const buildingsUpdated = this.buildings.map(x => {
      if (x.id == building.id) {
        return { ...building, isModified: true };
      } else {
        return { ...x };
      }
    });

    const version = {
      ...this.project.versions.find(x => x.active),
      buildings: buildingsUpdated
    };

    const versions = this.project.versions.map(x => {
      if (x.id == version.id) {
        return { ...version };
      } else {
        return { ...x };
      }
    });

    const projectUpdated: Project = {
      ...this.project,
      isModified: true,
      versions: versions
    };

    this.update(this.project.id, projectUpdated, withRedux);
  }

  saveVersion(version: Version, withRedux: boolean = true) {
    const versions = this.project.versions.map(x => {
      if (x.id == version.id) {
        return { ...version, isModified: true };
      } else {
        return { ...x };
      }
    });

    const projectUpdated: Project = {
      ...this.project,
      isModified: true,
      versions: versions
    };

    this.update(this.project.id, projectUpdated, withRedux);
  }

  /**
   * Modificaciones Yunuel Jun, 2024
   */

  returnProjectsMaped(project) {
    let projectModel = project;
    projectModel.st_prospecting_material_type = '';
    projectModel.st_job_type = '';
    projectModel.st_email = '';
    projectModel.st_name = `${projectModel.contact_address.contact.first_name} ${projectModel.contact_address.contact.last_name} `;
    projectModel.st_address = `${projectModel.contact_address.address} ${projectModel.contact_address.city} ${projectModel.contact_address.country_state.country_state}`;
    projectModel.st_phone = projectModel.contact_address?.contact?.phones?.find(
      y => y.is_default == true
    )?.phone;
    projectModel.st_prospecting_type = projectModel.prospecting_type?.prospecting_type;
    projectModel.st_project_status = projectModel.project_status.project_status;

    if (!projectModel.versions || projectModel.versions.length == 0) {
      const version: Version = this.getNewEmptyVersion(projectModel);
      projectModel.versions = [];
      projectModel.versions.push(version);
    }

    projectModel.versions.forEach(versionItem => {
      versionItem.buildings.forEach(buildingItem => {
        // Prospecting Material Types
        if (buildingItem?.job_material_type?.material) {
          projectModel.st_prospecting_material_type += `${buildingItem.job_material_type.material}|`;
        }

        // Job Types
        if (buildingItem?.job_type?.job_type) {
          projectModel.st_job_type += `${buildingItem.job_type.job_type}|`;
        }

        // PSB Measures Verified
        if (buildingItem?.psb_measure?.psb_verifieds) {
          buildingItem.psb_measure.psb_verifieds = this.removeDuplicateResources([
            ...buildingItem.psb_measure.psb_verifieds
          ]);
        }
      });
    });

    // emails
    projectModel.contact_address.contact.emails.forEach(item => {
      projectModel.st_email += `${item?.email}|`;
    });

    return projectModel;
  }

  private getNewEmptyVersion(x: Project): Version {
    const proposalNumber = x.versions.length + 1;
    return {
      active: true,
      buildings: [],
      id: uuidv4(),
      shingle_lines: [],
      pv_trademarks: [],
      pv_material_colors: [],
      pv_colors: [],
      isModified: true,
      is_verified: false,
      is_current_version: true,
      id_project: x.id,
      id_cost_type: 1,
      project_version: 'Proposal 1 - ' + new Date().toLocaleDateString(),
      expected_acceptance_date: undefined
    };
  }
}
