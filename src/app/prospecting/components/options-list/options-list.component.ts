import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { PsbOption } from 'src/app/models/psb-option.model';
import { ProjectsService } from 'src/app/services/projects.service';
import { OptionsComponent } from '../../modals/options/options.component';

@Component({
  selector: 'app-options-list',
  templateUrl: './options-list.component.html',
  styleUrls: ['./options-list.component.scss'],
})

/**
 * @author: Carlos Rodríguez
 */
export class OptionsListComponent implements OnInit, OnDestroy {
  @Input() options: PsbOption[];
  project: Project;
  building: Building;
  buildings: Building[];
  storeSubs: Subscription;

  constructor(
    private alertController: AlertController,
    private modalController: ModalController,
    private store: Store<AppState>,
    private projectService: ProjectsService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;

      if (!this.project) {
        return;
      }
      const { buildings } = this.project.versions.find((x) => x.active);
      this.buildings = buildings;
      this.building = buildings.find((x) => x.active);
    });
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  /**
   * Conform delete
   */
  async presentDeleteAlert(option: PsbOption) {
    const alert = await this.alertController.create({
      message: 'Are you sure to delete this Option?',
      buttons: [
        {
          text: 'Yes',
          role: 'confirm',
        },
        {
          text: 'No',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
    await alert.onWillDismiss();
    const { role } = await alert.onDidDismiss();
    if (role == 'confirm') {
      this.delete(option.id);
    }
  }

  /**
   * Open options modal
   */
  async openModalOptions(option: PsbOption) {
    const modal = await this.modalController.create({
      component: OptionsComponent,
      componentProps: {
        option,
      },
    });
    await modal.present();
  }

  /**
   * Remove local option
   * @param id
   */
  delete(id) {
    const options = [
      ...this.building.psb_measure.psb_options.filter((x) => x.id !== id),
    ];

    const psb: PsbMeasures = {
      ...this.building.psb_measure,
      psb_options: options,
    };

    this.projectService.saveProjectShingleBuilding(psb);
  }
}
