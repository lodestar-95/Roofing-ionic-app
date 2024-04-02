import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ModalNotesComponent } from './modal-notes/modal-notes.component';
import { NotesListComponent } from './modal-notes/components/notes-list/notes-list.component';
import { HomePageModule } from '../../home/home.module';
import { PopoverKindOfNoteComponent } from './modal-notes/components/popover-kind-of-note/popover-kind-of-note.component';
import { ProspectingPageModule } from 'src/app/prospecting/prospecting.module';
import { ModalNewContactDateComponent } from './modal-new-contact-date/modal-new-contact-date.component';
import { ModalRejectProposalComponent } from './modal-reject-proposal/modal-reject-proposal.component';
import { ModalAcceptanceComponent } from './modal-acceptance/modal-acceptance.component';
import { CalendarModalsComponent } from './calendar-modals/calendar-modals.component';

@NgModule({
  declarations: [
    ModalNotesComponent,
    NotesListComponent,
    PopoverKindOfNoteComponent,
    ModalNewContactDateComponent,
    ModalRejectProposalComponent,
    ModalAcceptanceComponent,
    CalendarModalsComponent
  ],
  imports: [CommonModule, IonicModule, HomePageModule, FormsModule, ReactiveFormsModule, ProspectingPageModule],
})
export class ModalsModule {}
