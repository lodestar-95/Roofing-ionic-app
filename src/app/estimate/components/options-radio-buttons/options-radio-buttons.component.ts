import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Building } from 'src/app/models/building.model';
import { RadioButtonList } from 'src/app/shared/interfaces/radio-button-list';

export interface OptionsRadio {
  title: string;
  options: RadioButtonList[];
  value: any;
  total: number;
}

@Component({
  selector: 'app-options-radio-buttons',
  templateUrl: './options-radio-buttons.component.html',
  styleUrls: ['./options-radio-buttons.component.scss'],
})
export class OptionsRadioButtonsComponent implements OnInit {
  @Input() element: OptionsRadio;
  @Input() building: Building;
  @Output() optionEmmited = new EventEmitter<any>();
  @Input() disabled = false;

  constructor() {}

  ngOnInit() {}

  onOptionChanged(item) {
    item.idBuilding = this.building.id;
    this.optionEmmited.emit(item);
  }
}
