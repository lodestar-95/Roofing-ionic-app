import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Generic } from 'src/app/models/generic.model';
import { CheckboxList } from 'src/app/shared/interfaces/checkbox-list';

@Component({
  selector: 'app-popover-options-list-searchable',
  templateUrl: './popover-options-list-searchable.component.html',
  styleUrls: [ ]
})
export class PopoverOptionsListSearchableComponent implements OnInit {
  @Input() options: Generic[];
  filtered: Generic[];

  constructor(public popoverController: PopoverController) {}

  ngOnInit() {
    this.filtered = [...this.options];
  }

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

  handleInput(event) {
    const query = event.target.value.toLowerCase();
    this.filtered = this.options.filter((d) => d.option.toLowerCase().indexOf(query) > -1);
  }
}
