import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-popover-group-colors',
  templateUrl: './popover-group-colors.component.html',
  styleUrls: ['./popover-group-colors.component.scss'],
})
export class PopoverGroupColorsComponent implements OnInit {
  @Input() colors: any[];

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {
  }

  optionSelected(option) {
    this.colors.map((x) => {
      if (x.id === option.id) {
        x.selected = true;
      } else {
        x.selected = false;
      }
    });

    this.popoverController.dismiss(option);
  }
}
