import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MenuController, NavController, PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from '../../../app.reducer';
import { Project } from '../../../models/project.model';
import { ProjectsService } from '../../../services/projects.service';
import * as prospectingActions from '../../../prospecting/prospecting.actions';
import { PopoverBidSheetBuildingComponent } from '../../components/popover-bid-sheet-building/popover-bid-sheet-building.component';
import { Building } from '../../../models/building.model';
import { Table } from '../../models/bid-sheet.model';
import { BidSheetService } from './bid-sheet.service';
import { CalculationService } from '../../../estimate/calculation/calculation.service';
import { ActivatedRoute } from '@angular/router';
import { CatalogsService } from '../../../services/catalogs.service';
import { BidSheetCalculationService } from './calculations.service';

@Component({
  selector: 'app-bid-sheet',
  templateUrl: './bid-sheet.page.html',
  styleUrls: ['./bid-sheet.page.scss'],
})
export class BidSheetPage implements OnInit, OnDestroy {
  storeSub$: Subscription;
  project: Project;
  projectId: any;
  building: Building;
  buildingId: any;
  trademark: any;
  trademarkId: number;
  materialType: any;
  materialTypeId: number;
  tables: Table[];
  calculations: any;
  message: string;

  constructor(private menu: MenuController,
    private projectService: ProjectsService,
    private popoverController: PopoverController,
    private store: Store<AppState>,
    private bidSheetService: BidSheetService,
    private route: ActivatedRoute,
    private catalogs: CatalogsService,
    private nav: NavController,
    private bidCalculation: BidSheetCalculationService) {
    this.setActiveTradeMark();
    this.setActiveMaterialType();
    this.message = '';

    this.storeSub$ = this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        this.getProject();
      }
    });

    this.bidCalculation.calculationSubject.subscribe((data)=>{
      this.calculations = data;
      this.initData();
    });
    
  }

  async setActiveTradeMark() {
    this.trademarkId = parseInt(this.route.snapshot.paramMap.get('trademark'), 10);
    const trademarks = await this.catalogs.getTrademarks();
    this.trademark = trademarks.data.find(x => x.id === this.trademarkId);
  }

  async setActiveMaterialType() {
    this.materialTypeId = parseInt(this.route.snapshot.paramMap.get('materialtype'), 10);
    const materialTypes = await this.catalogs.getMeasuresMaterialTypes();
    this.bidSheetService.materialPrices = (await this.catalogs.getMaterialPrices()).data;
    this.materialType = materialTypes.data.find(x => x.id === this.materialTypeId);
  }

  ngOnInit() {
    this.menu.enable(true);
  }

  getProject() {
    this.projectId = localStorage.getItem('idProject');
    this.projectService.get(this.projectId).then(
      (result) => {
        result.data.versions.map((x) => {
          x.active = x.is_current_version;
        });

        this.store.dispatch(
          prospectingActions.setProject({ project: result.data })
        );
      },
      (error) => {
        console.error(error);
      }
    );
  }

  initData() {
    try {
      if (!this.project) {
        return;
      }

      this.initBidService();
      this.setActiveVersionBuilding();
      this.bidSheetService.getFormatedTableData(this.calculations.data, this.building.id).then(data => {
        this.tables = data;
        data.forEach(concept => {
          concept.sections.forEach( section => {
            section.concepts.forEach(concept => {
              if(concept.description == 'ERROR'){
                this.message = 'SOME PROBLEMS HAPPENED, PLEASE CHECK BIDSHEET TO GET MORE INFO.';
              }
            })
          });
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  setActiveVersionBuilding() {
    const activeVersionIndex = this.project.versions.findIndex((x) => x.active);
    this.building = this.project.versions[activeVersionIndex].buildings.find(x => x.active);
    this.buildingId = this.building?.id;

    if (!this.building) {
      this.buildingId = localStorage.getItem('idBuilding');
      this.building = this.project.versions[activeVersionIndex].buildings.find(x => (x.id + '') === this.buildingId);
    }

    if (!this.building) {
      this.building = this.project.versions[activeVersionIndex].buildings.find(x => x.is_main_building);
      this.buildingId = this.building?.id;
    }
  }

  initBidService() {
    this.bidSheetService.activeTradeMarkId = this.trademarkId;
    this.bidSheetService.activeMaterialTypeId = this.materialTypeId;

    const activeVersion = this.project.versions.find((x) => x.active);
    this.bidSheetService.activeVersionId = activeVersion?.id;
    this.bidSheetService.activeCostTypeId = activeVersion?.id_cost_type ?? 1;
  }

  ngOnDestroy(): void {
    if (this.storeSub$) {
      this.storeSub$.unsubscribe();
    }
  }

  async openPopoverBuildings(e: Event) {
    const activeVersion = this.project.versions.find(x => x.active);
    const popover = await this.popoverController.create({
      component: PopoverBidSheetBuildingComponent,
      event: e,
      alignment: 'center',
      side: 'bottom',
      componentProps: {
        buildings: activeVersion.buildings
      }
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if (!data) {
      return;
    }

    const building = data[0];
    const version = this.project.versions.find((x) => x.active);
    const { buildings } = this.project.versions.find((x) => x.active);

    localStorage.setItem('idBuilding', building.id + '');

    const buildings2 = buildings.map((x) => {
      if (building.id == x.id) {
        return { ...x, active: true };
      } else {
        return { ...x, active: false };
      }
    });

    const versions = this.project.versions.map((x) => {
      if (x.id === version.id) {
        return { ...x, buildings: buildings2 };
      } else {
        return { ...x };
      }
    });

    this.project = { ...this.project, versions };
    this.initData();
  }

  closePage() {
    this.nav.back();
  }
}
