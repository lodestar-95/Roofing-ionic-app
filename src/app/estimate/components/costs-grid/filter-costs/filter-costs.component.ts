import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-costs',
  templateUrl: './filter-costs.component.html',
  styleUrls: ['./filter-costs.component.scss'],
})
export class FilterCostsComponent implements OnInit {
  @Output() onOrderEmmited = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  onOptionChanged(item) {
    this.onOrderEmmited.emit(item);
  }
}
