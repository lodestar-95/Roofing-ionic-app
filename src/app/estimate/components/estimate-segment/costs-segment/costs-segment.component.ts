import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.reducer';
import { CalculationService } from 'src/app/estimate/calculation/calculation.service';
import { Project } from 'src/app/models/project.model';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';

@Component({
  selector: 'app-costs-segment',
  templateUrl: './costs-segment.component.html',
  styleUrls: ['./costs-segment.component.scss'],
})
export class CostsSegmentComponent implements OnInit, OnDestroy {
  project: Project;
  storeSubs: Subscription;
  canGoToGenerate: boolean;
  alwaysAllowModification: boolean;

  constructor(
    private store: Store<AppState>,
    private calculation: CalculationService,
    private general: GeneralService,
    private nav: NavController) {
    this.storeSubs = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      this.canGoToGenerate = this.project?.versions?.find(x => x.active)?.shingle_lines?.some(x => x.is_selected) ?? false;
      this.getAlwaysAllowModification();
    });
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
  }

  ngOnInit() { }

  goToScope() {
    this.nav.navigateForward('home/scope-of-work');
  }
}

