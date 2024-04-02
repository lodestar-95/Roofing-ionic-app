import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-button-option',
  templateUrl: './button-option.component.html',
  styleUrls: ['./button-option.component.scss'],
})
export class ButtonOptionComponent implements OnInit {
  @Output() modalEmited = new EventEmitter();
  @Input() description: string;
  @Input() active: boolean;
  @Input() showIconError: boolean;

  constructor() { }

  ngOnInit() {}

  openModal(){
    this.modalEmited.emit(null);
  }

}
