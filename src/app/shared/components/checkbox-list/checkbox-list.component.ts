import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CheckboxList } from '../../interfaces/checkbox-list';

@Component({
  selector: 'app-checkbox-list',
  templateUrl: './checkbox-list.component.html',
  styleUrls: ['./checkbox-list.component.scss']
})

/**
 * @author Carlos Rodríguez
 */
export class CheckboxListComponent implements OnInit {
  @Output() optionEmited = new EventEmitter<CheckboxList>();
  @Input() options: CheckboxList[];
  @Input() title: string;
  @Input() subTitle: string;
  @Input() subTitleDesc: string;
  @Input() text: string;
  @Input() subText: string;
  @Input() small: boolean = false;
  @Input() isLeft: boolean = false;
  @Input() isValid: boolean = false;

  chkLists: CheckboxList[] = [];

  constructor() {}

  ngOnInit() {
    this.chkLists = [];
    this.options.forEach(option => {
      this.chkLists.push({ ...option });
    });
  }

  /**
   * Return opstion selected
   * @param option
   */
  optionSelcted(option: CheckboxList) {
    this.chkLists.map(x => {
      if (x.id === option.id) {
        x.isChecked = true;
      } else {
        x.isChecked = false;
      }
    });

    this.optionEmited.emit(option);
  }
}
