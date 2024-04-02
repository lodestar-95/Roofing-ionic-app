import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-button-option-simple',
  templateUrl: './button-option-simple.component.html',
  styleUrls: ['./button-option-simple.component.scss'],
})
export class ButtonOptionSimpleComponent implements OnInit {
  @Output() modalEmited = new EventEmitter();
  @Input() description: string;
  @Input() active: boolean;

  constructor() { }

  ngOnInit() {
  }

  openModal(event: any){
    this.modalEmited.emit(event);
  }

}
