import { Component, Input, OnInit } from '@angular/core';
import { ProjectNote } from 'src/app/models/project-note.model';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
})
export class NotesListComponent implements OnInit {
  @Input() notes: ProjectNote[];

  constructor() {}

  ngOnInit() {}

  idIsValid(id: number) {
    return !isNaN(id);
  }
}
