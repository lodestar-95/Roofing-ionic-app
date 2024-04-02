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
            x.st_prospecting_material_type = '';
            x.st_job_type = '';
            x.st_email = '';

            x.st_name = `${x.contact_address.contact.first_name} ${x.contact_address.contact.last_name} `;
            x.st_address = `${x.contact_address.address} ${x.contact_address.city} ${x.contact_address.country_state.country_state}`;
            x.st_phone = x.contact_address.contact?.phones?.find(y => y.is_default == true)?.phone;
            x.st_prospecting_type = x?.prospecting_type?.prospecting_type;
            x.st_project_status = x.project_status.project_status;

            // prospecting_material_types
            x.versions.forEach(item1 => {
              item1.buildings.forEach(item2 => {
                x.st_prospecting_material_type += `${item2?.job_material_type?.material}|`;
              });
            });

            // job_types
            x.versions.forEach(item1 => {
              item1.buildings.forEach(item2 => {
                x.st_job_type += `${item2?.job_type?.job_type}|`;
              });
            });

            // emails
            x?.contact_address?.contact?.emails?.forEach(item => {
              x.st_email += `${item?.email}|`;
            });
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
          .post<ApiResponse<Project[]>>(`${this.url}/projects/getProjects/`, body)
          .subscribe(
            result => {
              result.data.map(x => {
                x.st_prospecting_material_type = '';
                x.st_job_type = '';
                x.st_email = '';

                x.st_name = `${x.contact_address.contact.first_name} ${x.contact_address.contact.last_name} `;
                x.st_address = `${x.contact_address.address} ${x.contact_address.city} ${x.contact_address.country_state.country_state}`;
                x.st_phone = x.contact_address.contact?.phones?.find(y => y.is_default == true)?.phone;
                x.st_prospecting_type = x?.prospecting_type?.prospecting_type;
                x.st_project_status = x.project_status.project_status;

                if (!x.versions || x.versions.length == 0) {
                  const version: Version = this.getNewEmptyVersion(x);
                  x.versions = [];
                  x.versions.push(version);
                }

                // prospecting_material_types
                x.versions.forEach(item1 => {
                  item1.buildings.forEach(item2 => {
                    x.st_prospecting_material_type += `${item2?.job_material_type?.material}|`;
                  });
                });

                // job_types
                x.versions.forEach(item1 => {
                  item1.buildings.forEach(item2 => {
                    x.st_job_type += `${item2?.job_type?.job_type}|`;
                  });
                });

                // emails
                x?.contact_address?.contact?.emails?.forEach(item => {
                  x.st_email += `${item?.email}|`;
                });
              });
              resolve(result);
              this.storage.set('syncDate_' + this.user.id, new Date());
            },
            error => reject(error)
          );
      } else {
        resolve(null);
      }
    });
  }

  private getNewEmptyVersion(x: Project): Version {
    return {
      active: true, buildings: [], id: uuidv4(), shingle_lines: [], pv_trademarks: [], pv_material_colors: [],
      pv_colors: [], isModified: true, is_verified: false, is_current_version: true, id_project: x.id,
      id_cost_type: 1, project_version: 'v1.', expected_acceptance_date: undefined
    };
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
            result.data.st_prospecting_material_type = '';
            result.data.st_job_type = '';
            result.data.st_email = '';
            result.data.st_name = `${result.data.contact_address.contact.first_name} ${result.data.contact_address.contact.last_name} `;
            result.data.st_address = `${result.data.contact_address.address} ${result.data.contact_address.city} ${result.data.contact_address.country_state.country_state}`;
            result.data.st_phone = result.data.contact_address?.contact?.phones?.find(y => y.is_default == true)?.phone;
            result.data.st_prospecting_type =
              result.data.prospecting_type?.prospecting_type;
            result.data.st_project_status = result.data.project_status.project_status;

            // prospecting_material_types
            result.data.versions.forEach(item1 => {
              item1.buildings.forEach(item2 => {
                result.data.st_prospecting_material_type += `${item2?.job_material_type?.material}|`;
              });
            });

            // job_types
            result.data.versions.forEach(item1 => {
              item1.buildings.forEach(item2 => {
                result.data.st_job_type += `${item2?.job_type?.job_type}|`;
              });
            });

            // emails
            result.data.contact_address.contact.emails.forEach(item => {
              result.data.st_email += `${item?.email}|`;
            });

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
    return new Promise((resolve, reject) => {
      if (this.networkService.isConnected) {
        this.http
          .post<Project[]>(`${this.url}/projects/postProjects/`, projects)
          .subscribe(
            async result => {
              if (result) {
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

  getShingleVerifiedInformation(idResourse: number, isVerified = true, building: Building = this.building) {
    const psbVerifieds = building.psb_measure.psb_verifieds
      ? [...building.psb_measure.psb_verifieds]
      : [];
    const element = psbVerifieds.find(element => element.id_resource == idResourse);

    if (!element) {
      const shingleVerifiedInfo: PsbVerified = {
        id: uuidv4(),
        id_psb_measure: building.psb_measure.id,
        id_resource: idResourse,
        is_verified: isVerified
      };
      psbVerifieds.push(shingleVerifiedInfo);
      return psbVerifieds;
    } else {
      const psbVerifiedsUpdated = psbVerifieds.map(x => {
        if (x.id_resource == idResourse) {
          return { ...x, is_verified: isVerified };
        } else {
          return { ...x };
        }
      });

      return psbVerifiedsUpdated;
    }
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
}
