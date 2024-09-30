import { Injectable } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from '../app.reducer';
import { AuthService } from '../login/services/auth/auth.service';
import { Project } from '../models/project.model';
import { User } from '../models/user.model';
import { LoadingService } from '../shared/helpers/loading.service';
import { ProjectsService } from './projects.service';
import { Storage } from '@ionic/storage';
import * as projectsActions from '../prospecting/prospecting.actions';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';

@Injectable({
  providedIn: 'root',
})
export class SyncProjectsService {
  projects: Project[];
  project: Project;
  user: User;

  constructor(
    private projectService: ProjectsService,
    private toastController: ToastController,
    private loading: LoadingService,
    private store: Store<AppState>,
    private auth: AuthService,
    private storage: Storage,
    private nav: NavController,
    private networkService: NetworkValidateService
  ) {
    this.store.select('projects').subscribe((state) => {
      this.projects = state.projects;
      this.project = state.project;
    });

    this.auth.getAuthUser().then((user) => {
      this.user = user;
    });
  }

  async syncOffline() {
    if (this.networkService.isConnected) {
      const toast = await this.toastController.create({
        message: 'The synchronization has finished',
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });

      this.loading.loading(true);

      const projectsData = await this.projectService.getLocalProjects();

      console.log("projectsData", projectsData);
      let syncProjects = projectsData.data.filter((x) => x.isModified);
      console.log("syncProjects", syncProjects);
      this.user = await this.auth.getAuthUser();

      const syncProjectsNotes = syncProjects
        .filter(x => /*x.user_saleman.id_user != this.user.id &&*/ x.project_notes.some(y => y.isModified))
        .map(x => ({ ...x, versions: [] }))
      /*
      syncProjects = syncProjects.filter(
        (x) => x.user_saleman.id_user == this.user.id
      );
      */

      syncProjects = [...syncProjects, ...syncProjectsNotes]

      const currentProjectId = this.project?.id;

      const syncProjectsObj: any[] = [...syncProjects];
      let lightProjects = [];
      for (const project of syncProjectsObj) {

        let versions = [];
        for (const version of project.versions) {

          let buildings = [];
          for (const building of version.buildings) {
            if (building.isModified || building.psb_measure?.isModified) {
              buildings.push(building);
            }
          }

          if (version.isModified == true || buildings.length > 0) {
            version.buildings = buildings;
            versions.push(version);
          }
        }

        if (project.isModified == true || versions.length > 0) {
          project.versions = versions;
          lightProjects.push(project);
        }
      }

      console.log("lightProjects", lightProjects);
      
      if (lightProjects.length > 0) {
        this.projectService.post(lightProjects).then(
          async (x) => {
            for (const project of x) {

              project.st_prospecting_material_type = '';
              project.st_job_type = '';
              project.st_email = '';

              project.st_name = `${project.contact_address.contact.first_name} ${project.contact_address.contact.last_name} `;
              project.st_address = `${project.contact_address.address} ${project.contact_address.city} ${project.contact_address.country_state.country_state}`;
              project.st_phone = project?.contact_address?.contact?.phones?.find(x => x.is_default == true)?.phone;
              project.st_prospecting_type = project?.prospecting_type?.prospecting_type;
              project.st_project_status = project.project_status.project_status;

              // prospecting_material_types
              project.versions.forEach((item1) => {
                item1.buildings.forEach((item2) => {
                  project.st_prospecting_material_type += `${item2?.job_material_type?.material}|`;
                });
              });

              // job_types
              project.versions.forEach((item1) => {
                item1.buildings.forEach((item2) => {
                  project.st_job_type += `${item2?.job_type?.job_type}|`;
                });
              });

              // emails
              project?.contact_address?.contact?.emails?.forEach((item) => {
                project.st_email += `${item?.email}|`;
              });

              await this.projectService.update(project.id, project, (currentProjectId == project.id));
            }

            const projects = await this.storage.get('projects');
            this.store.dispatch(projectsActions.setProjects({ projects }));

            toast.present();
            this.loading.loading(false);
            // this.setActiveBuilding();
            // this.nav.navigateRoot('home/prospecting');
          },
          (error) => {
            toast.message = 'Error';
            toast.color = 'danger';
            toast.present();
            this.loading.loading(false);
          }
        );
      } else {
        toast.message = 'Already up to date.';
        toast.color = 'dark';
        toast.present();
        this.loading.loading(false);
      }
    } else {
      const toast = await this.toastController.create({
        message: 'No connection. Please check your internet connection or disable the offline mode.',
        duration: 2000,
        color: 'warning',
        position: 'bottom',
      });
      toast.present();
    }
  }

  async syncOfflineOnlyGet(ids = [], forceUpdate = false) {
    if (this.networkService.isConnected) {
      const toast = await this.toastController.create({
        message: 'The synchronization has finished',
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });

      this.loading.loading(true);

      let projectUpdatedCount = 0;

      try {
        const currentProjectId = this.project?.id;

        const syncProjects = await this.projectService.getOnlineProjects(ids);
        const syncProjectsAny = JSON.parse(JSON.stringify(syncProjects.data));
        const projectsAny = JSON.parse(JSON.stringify(this.projects));

        const updatedProjects = syncProjectsAny.filter(serverProject => {
          const localProject = projectsAny.find(local => local.id == serverProject.id);
          return forceUpdate || serverProject.updatedAt > localProject.updatedAt;
        });

        projectUpdatedCount = updatedProjects.length;

        for (const project of updatedProjects) {

          project.st_prospecting_material_type = '';
          project.st_job_type = '';
          project.st_email = '';

          project.st_name = `${project.contact_address.contact.first_name} ${project.contact_address.contact.last_name} `;
          project.st_address = `${project.contact_address.address} ${project.contact_address.city} ${project.contact_address.country_state.country_state}`;
          project.st_phone = project?.contact_address?.contact?.phones?.find(x => x.is_default == true)?.phone;
          project.st_prospecting_type = project?.prospecting_type?.prospecting_type;
          project.st_project_status = project.project_status.project_status;

          // prospecting_material_types
          project.versions.forEach((item1) => {
            item1.buildings.forEach((item2) => {
              project.st_prospecting_material_type += `${item2?.job_material_type?.material}|`;
            });
          });

          // job_types
          project.versions.forEach((item1) => {
            item1.buildings.forEach((item2) => {
              project.st_job_type += `${item2?.job_type?.job_type}|`;
            });
          });

          // emails
          project?.contact_address?.contact?.emails?.forEach((item) => {
            project.st_email += `${item?.email}|`;
          });

          await this.projectService.update(project.id, project, (currentProjectId == project.id));
        }

        const projects = await this.storage.get('projects');
        this.store.dispatch(projectsActions.setProjects({ projects }));

        toast.present();
        this.loading.loading(false);

      } catch (error) {
        toast.message = 'Error';
        toast.color = 'danger';
        toast.present();
        this.loading.loading(false);
      }

      if (projectUpdatedCount == 0) {
        toast.message = 'Already up to date.';
        toast.color = 'dark';
        toast.present();
        this.loading.loading(false);
      }
    }
  }
}
