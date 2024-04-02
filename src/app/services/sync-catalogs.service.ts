import { Injectable } from '@angular/core';
import { CatalogsService } from '../services/catalogs.service';
import { ProposalDescriptionsService } from '../services/proposal-descriptions.service';
import { MaterialService } from '../services/material.service';


@Injectable({
  providedIn: 'root'
})

export class SyncCatalogsService {
    constructor(
      private catalogsService: CatalogsService,
      private descriptionService: ProposalDescriptionsService,
      private materialService: MaterialService
      ) {
        /*
        this.store.select('projects').subscribe((state) => {
          this.projects = state.projects;
          this.project = state.project;
        });

        this.auth.getAuthUser().then((user) => {
          this.user = user;
        });
        */
    }


  /**
   *
   * @author: Carlos Rodríguez
   */
  update() {
    const start = new Date();
    console.log('starting catalogs importation: ' + start.toDateString() + ' ' +  start.getHours() + ':'
                + start.getMinutes() + ':' + start.getSeconds() + start.getMilliseconds());


    this.catalogsService.getInitialcatalogs();
    this.descriptionService.getProposalDescriptions();
    this.materialService.downloadMaterialData();


    const end = new Date();
    console.log('end of catalogs importation: ' + end.toDateString() + ' ' +  end.getHours() + ':'
                + end.getMinutes() + ':' + end.getSeconds() + end.getMilliseconds());
  }

}
