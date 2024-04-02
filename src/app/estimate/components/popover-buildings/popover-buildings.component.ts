import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-popover-buildings',
  templateUrl: './popover-buildings.component.html',
  styleUrls: ['./popover-buildings.component.scss'],
})
export class PopoverBuildingsComponent implements OnInit {
  @Input() buildings: any[];

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {}

  optionSelected(option) {
    this.buildings.map((x) => {
      if (x.id === option.id) {
        x.selected = true;
      } else {
        x.selected = false;
      }
    });

    this.popoverController.dismiss(option);
  }
}
