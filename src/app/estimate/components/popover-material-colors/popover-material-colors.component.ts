import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-popover-material-colors',
  templateUrl: './popover-material-colors.component.html',
  styleUrls: ['./popover-material-colors.component.scss'],
})
export class PopoverMaterialColorsComponent implements OnInit {
  @Input() colors: any[];

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {}

  optionSelected(color) {
    this.popoverController.dismiss(color);
  }
}
