import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Generic } from 'src/app/models/generic.model';
import { CheckboxList } from 'src/app/shared/interfaces/checkbox-list';

@Component({
  selector: 'app-popover-options-list',
  templateUrl: './popover-options-list.component.html',
  styleUrls: ['./popover-options-list.component.scss']
})
export class PopoverOptionsListComponent implements OnInit {
  @Input() options: Generic[];

  constructor(public popoverController: PopoverController) {}

  ngOnInit() {}

  optionSelected(option: Generic) {
    this.options.map(x => {
      if (x.id === option.id) {
        x.selected = true;
      } else {
        x.selected = false;
      }
    });

    this.popoverController.dismiss(option);
  }
}
