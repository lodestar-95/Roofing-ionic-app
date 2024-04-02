import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-popover-material-types',
  templateUrl: './popover-material-types.component.html',
  styleUrls: ['./popover-material-types.component.scss'],
})
export class PopoverMaterialTypesComponent implements OnInit {
  @Input() materialTypes: any[];
  @Input() categoryRidgecapId: number;

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {}

  optionSelected(option) {
    this.materialTypes.map((x) => {
      if (x.id === option.id) {
        x.selected = true;
      } else {
        x.selected = false;
      }
    });

    this.popoverController.dismiss(option);
  }
}
