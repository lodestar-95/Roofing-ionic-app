import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { now } from 'moment';
import { Observable, Subscription } from 'rxjs';
import { first, take } from 'rxjs/operators';
import { AppState } from 'src/app/app.reducer';
import { ProjectContactDate } from 'src/app/models/project-contact-date.model';
import { Project } from 'src/app/models/project.model';
import {
  selectProject,
  selectProjectDates,
  selectProjectNextContactDate
} from 'src/app/prospecting/state/propsecting.selectors';
import { ProjectsService } from 'src/app/services/projects.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-modal-new-contact-date',
  templateUrl: './modal-new-contact-date.component.html',
  styleUrls: ['./modal-new-contact-date.component.scss']
})
export class ModalNewContactDateComponent implements OnInit {
  date: string;
  isDatePopUpOpen = false;
  dates$: Observable<ProjectContactDate[]>;
  nextDate$: Observable<ProjectContactDate>;

  project$: Observable<Project>;
  project: Project;
  projectSubcription$: Subscription;
  minDate: Date;
  minDateString: string;
  newContactDate: string = '';
  fecha: any;

  mdlDateTitle:string = '';
  isMdlDateOpen:boolean = false;

  constructor(
    public modal: ModalController,
    private projectService: ProjectsService,
    public toastController: ToastController,
    private store: Store<AppState>
  ) {
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDateString = this.minDate.toISOString();
    this.date = this.minDate.toISOString();
  }

  async ngOnInit() {
    this.dates$ = this.store.pipe(select(selectProjectDates))
                    .pipe(
                        filter((dateData:any) => {
                        const date = new Date(dateData.contact_date);
                        return date.getFullYear() === 1969;
                        })
                    );
    this.nextDate$ = this.store.pipe(select(selectProjectNextContactDate));
    this.project$ = this.store.pipe(select(selectProject));

    this.project = {
      ...(await this.store.pipe(select(selectProject), first()).toPromise())
    };
  }
  

  /**
   * Save project Date
   */
  saveNewContactDate() {
    if(this.project?.next_contact_date){
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const nextContactDate = new Date(this.project.next_contact_date);
        nextContactDate.setHours(0, 0, 0, 0);

        const id_project = this.project?.id;
        let project_contact_dates = this.project?.project_contact_dates
        ? [...this.project?.project_contact_dates]
        : [];

        if (nextContactDate.getTime() <= now.getTime()) {
            project_contact_dates.push({ id_project, contact_date: nextContactDate });
            this.project.project_contact_dates = project_contact_dates;
        }
        this.project.isModified = true;
        this.projectService.update(id_project, { ...this.project, project_contact_dates });
        this.presentToastOk();
    }
    this.modal.dismiss({
        redirect: false,
        saveDb:true
    });
  }

  /** */
  async presentToastOk() {
    const toast = await this.toastController.create({
      message: 'Data has been saved.',
      duration: 2000
    });
    toast.present();
  }

  /**
   * Modal Date Functions
   */
  openModalDatetime() {
    let minDate = new Date();
    this.mdlDateTitle = 'New Contact Date';
    if(this.project?.next_contact_date){
        minDate = new Date();
    }
    this.minDateString = minDate.toISOString();
    this.isMdlDateOpen = true;
  }
  mdlResponsePayload(payload: any) {
    this.isMdlDateOpen = payload.isDatePopUpOpen;
    if(payload.wasSelectedDate){
      var dateSelected = new Date(payload.dateSelected);
      this.project.next_contact_date = dateSelected;
    }
  }

}
