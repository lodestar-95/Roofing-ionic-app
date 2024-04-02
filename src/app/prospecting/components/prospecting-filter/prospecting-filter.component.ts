import { Component, Input, OnInit, Output } from '@angular/core';
import { UserSalemanService } from '../../../services/user-saleman.service';
import { ModalController } from '@ionic/angular';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { Filter } from 'src/app/models/filter.model';
import { Generic } from 'src/app/models/generic.model';
import { ProspectingFilter } from 'src/app/models/prospecting-filter.model';
import { UserSaleman } from 'src/app/models/user-saleman.model';

@Component({
  selector: 'app-prospecting-filter',
  templateUrl: './prospecting-filter.component.html',
  styleUrls: ['./prospecting-filter.component.scss']
})
export class ProspectingFilterComponent implements OnInit {
  @Input() idRole: number;
  @Input() filterList: any;

  materialTypesList: Generic[] = [];
  typesList: Generic[] = [];
  jobTypesList: Generic[] = [];
  userSalemanList: UserSaleman[];
  userList: Generic[] = [];

  constructor(
    private catalogsService: CatalogsService,
    private usersService: UserSalemanService,
    private modalCtrl: ModalController
  ) {}

  async loadCatalogs() {
    await this.usersService.getProspectingTypesAll().then(result => {
      this.userList.push({ id: -1, option: 'All', selected: false });
      this.userSalemanList = result.data.filter(user => user.id_role === 3);
      this.userSalemanList.forEach(user => {
        let option = user.contact.first_name + ' ' + user.contact.last_name;
        this.userList.push({
          id: user.id_user,
          option: option,
          selected: this.findSelectedItem('assigned_inspector', option)
        });
      });
    });
    await this.catalogsService.getProspectingTypes().then(result => {
      result.data.forEach(element => {
        this.typesList.push({
          id: element.id_prospecting_type,
          option: element.prospecting_type,
          selected: this.findSelectedItem('type_estimation', element.prospecting_type)
        });
      });
    });
    await this.catalogsService.getJobTypes().then(result => {
      result.data.forEach(element => {
        if(element.id == 17) return;
        this.jobTypesList.push({
          id: element.id,
          option: element.job_type,
          selected: this.findSelectedItem('type_of_work', element.job_type)
        });
      });
    });
    await this.catalogsService.getMaterialTypes().then(result => {
      result.data.forEach(element => {
        this.materialTypesList.push({
          id: element.id,
          option: element.material,
          selected: this.findSelectedItem('material', element.material)
        });
      });
    });
  }

  findSelectedItem(_type, _option) {
    let isSelected = false;
    if (this.filterList && this.filterList[_type] && this.filterList[_type].length > 0) {
      isSelected = this.filterList[_type].find(ele => ele.name === _option)
        ? true
        : false;
    }
    return isSelected;
  }

  onClickUser(object: Generic, event) {
    object.selected = event.target.checked;
    if (object.id === -1) {
      this.userList.forEach(element => {
        element.selected = event.target.checked;
      });
    }
  }

  onClickObject(object: Generic, event) {
    object.selected = event.target.checked;
  }

  ngOnInit() {
    this.loadCatalogs();
  }

  confirm() {
    let assignedInspector: Filter[] = this.getDataToFilter(this.userList);
    let typeEstimation: Filter[] = this.getDataToFilter(this.typesList);
    let material: Filter[] = this.getDataToFilter(this.materialTypesList);
    let typeWork: Filter[] = this.getDataToFilter(this.jobTypesList);
    let prospectingFilter: ProspectingFilter = {
      assigned_inspector: assignedInspector.length > 0 ? assignedInspector : undefined,
      type_estimation: typeEstimation.length > 0 ? typeEstimation : undefined,
      material: material.length > 0 ? material : undefined,
      type_of_work: typeWork.length > 0 ? typeWork : undefined
    };

    this.modalCtrl.dismiss(prospectingFilter);
  }

  getDataToFilter(list: Generic[]): Filter[] {
    let filters: Filter[] = [];
    list.forEach(element => {
      if (element.selected && element.id != -1) {
        filters.push({ id: element.id, name: element.option });
      }
    });
    return filters;
  }
}
