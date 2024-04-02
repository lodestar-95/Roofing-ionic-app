import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-calendar-modals',
  templateUrl: './calendar-modals.component.html',
  styleUrls: ['./calendar-modals.component.scss'],
})
export class CalendarModalsComponent implements OnInit {
  @Output() mdlResponse = new EventEmitter<any>();
  @Input() isDatePopUpOpen: boolean;
  @Input() minDateString: string;
  @Input() titleDateElement: string;
  @Input() date: Date;
  wasSelectedDate:boolean = false;

  constructor() {
  }
  ngOnInit() {
    let minDate = new Date();
    if (this.minDateString) {
        minDate = new Date(this.minDateString);
    }
    this.minDateString = minDate.toISOString();
  }

  setDate(event: any) {
    this.date = event.detail.value;
    this.wasSelectedDate = true;
  }

  closeMdlDate(){
    this.wasSelectedDate = false;
    this.confirmDateSelected();
  }

  confirmDateSelected() {
    this.isDatePopUpOpen = false;
    const payload = {
      isDatePopUpOpen: this.isDatePopUpOpen,
      dateSelected: this.date,
      wasSelectedDate: this.wasSelectedDate,
    };
    this.mdlResponse.emit(payload);
  }
}


