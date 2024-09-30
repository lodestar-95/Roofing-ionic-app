import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import moment from 'moment';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { Building } from 'src/app/models/building.model';
import { Project } from 'src/app/models/project.model';

@Component({
  selector: 'app-prospecting-item',
  templateUrl: './prospecting-item.component.html',
  styleUrls: ['./prospecting-item.component.scss']
})
export class ProspectingItemComponent implements OnInit {
  status: string = '';
  @Input() project: Project;
  @Input() daysProposalDelayed: number;
  @Input() idUserRole: number;
  @Output() projectEmited = new EventEmitter<Project>();
  nextContactDate: string;
  projectBuilding: Building;
  totalProjectBuildings: number;
  projectStatus: string;

  constructor(private auth: AuthService) {}

  onClick(project: Project) {
    this.projectEmited.emit(project);
  }

  ngOnInit() {
    this.status = this.getStatus();
    this.projectStatus = this.project.project_status.project_status;
    const nextContactDate = this.getNextContactDate();
    this.project.versions.forEach(projectVersion => {
      if (projectVersion.is_current_version) {
        this.totalProjectBuildings =
          projectVersion.buildings.filter(building => building.deletedAt == null).length -
          1;
        projectVersion.buildings.forEach(projectBuildings => {
          if (projectBuildings.is_main_building) {
            this.projectBuilding = projectBuildings;
          }
        });
      }
    });
  }
  getStatus(): string {
    const {isValidDate, projectDateStr} = this.getNextContactDate();
    let color = 'draft';
    const hasContactDate = !!this.project.next_contact_date;
    const projectStatusId = this.project.id_project_status;

    const todayDate = moment().format('YYYY-MM-DD');
    if (!hasContactDate && projectStatusId == 1) {
        color = 'draft'; // Initial State
    }
    if (!hasContactDate && projectStatusId > 2 ) {
        color = 'gray';
    }
    if (hasContactDate && isValidDate && todayDate<projectDateStr) {
        color = 'green';
    }
    if (hasContactDate && isValidDate && todayDate===projectDateStr) {
        color = 'yellow';
    }
    if (hasContactDate && isValidDate && todayDate>projectDateStr) {
        color = 'red';
    }

    return color + '-status';
  }

  getNextContactDate(){
    let isValidDate = false;
    let projectDate = null;
    let projectDateStr = null;
    if(this.project.next_contact_date){
        isValidDate = true;
        let m = moment.utc(this.project.next_contact_date);
        this.nextContactDate = m.format('MM/DD/YYYY'); // 06/01/2019
        projectDate = this.nextContactDate;
        projectDateStr = m.format('YYYY-MM-DD');
    }else{
        this.nextContactDate = 'No contact date';
    }
    return {isValidDate, projectDate, projectDateStr};
  }
}
