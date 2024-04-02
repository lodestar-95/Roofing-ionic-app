import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PsbUpgrade } from 'src/app/models/psb_upgrades.model';
import { RadioButtonList } from 'src/app/shared/interfaces/radio-button-list';

export interface UpgradesRadio {
  title?: string;
  subTitle?: string;
  options?: RadioButtonList[];
  psbUpgrade?: PsbUpgrade;
  disabled?: boolean;
}

@Component({
  selector: 'app-upgrades-radio-buttons',
  templateUrl: './upgrades-radio-buttons.component.html',
  styleUrls: ['./upgrades-radio-buttons.component.scss'],
})
export class UpgradesRadioButtonsComponent implements OnInit {
  @Input() element: UpgradesRadio | undefined;
  @Output() optionEmmited = new EventEmitter<any>();
  @Input() disabled = false;

  constructor() {}

  ngOnInit() {}

  onSelected(item, element) {
    this.optionEmmited.emit({ item, element });
  }
}
