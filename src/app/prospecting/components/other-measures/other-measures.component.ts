import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export interface OtherMeasuresList {
  description: string;
  value: (string | number);
  visible: boolean;
}

@Component({
  selector: 'app-other-measures',
  templateUrl: './other-measures.component.html',
  styleUrls: ['./other-measures.component.scss'],
})
export class OtherMeasuresComponent implements OnInit {
  @Output() modalEmited = new EventEmitter();
  @Input() otherMeasuresList: OtherMeasuresList[];
  @Input() description: string;
  @Input() active: boolean;
  @Input() showIconError: boolean;
  

  constructor() {}

  ngOnInit() {}

  buttonEventEmmited(){
    this.modalEmited.emit(null);
  }
}
