import { Component, OnInit, ViewChild } from '@angular/core';
import { MenuController, ModalController, NavController } from '@ionic/angular';
import { ApiResponse } from '../shared/interfaces/api-response';
import { Resource } from '../models/resource.model';
import { CatalogsService } from '../services/catalogs.service';
import { Project } from '../models/project.model';
import { AppState } from '../app.reducer';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { User } from '../models/user.model';
import { SyncProjectsService } from '../services/sync-projects.service';
import { MaterialService } from '../services/material.service';
import { BugsReportModalComponent } from './modals/bugs-report/bugs-report.component';
import {
  BugsReport,
  BugsReportsService,
  JiraBugsReport
} from '../services/bugs-reports.service';
import { ImportModalComponent } from './modals/bugs-report/import-modal.component';
import { BugsReportPdfGeneratorService } from './services/bugs-report-pdf-generator-service';
import { SuccessDialogService } from '../common/services/success-dialog/success.service';
import { ErrorDialogService } from 'src/app/common/services/error-dialog/error.service';
import { AppConfig } from '../config/app';
import { ProjectsService } from '../services/projects.service';
import { Screenshot } from 'capacitor-screenshot';
import * as projectsActions from '../prospecting/prospecting.actions';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})

/**
 * @author: Carlos Rodríguez
 */
export class HomePage implements OnInit {
  @ViewChild('popover') popover;
  isOpen = false;
  menuFooter: ApiResponse<Resource[]>;
  projects: Project[];
  user: User;
  numberProjectsToSync = 0;
  report_bugs: BugsReport[];

  constructor(
    private menu: MenuController,
    private catalogsService: CatalogsService,
    private store: Store<AppState>,
    private auth: AuthService,
    private synprojects: SyncProjectsService,
    private projectService: ProjectsService,
    private materialService: MaterialService,
    private modalController: ModalController,
    // private mediaCapture: MediaCapture,
    private bugsReportsService: BugsReportsService,
    private bugsReportPdfGeneratorService: BugsReportPdfGeneratorService,
    private readonly navCtrl: NavController,
    private successDialogService: SuccessDialogService,
    private errorDialogService: ErrorDialogService,
    private storage: Storage
  ) {
    this.store.select('projects').subscribe(state => {
      this.report_bugs = state.reportbugs;

      this.projects = state.projects;
      if (!this.projects) {
        return;
      }
      this.getNumberProjectsToSync().then(x => {
        this.numberProjectsToSync = x;
      });
    });
  }

  ngOnInit(): void {
    this.menu.enable(true);
    this.getFooterMenu();

    this.auth.getAuthUser().then(user => {
      this.user = user;
    });
  }

  presentPopover(e: Event) {
    this.popover.event = e;
    this.isOpen = true;
  }

  /**
   * Uasers logout
   */
  logout() {
    this.auth.logout();
  }

  /**
   * Get resources and show or hide footer menu
   */
  getFooterMenu() {
    this.catalogsService.getMenu().then(result => {
      result.data.map(element => {
        element.component = `${element.resource}`;
        element.component = element.component.replace(' ', '_').toLowerCase();
        element.icon = element.id === 24 ? 'bug' : 'construct-outline';
      });

      this.menuFooter = result;
    });
  }

  /**
   * Send local info to API
   */
  async syncOffline() {
    const data = await this.storage.get('reportbugs');

    try {
      if (data.length > 0) {
        data.forEach(element => {
          this.sendReportbugs(element);
        })
        // await this.storage.remove(); // Clear local storage after sending data to API
        this.storage.remove('reportbugs');
      }
    } catch (error) {
      
    }
    await this.materialService.syncMaterialData()
    this.synprojects.syncOffline();
  }

  async sendReportbugs(data: any) {
    const bodyJira: JiraBugsReport = {
      proposal: data.proposal,
      action: data.action,
      description: data.description,
      localStorageCopy: data.localStorageCopy,
      caption: data.base64
    };
    const bodyBugReport: BugsReport = {
      proposal: data.proposal,
      action: data.action,
      description: data.description,
      localStorageCopy: data.localStorageCopy,
      localDBCopy: data.localDBCopy,
    };
    
    const issue = await this.bugsReportsService.saveJiraIssue(bodyJira);
    bodyBugReport.description = `https://ehroofing.atlassian.net/browse/${issue.key} ${bodyJira.description}`;
    this.bugsReportsService.save(bodyBugReport).then( async () => {
      // this.openSuccessModal('Bugs report sent successfully');
      console.log("Bugs report sent successfully")
      } ).catch(() => {
        this.errorDialogService.showAlert({TITLE:AppConfig.ERROR_SERVER});
      });
  }
  async getNumberProjectsToSync() {
    let syncProjects = this.projects.filter(x => x.isModified);
    if (!syncProjects) {
      return;
    }

    this.user = await this.auth.getAuthUser();
    syncProjects = syncProjects.filter(x => x.user_saleman.id_user == this.user.id);

    return syncProjects.length;
  }

  async openBugsReportModal(itemComponent: string) {
    if (itemComponent !== 'report_bug') {
      return;
    }

    // Capture image before showing modal
    const caption = await Screenshot.take();
    console.log(caption.base64);
    // Commenting out to fix crash until debugged properly
    // try {
    //   caption = await this.mediaCapture.captureImage({ limit: 1 })
    // } catch (e) {
    //   console.log(e)
    // }
    const modal = await this.modalController.create({
      component: BugsReportModalComponent,
      componentProps: {
        caption: caption.base64
      }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();

    this.store.dispatch(projectsActions.setBugs({ bug: { ...data, ...caption } }));

    let report = {
      ...data,
      ...caption
    };

    // let currentdata = this.storage.get("reportbugs");
    let reportbugsarray = new Array;
    reportbugsarray.push(report)
    this.storage.set('reportbugs', reportbugsarray);
    // const bodyJira: JiraBugsReport = {
    //   proposal: data.proposal,
    //   action: data.action,
    //   description: data.description,
    //   localStorageCopy: data.localStorageCopy,
    //   caption: caption.base64
    // };
    // const bodyBugReport: BugsReport = {
    //   proposal: data.proposal,
    //   action: data.action,
    //   description: data.description,
    //   localStorageCopy: data.localStorageCopy,
    //   localDBCopy: data.localDBCopy,
    // };

    // console.log("bodyJira", bodyJira);

    // const issue = await this.bugsReportsService.saveJiraIssue(bodyJira);
    // bodyBugReport.description = `https://ehroofing.atlassian.net/browse/${issue.key} ${bodyJira.description}`;

    // this.bugsReportsService.save(bodyBugReport).then( async () => {

    //   this.openSuccessModal('Bugs report sent successfully');
    //   } ).catch(() => {
    //     this.errorDialogService.showAlert({TITLE:AppConfig.ERROR_SERVER});
    //   });
  }

  async openBugsReportImportModal() {
    this.isOpen = false;
    const modal = await this.modalController.create({
      component: ImportModalComponent
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.localDBCopy) {
      const localDBCopy = JSON.parse(data.localDBCopy);
      this.catalogsService.createUser(localDBCopy.user);
      this.catalogsService.createUsers(localDBCopy.users);
      for (const [key, value] of Object.entries(localDBCopy)) {
        if (key.includes('resource_')) {
          this.catalogsService.createMenu(value);
        }
        if (key.includes('syncDate_')) {
          this.catalogsService.createSyncDate(value);
        }
      }

      if (localDBCopy.projects) {
        this.projectService.loadProjects(localDBCopy.projects);
        this.store.dispatch(
          projectsActions.setProjects({ projects: localDBCopy.projects })
        );
      }
    }
    if (data !== undefined) {
      // Install localStorageCopy
      for (const [key, value] of Object.entries(JSON.parse(data.localStorageCopy))) {
        if (key !== 'refreshToken' && key !== 'token') {
          localStorage.setItem(key, value as string);
        }
      }

      await this.bugsReportPdfGeneratorService.generatePdfUrls(data);

      this.navCtrl.navigateRoot('/home/prospecting');

      this.openSuccessModal('Snapshot loaded');
    }
  }

  /**
   * Something
   */
  async openSuccessModal(title: string) {
    this.successDialogService.showAlert({
      TITLE: title
    });
  }
}
