import { Component, Input, OnInit } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { v4 as uuidv4 } from 'uuid';

import { ProjectsService } from '../../../services/projects.service';
import { AuthService } from '../../../login/services/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { PopoverKindOfNoteComponent } from './components/popover-kind-of-note/popover-kind-of-note.component';
import { Project } from 'src/app/models/project.model';
import { ProjectNote } from 'src/app/models/project-note.model';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import * as prospectingActions from '../../../prospecting/prospecting.actions';
import { NotesService } from 'src/app/services/notes.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal-notes',
  templateUrl: './modal-notes.component.html',
  styleUrls: ['./modal-notes.component.scss'],
})
export class ModalNotesComponent implements OnInit {
  project: Project;
  textNote: string;
  workNotes: ProjectNote[];
  teamNotes: ProjectNote[];
  segment: string = 'work-notes';
  isPopoverOpen = false;
  user: User;
  storeSubs: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private projectService: ProjectsService,
    private toastController: ToastController,
    private popoverCtrl: PopoverController,
    private authService: AuthService,
    private store: Store<AppState>,
    private notesServices: NotesService
  ) {
    this.storeSubs =  this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      this.loadNotes();
      // this.getNotes();
    });
  }

  ngOnInit() {
    this.authService.getAuthUser().then((x) => (this.user = x));
    this.loadNotes();
    this.getNotes();
  }

  ngOnDestroy(): void {
    if (this.storeSubs) {
      this.storeSubs.unsubscribe();
    }
  }


  getNotes() {
    this.notesServices.getNotesByProject(this.project.id).then((result) => {
      if (!result || !this.project) {
        return;
      }

      const localNotes = this.project.project_notes.filter(x => isNaN(x.id));

      // result.data.forEach((note) => {
        // const exist =
        //   this.project.project_notes.filter((x) => x.id == note.id).length > 0;

        // if (!exist) {
          let projectUpdated: Project = {
            ...this.project,
            project_notes: [...result.data, ...localNotes],
          };

          this.projectService.update(this.project.id, projectUpdated);
        // }
      // });
    });
  }

  /**
   * Read notes array from project object
   * @author: Carlos Rodríguez
   */
  loadNotes() {
    if (this.project.project_notes) {
      this.workNotes = this.project.project_notes.filter(
        (x) => x.show_on_work_order
      );
      this.teamNotes = this.project.project_notes.filter(
        (x) => !x.show_on_work_order
      );
    } else {
      const projectUpdated = { ...this.project, project_notes: [] };

      this.store.dispatch(
        prospectingActions.setProject({ project: projectUpdated })
      );
    }
  }

  /**
   * Close modal
   * @author: Carlos Rodríguez
   */
  dismissModal(note?: ProjectNote) {
    this.modalCtrl.dismiss(note);
  }

  /**
   * Change de segment value
   * @param segmentValue
   * @author: Carlos Rodríguez
   */
  segmentChanged(event: any) {
    const segmentValue = event.detail.value;
    this.segment = segmentValue;
  }

  /**
   * Add note to project object and save in storage
   * @author: Carlos Rodríguez
   */
  saveNote(show_on_work_order: boolean) {
    const note: ProjectNote = {
      id: uuidv4(),
      id_project: this.project.id,
      datetime: new Date(),
      id_user: this.user.id,
      show_on_work_order,
      note: this.textNote,
      user: this.user,
      isModified: true
    };

    this.textNote = null;
    let projectUpdated: Project = {
      ...this.project,
      project_notes: [...this.project.project_notes, note],
      isModified: true
    };

    this.projectService.update(this.project.id, projectUpdated);
    this.segment = note.show_on_work_order ? 'work-notes' : 'team-notes';
    // this.loadNotes();
  }

  /**
   * Show message
   * @param message
   */
  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'dark',
      position: 'bottom',
    });
    toast.present();
  }

  /**
   * Open kind of notes popover
   * @param evento
   * @author: Carlos Rodríguez
   */
  async showKindOfNotePopover(evento) {
    if (!this.textNote) {
      this.presentToast('No text to save note');
      return;
    }
    const popover = await this.popoverCtrl.create({
      component: PopoverKindOfNoteComponent,
      event: evento,
      side: 'left',
    });

    await popover.present();
    const { data } = await popover.onWillDismiss();
    if (data) {
      this.saveNote(data.item.show_on_work_order);
    }
  }
}
