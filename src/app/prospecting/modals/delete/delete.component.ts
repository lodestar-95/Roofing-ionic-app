import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
})
export class DeleteComponent implements OnInit {

  option:number;
  @Input() message: string;

  constructor(private readonly modalCtrl: ModalController) { }

  ngOnInit() {}

  onClick(option:number){
    this.option = option;

  }

  accept(){
    this.modalCtrl.dismiss({
      'delete': this.option == 1
    });
  }

}
