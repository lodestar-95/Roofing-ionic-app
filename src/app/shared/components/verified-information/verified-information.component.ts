import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-verified-information',
  templateUrl: './verified-information.component.html',
  styleUrls: ['./verified-information.component.scss'],
})
export class VerifiedInformationComponent implements OnInit {
  @Output() optionEmited = new EventEmitter();
  @Input() isVerified: boolean;
  @Input() showIconError: boolean;
  @Input() title: string = 'Verify information';

  constructor() { }

  ngOnInit() {}

  onVerifiedInformation(){
    //this.isVerified = !this.isVerified; // Alternar el estado
    this.optionEmited.emit(this.isVerified); // Emitir el nuevo estado
  }

}
