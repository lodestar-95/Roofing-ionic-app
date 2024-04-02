import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { CostType } from 'src/app/models/cost_type.model';
import { Version } from 'src/app/models/version.model';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';

@Component({
  selector: 'app-price-modal',
  templateUrl: './price-modal.component.html',
  styleUrls: ['./price-modal.component.scss'],
})
export class PriceModalComponent implements OnInit, OnDestroy {
  option = 1;
  costTypes: CostType[];
  storeSubs: Subscription;
  costType: CostType;
  version: Version;

  constructor(
    private modalController: ModalController,
    private catalogs: CatalogsService,
    private store: Store<AppState>,
    private projectService: ProjectsService
  ) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      const project = state.project;
      if (!project) {
        return;
      }

      this.version = project.versions.find((x) => x.active);
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  ngOnInit() {
    this.catalogs.getCostTypes().then((result) => {
      this.costTypes = result.data;
      this.costTypes.forEach((element) => {
        if (element.id == this.version.id_cost_type) {
          this.option = element.id;
          this.costType = element;
        }
      });
    });
  }

  /**
   * Save lodal data and close modal
   */
  onConfirm() {
    const version = { ...this.version, id_cost_type: this.costType.id };
    this.projectService.saveVersion(version);
    this.modalController.dismiss('data');
  }

  /**
   * Selcet option
   * @param costType
   */
  changeOption(costType: CostType) {
    this.costType = costType;
  }
}
