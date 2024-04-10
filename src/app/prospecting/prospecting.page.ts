import { JobType } from 'src/app/models/job-type.mode';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController, Platform, NavController } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { ProspectingFilterComponent } from './components/prospecting-filter/prospecting-filter.component';
import { Project } from 'src/app/models/project.model';
import { ConfigsGeneralService } from '../services/configs-general.service';
import { ProjectsService } from '../services/projects.service';
import { AppState } from '../app.reducer';
import { Store } from '@ngrx/store';
import * as projectsActions from './prospecting.actions';
import { ProjectsRepository } from '../db/projects.respository';
import { Storage } from '@ionic/storage';
import { LoadingService } from '../shared/helpers/loading.service';
import { Subscription } from 'rxjs';
import { SyncProjectsService } from '../services/sync-projects.service';
import { ServeCLI } from '@ionic/cli/lib/serve';
import { SyncCatalogsService } from '../services/sync-catalogs.service';

@Component({
  selector: 'app-prospecting',
  templateUrl: './prospecting.page.html',
  styleUrls: ['./prospecting.page.scss']
})
export class ProspectingPage implements OnInit, OnDestroy {
  segment: string = 'pending-acceptance';
  projects: Project[];
  listPendingAcceptance: Project[] = [];
  listAcceptanceInProgress: Project[] = [];
  listAcepte: Project[] = [];
  listRejected: Project[] = [];
  user: User;
  idUserRole: number;
  searchText: string;
  daysProposalDelayed: number;
  repository: ProjectsRepository;
  exsitingProjectsIds: number[];
  storeSubs: Subscription;
  filterList: any = null;

  draftProjects: Project[] = [];
  grayProjects: Project[] = [];
  greenProjects: Project[] = [];
  yellowProjects: Project[] = [];
  redProjects: Project[] = [];

  id: number;
  contactDate: any;

  constructor(
    private modalController: ModalController,
    private projectService: ProjectsService,
    private auth: AuthService,
    private configService: ConfigsGeneralService,
    private store: Store<AppState>,
    private storage: Storage,
    private loading: LoadingService,
    private nav: NavController,
    private synprojects: SyncProjectsService,
    private syncCatalogs: SyncCatalogsService
  ) {
    this.repository = new ProjectsRepository(this.storage, `projects`);

    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.projects = state.projects;
      this.loadProject();
    });

    this.syncCatalogs.update();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Gets new projects (exclued exsiting projecst)
   * @param event
   */
  doRefresh(event) {
    this.synprojects.syncOfflineOnlyGet().then(() => {
      this.getNewProjects(event);
      if (event) event.target.complete();
    });
  }

  ngOnInit() {
    this.loading.loading(true);
    this.auth.getAuthUser().then(user => {
      this.user = user;
      this.idUserRole = parseInt(user.role.id_role);
    });

    this.configService.getConfig(1).then(config => {
      if (config) this.daysProposalDelayed = parseInt(config.data.value);
    });
    this.loadProjectStorage();
    // this.getNewProjects(null);
  }

  getNewProjects(event) {
    this.projectService
      .getOnlineProjects(this.exsitingProjectsIds)
      .then(async result => {
        if (event) event.target.complete();

        let newProjectsList: Project[];

        if (this.user.role.id_role == 1 || this.user.role.id_role == 2) {
          this.repository.findAll().then(localProjects => {
            let projects: Project[];

            if (result) {
              result.data.forEach(x => {
                if (localProjects) {
                  localProjects.data.map(x => {
                    x.st_prospecting_material_type = '';
                    x.st_job_type = '';
                    x.st_email = '';

                    x.st_name = `${x.contact_address.contact.first_name} ${x.contact_address.contact.last_name} `;
                    x.st_address = `${x.contact_address.address} ${x.contact_address.city} ${x.contact_address.country_state.country_state}`;
                    x.st_phone = x.contact_address.contact.phone;
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

                  projects = localProjects.data.filter(element => x.id != element.id);
                } else {
                  projects = [];
                }
              });
            }

            if (projects) {
              let filteredProjects: Project[] = result.data;
              projects.forEach(element => {
                filteredProjects = filteredProjects.filter(x => x.id != element.id);
              });

              newProjectsList = projects.concat(filteredProjects);
              this.repository.createSeveral(newProjectsList);
              this.store.dispatch(
                projectsActions.setProjects({ projects: newProjectsList })
              );
              this.exsitingProjectsIds = newProjectsList.map(x => x.id);
            }
            // this.loadProjectStorage();
          });
        } else {
          this.repository
            .findAll()
            .then(projects => {
              newProjectsList = projects
                ? projects.data.concat(result?.data ?? [])
                : result?.data ?? [];
              this.repository.createSeveral(newProjectsList);
              this.store.dispatch(
                projectsActions.setProjects({ projects: newProjectsList })
              );
              this.exsitingProjectsIds = newProjectsList.map(x => x.id);
              // this.loadProjectStorage();
            })
            .finally(() => {
              this.loading.loading(false);
            });
        }
      })
      .finally(() => {
        this.loading.loading(false);
      });
  }

  async loadProjectStorage() {
    await this.projectService.getLocalProjects().then(result => {
      let projects: Project[];
      if (parseInt(this.user.role.id_role) == 3) {
        // 3=Inspector
        if (!result) {
          return;
        }
        projects = result.data.filter(
          project => project.user_saleman.id_user == this.user.id
        );
      } else {
        projects = result?.data;
      }

      if (projects) {
        this.store.dispatch(projectsActions.setProjects({ projects }));
      }
    });

    this.exsitingProjectsIds = this.projects.map(x => x.id);
    this.getNewProjects(null);
  }

  async loadProject() {
    if (!this.projects || this.projects.length <= 0) {
      return;
    }

    const projectsCopy = [...this.projects];
    let projects: Project[] = JSON.parse(JSON.stringify(projectsCopy));

    if (this.user && parseInt(this.user.role.id_role) == 3) {
      // 3=Inspector

      projects = projects.filter(project => project.user_saleman.id_user == this.user.id);
    }

    projects.forEach(project => {
      project.next_contact_date_date = new Date(project.next_contact_date);
    });

    projects = projects.sort(
      (objA, objB) =>
        objA.next_contact_date_date.getTime() - objB.next_contact_date_date.getTime()
    );
    projects = this.contactGroupBy(projects, 'project_status');

    projects = projects.sort(
      (objA, objB) =>
        objA.next_contact_date_date.getTime() - objB.next_contact_date_date.getTime() &&
        objA.project_status.id - objB.project_status.id
    );

    this.loadProjectsByType(projects);
  }

  loadProjectsByType(projects) {
    this.listPendingAcceptance = [];
    this.listAcceptanceInProgress = [];
    this.listAcepte = [];
    this.listRejected = [];

    projects.forEach(project => {
      if (project.st_job_type?.startsWith('Repair')) {
        return;
      }
      // Clasificación por estado
      switch (project.project_status?.id) {
        case 1:
        case 2:
        case 3:
          this.listPendingAcceptance.push(project);
          this.listPendingAcceptance.push(project);
          break;
        case 4:
          this.listAcepte.push(project);
          break;
        case 5:
          this.listRejected.push(project);
          break;
      }

      // Verificación del tipo de trabajo
      if (!project.st_job_type?.startsWith('Repair')) {
        // Si no es un trabajo de reparación, y aún no está clasificado, entonces agrégalo a la lista de pendientes de aceptación
        if (project.project_status?.id !== 1 && project.project_status?.id !== 2) {
          //this.listPendingAcceptance.push(project);
        }
      }
    });
  }

  contactGroupBy(objectArray, property) {
    let group: any[] = [];
    let groups = this.groupBy(objectArray, property);
    Object.keys(groups).map(function (key) {
      group = group.concat(Object.values(groups[key]));
    });
    return group;
  }

  groupBy(objectArray, property) {
    return objectArray.reduce(function (acc, obj) {
      var key = obj[property][property];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }

  groupArrayOfObjects(list, key) {
    return list.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }

  /**
   * Change segment value
   * @param segmentValue
   */
  segmentChanged(event: any) {
    const segmentValue = event.detail.value;
    this.segment = segmentValue;
  }

  /**
   * Open filter modal
   * @author: Carlos Rodríguez
   */
  async openFilterModal() {
    const modal = await this.modalController.create({
      component: ProspectingFilterComponent,
      cssClass: 'mediascreen',
      componentProps: {
        idRole: this.user.role.id_role,
        filterList: this.filterList
      }
    });
    await modal.present();
    let info = await modal.onWillDismiss();
    this.filterProjects(info.data);
  }

  /**
   * Uasers logout
   */
  logout() {
    this.auth.logout();
  }

  /**
   * Filter by all filters
   * @param filterModel
   * @author: Carlos Rodríguez
   */
  async filterProjects(filterModel) {
    if (filterModel) {
      this.filterList = filterModel;
      let filteredProjects = [...this.projects];
      filteredProjects = this.filterByRole(filteredProjects);
      filteredProjects = this.filterByAsignedInspector(filterModel, filteredProjects);
      filteredProjects = this.filterByTypeEstimation(filterModel, filteredProjects);
      filteredProjects = this.filterByTypeOfWork(filterModel, filteredProjects);
      filteredProjects = this.filterByMaterial(filterModel, filteredProjects);

      let filterListIds = [];
      let _projects = filteredProjects.filter(item => {
        if (!filterListIds.includes(item.id)) {
          filterListIds.push(item.id);
          return item;
        }
      });

      this.loadProjectsByType(_projects);
    }
  }

  /**
   * Filter by role
   * @param filterModel
   * @returns Projects list
   * @author: Carlos Rodríguez
   */
  filterByRole(projects: Project[]): Project[] {
    let result: Project[] = [];
    const roleSingle = [3, 4];
    if (roleSingle.includes(parseInt(this.user.role.id_role))) {
      let itemsFiltered = projects.filter(x => x.user_saleman.id_user == this.user.id);
      result.push(...itemsFiltered);
    } else {
      result.push(...projects);
    }
    return result;
  }

  /**
   * Filter by asigned inspector
   * @param filterModel
   * @returns Projects list
   * @author: Carlos Rodríguez
   */
  filterByAsignedInspector(filterModel, projects: Project[]): Project[] {
    let result: Project[] = [];
    if (filterModel && filterModel.assigned_inspector) {
      filterModel.assigned_inspector.forEach(element => {
        let itemsFiltered = projects.filter(
          x =>
            `${x.user_saleman.contact.first_name} ${x.user_saleman.contact.last_name}` ==
            element.name
        );
        result.push(...itemsFiltered);
      });
      return result;
    } else {
      return projects;
    }
  }

  /**
   * Filter by type estimation
   * @param filterModel
   * @returns Projects list
   * @author: Carlos Rodríguez
   */
  filterByTypeEstimation(filterModel, projects: Project[]): Project[] {
    let result: Project[] = [];
    if (filterModel && filterModel.type_estimation) {
      filterModel.type_estimation.forEach(element => {
        let itemsFiltered = projects.filter(x => x.st_prospecting_type == element.name);
        result.push(...itemsFiltered);
      });
      return result;
    } else {
      return projects;
    }
  }

  /**
   * Filter by type of work
   * @param filterModel
   * @returns Projects list
   * @author: Carlos Rodríguez
   */
  filterByTypeOfWork(filterModel, projects: Project[]): Project[] {
    let result: Project[] = [];
    if (filterModel && filterModel.type_of_work) {
      filterModel.type_of_work.forEach(element => {
        let itemsFiltered = projects.filter(x => x.st_job_type.includes(element.name));

        result.push(...itemsFiltered);
      });
      return result;
    } else {
      return projects;
    }
  }

  classifyProjects(): void {
    const today = new Date();

    this.projects.forEach(project => {
      const nextContactDate = new Date(project.next_contact_date); // Convertir a objeto Date
      const timeDiff = nextContactDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff < 0 || !project.next_contact_date) {
        project.flag = '#E61E1E';
        this.redProjects.push(project);
      } else if (daysDiff === 0) {
        project.flag = '#f5ec05';
        this.yellowProjects.push(project);
      } else if (nextContactDate < today && daysDiff <= 7) {
        project.flag = '#E6D32E';
        this.greenProjects.push(project);
      } else {
        project.flag = '#17710E';
        this.draftProjects.push(project);
      }
    });
  }

  /**
   * Filter by material
   * @param filterModel
   * @returns Projects list
   * @author: Carlos Rodríguez
   */
  filterByMaterial(filterModel, projects: Project[]): Project[] {
    let result: Project[] = [];
    if (filterModel && filterModel.material) {
      filterModel.material.forEach(element => {
        let itemsFiltered = projects.filter(x =>
          x.st_prospecting_material_type.includes(element.name)
        );

        result.push(...itemsFiltered);
      });
      return result;
    } else {
      return projects;
    }
  }

  // next_contact_date
  //project_status
}
