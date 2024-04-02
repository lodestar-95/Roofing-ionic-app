import { Component, OnDestroy, OnInit } from '@angular/core';
import { PriceList } from 'src/app/models/price-list.model';
import { PriceListDto } from 'src/app/models/pricelist-dto.model';
import { Suppiler } from 'src/app/models/supplier.model'
import { ActivatedRoute } from '@angular/router';
import { IonRouterOutlet, MenuController, ModalController } from '@ionic/angular';
import { Project } from 'src/app/models/project.model';
import { ModalNotesComponent } from 'src/app/shared/modals/modal-notes/modal-notes.component';
import { ProjectsService } from 'src/app/services/projects.service';
import { MaterialService } from 'src/app/services/material.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import * as prospectingActions from 'src/app/prospecting/prospecting.actions';
import { Building } from 'src/app/models/building.model';
import { ModalNewContactDateComponent } from 'src/app/shared/modals/modal-new-contact-date/modal-new-contact-date.component';
import { ModalRejectProposalComponent } from 'src/app/shared/modals/modal-reject-proposal/modal-reject-proposal.component';
import { ModalAcceptanceComponent } from 'src/app/shared/modals/modal-acceptance/modal-acceptance.component';
import { element } from 'protractor';
import { Generic } from '../models/generic.model';

@Component({
  selector: 'app-material',
  templateUrl: './material.page.html',
  styleUrls: ['./material.page.scss'],
})
export class MaterialPage implements OnInit, OnDestroy {
  id: number;
  project: Project;
  building: Building;
  showBuilding: boolean = true;
  suppliers: Suppiler[];
  pricelists: PriceList[];
  pricelistsdto: PriceListDto[] = [];
  searchResult: PriceListDto [];
  chkOnlyCurrent: boolean = false;
  searchText: string ='0';
  constructor(
    private projectService: ProjectsService,
    private materialService: MaterialService,
    private route: ActivatedRoute,
    private modalController: ModalController,
    private store: Store<AppState>,
    private menu: MenuController,
    private routerOutlet: IonRouterOutlet
  ) {}


  ngOnDestroy() {
    this.menu.enable(false);
    this.routerOutlet.swipeGesture = true;
  }
  
  async getPriceList() {
    this.pricelists = (await this.materialService.priceListRepository.findAll()).data;
    this.suppliers = (await this.materialService.supplierRepository.findAll()).data;
    
    this.pricelists.forEach(price => {
      let pricelistdto: PriceListDto = {
        id: price.id,
        is_current: price.is_current,
        start_date: price.start_date,
        id_supplier: price.id_supplier,
        supplier: this.suppliers.filter(supp => price.id_supplier == supp.id)[0].supplier,
        toLowerCase: function (): unknown {
          throw new Error('Function not implemented.');
        }
      };
      this.pricelistsdto.push(pricelistdto);
      });
    
  }

  ngOnInit() {
    this.menu.enable(true);
    this.getProject();
    this.routerOutlet.swipeGesture = false;
    this.getPriceList();
    this.searchResult = this.pricelistsdto;
    
  }
  showBuildings() {
    const building: Building = {
      ...this.building,
      active: false
    };

    this.projectService.saveProjectBuilding(building);

    this.showBuilding = true;
  }

  async openNotesModal() {
    const modal = await this.modalController.create({
      component: ModalNotesComponent,
      cssClass: 'fullscreen'
    });
    await modal.present();
  }
  getProject() {
    this.projectService.get(this.id).then(
      result => {
        result.data.versions.map(x => {
          x.active = x.is_current_version;

          x.buildings.map(x => {
            x.active = false;
          });
        });

        this.store.dispatch(prospectingActions.setProject({ project: result.data }));
      },
      error => {
        console.log(error);
      }
    );
  }
  

  searchPricelist(event){
    this.searchText = event.target.value.toLowerCase();
    this.filterPricelist();
    
  }
  onlyCurrentSelected() {
    this.filterPricelist()
  }

  filterPricelist(){
    if(this.searchText == ''){
      this.searchResult = this.pricelistsdto;
    }
    else{
      this.searchResult = this.pricelistsdto.filter((d) => d.supplier.toLowerCase().indexOf(this.searchText) > -1 || d.start_date.toString().indexOf(this.searchText) > -1);
    }
    
    if (this.chkOnlyCurrent){
      this.searchResult = this.searchResult.filter((d) => d.is_current == true);

    }
  }
  
}