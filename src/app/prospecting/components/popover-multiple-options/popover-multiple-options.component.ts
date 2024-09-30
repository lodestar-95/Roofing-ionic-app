import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Generic } from 'src/app/models/generic.model';

@Component({
  selector: 'app-popover-multiple-options',
  templateUrl: './popover-multiple-options.component.html',
  styleUrls: ['./popover-multiple-options.component.scss'],
})
export class PopoverMultipleOptionsComponent implements OnInit {
  @Input() options: Generic[];

  constructor(private popoverController:PopoverController) { }

  ngOnInit() {
    console.log("OPTIONS:", this.options);
  }

  optionSelected(option: Generic) {
    console.log("option::", option);
    this.options.map((x) => {
      if (x.id === option.id) {
        x.selected = option.selected;
      } 
    });
    this.popoverController.dismiss(this.options);
  }

}
