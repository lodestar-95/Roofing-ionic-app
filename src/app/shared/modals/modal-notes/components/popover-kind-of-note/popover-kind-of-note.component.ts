import { Component, OnInit } from '@angular/core';
import { PopoverController, ToastController } from '@ionic/angular';

interface KindOfNote {
  name: string;
  color: string;
  isSelected: boolean;
  show_on_work_order: boolean;
}

@Component({
  selector: 'app-popover-kind-of-note',
  templateUrl: './popover-kind-of-note.component.html',
  styleUrls: ['./popover-kind-of-note.component.scss'],
})
export class PopoverKindOfNoteComponent implements OnInit {
  kindOfNote: KindOfNote[] = [
    {
      isSelected: false,
      name: 'Work notes',
      color: 'primary',
      show_on_work_order: true,
    },
    {
      isSelected: false,
      name: 'Internal team note',
      color: 'success',
      show_on_work_order: false,
    },
  ];

  constructor(
    private popoverCtrl: PopoverController,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

  /**
   * Select the kind of note
   * @param kind
   * @author: Carlos Rodríguez
   */
  selectKindOfNote(kind: KindOfNote) {
    this.kindOfNote.forEach((item) => {
      if (item.name == kind.name) {
        item.isSelected = true;
      } else {
        item.isSelected = false;
      }
    });
  }

  /**
   * Dismmis popover
   * @param value
   * @author: Carlos Rodríguez
   */
  onClick() {
    const kind = this.kindOfNote.filter((x) => x.isSelected)[0];
    if (!kind) {
      this.presentToast('Select a note type');
      return;
    }

    this.popoverCtrl.dismiss({
      item: kind,
    });
  }

  /**
   *
   * @param message
   * @author: Carlos Rodríguez
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
}
