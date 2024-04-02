import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-add-note',
  templateUrl: './add-note.component.html',
  styleUrls: ['./add-note.component.scss'],
})
export class AddNoteComponent implements OnInit {
  note: string;

  constructor(private popoverController:PopoverController) { }

  ngOnInit() {}

  confirm() {
    this.popoverController.dismiss(this.note);
  }

}
