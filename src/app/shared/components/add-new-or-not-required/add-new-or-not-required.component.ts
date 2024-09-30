import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-add-new-or-not-required',
  templateUrl: './add-new-or-not-required.component.html',
  styleUrls: ['./add-new-or-not-required.component.scss'],
})
export class AddNewOrNotRequiredComponent implements OnInit {
  @Output() optionEmited = new EventEmitter();
  @Output() addEmited = new EventEmitter();
  @Input() isNoRequired: boolean;
  @Input() activeNoRequired: boolean;
  @Input() btnText: string;
  @Input() chkBText: string;

  constructor() { }

  ngOnInit() {}

  onNoRequired(){
    console.log("Envia desde aca");
    this.optionEmited.emit();
  }

  onAdd(){
    console.log("Envia desde aca");
    this.addEmited.emit();
  }

}
