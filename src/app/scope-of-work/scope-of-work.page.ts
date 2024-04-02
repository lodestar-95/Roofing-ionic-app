import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from '../app.reducer';
import { Project } from '../models/project.model';
import { ProjectsService } from '../services/projects.service';
import * as prospectingActions from '../prospecting/prospecting.actions';
import { NavController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { PriceModalComponent } from '../estimate/modals/price-modal/price-modal.component';
import { ModalNotesComponent } from '../shared/modals/modal-notes/modal-notes.component';
import { ModalNewContactDateComponent } from '../shared/modals/modal-new-contact-date/modal-new-contact-date.component';
import { ModalRejectProposalComponent } from '../shared/modals/modal-reject-proposal/modal-reject-proposal.component';

@Component({
  selector: 'app-scope-of-work',
  templateUrl: './scope-of-work.page.html',
  styleUrls: ['./scope-of-work.page.scss']
})
export class ScopeOfWorkPage implements OnInit {
  project: Project;
  storeSubs: Subscription;
  idProject: any;
  showBuilding: boolean;
  allSWActive: boolean = true;

  constructor(
    private store: Store<AppState>,
    private projectService: ProjectsService,
    private nav: NavController,
    private modalController: ModalController
  ) {
    this.storeSubs = this.store.select('projects').subscribe(state => {
      this.idProject = localStorage.getItem('idProject');
      this.project = state.project;
    });
  }
  ngOnInit() { }

  onDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.getProject();
  }

  getProject() {
    this.projectService.get(this.idProject).then(
      result => {
        result.data.versions.map(x => {
          x.active = x.is_current_version;
        });
        this.store.dispatch(prospectingActions.setProject({ project: result.data }));
      },
      error => {
        console.log(error);
      }
    );
  }

  goToScope() {
    this.nav.navigateForward('pdf-viewer-page', {
      queryParams: { project: this.project }
    });
  }
  async openPriceModal() {
    const modal = await this.modalController.create({
      component: PriceModalComponent
    });
    await modal.present();
  }

  async openNotesModal() {
    const modal = await this.modalController.create({
      component: ModalNotesComponent,
      cssClass: 'fullscreen'
    });
    await modal.present();
  }

  /**
   * Show New Contact Date Modal
   * @return void
   */
  async openNewContactDateModal() {
    const modal = await this.modalController.create({
      component: ModalNewContactDateComponent,
      cssClass: 'small-screen',
    });
    await modal.present();
  }
  /**
   * Show Reject Proposal Modal
   * @return void
   */
   async openRejectProposalModal() {
    const modal = await this.modalController.create({
      component: ModalRejectProposalComponent,
      cssClass: 'medium-screen',
    });
    await modal.present();
  }
}
