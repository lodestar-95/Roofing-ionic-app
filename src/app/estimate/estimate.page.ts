import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../app.reducer';
import { ProjectsService } from '../services/projects.service';
import * as prospectingActions from '../prospecting/prospecting.actions';
import { Project } from '../models/project.model';
import { Building } from '../models/building.model';
import { PsbUpgrade } from '../models/psb_upgrades.model';
import { ModalController } from '@ionic/angular';
import { PriceModalComponent } from './modals/price-modal/price-modal.component';
import { Subscription } from 'rxjs';
import { ModalNotesComponent } from '../shared/modals/modal-notes/modal-notes.component';
import { ModalNewContactDateComponent } from '../shared/modals/modal-new-contact-date/modal-new-contact-date.component';
import { ModalRejectProposalComponent } from '../shared/modals/modal-reject-proposal/modal-reject-proposal.component';

@Component({
  selector: 'app-estimate',
  templateUrl: './estimate.page.html',
  styleUrls: ['./estimate.page.scss'],
})
export class EstimatePage implements OnInit, OnDestroy {
  idProject: any;
  project: Project;
  mainBuilding: Building;
  materialWarrantySelected: PsbUpgrade;
  workWarrantySelected: PsbUpgrade;
  windWarrantySelected: PsbUpgrade;
  storeSubs: Subscription;
  showBuilding: boolean;
  tabSegment: string = "upgrades";

  constructor(
    private projectService: ProjectsService,
    private store: Store<AppState>,
    private modalController: ModalController
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.idProject = localStorage.getItem('idProject');

      this.project = state.project;

      if (!this.project) {
        this.getProject();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.getProject();
  }

  getProject() {
    this.projectService.get(this.idProject).then(
      (result) => {
        result.data.versions.map((x) => {
          x.active = x.is_current_version;
        });

        this.store.dispatch(
          prospectingActions.setProject({ project: result.data })
        );
      },
      (error) => {
        console.log(error);
      }
    );
  }

  async openPriceModal() {
    let costOpen = (this.tabSegment === 'costs') ? true : false;
    this.tabSegment = (this.tabSegment === 'costs') ? "upgrades" : this.tabSegment;
    const modal = await this.modalController.create({
      component: PriceModalComponent,
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      if (costOpen) {
        this.tabSegment = 'costs';
      }
    }
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

  async openRejectProposalModal() {
    const modal = await this.modalController.create({
      component: ModalRejectProposalComponent,
      cssClass: 'medium-screen',
    });
    await modal.present();
  }
}
