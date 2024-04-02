import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Project } from 'src/app/models/project.model';

@Component({
  selector: 'app-prospecting-list',
  templateUrl: './prospecting-list.component.html',
  styleUrls: ['./prospecting-list.component.scss'],
})
export class ProspectingListComponent implements OnInit {
  @Input() projects: Project[];
  @Input() searchText: string;
  @Input() daysProposalDelayed: number;
  @Input() idUserRole: number;

  constructor(private nav: NavController) {}

  ngOnInit() {}

  onClick(project: Project) {
    switch (project.id_project_status){
      case 4:
        this.nav.navigateForward(`/home/review-materials/${project.id}`);
      break;

      default:
      this.nav.navigateForward(`/home/prospecting/detail/${project.id}`);
    }

  }
}
