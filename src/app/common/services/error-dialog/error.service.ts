import { Injectable } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { AppConfig } from 'src/app/config/app';

@Injectable({
  providedIn: 'root'
})
export class ErrorDialogService {

  code: any = '';

  constructor(
    private readonly alertCntrl: AlertController,
    private readonly navCtrl: NavController) { 
  }

  async showAlert(data, status?:string) {
    
    const title = data.TITLE == null || data.TITLE === '' ? '' : data.TITLE;
    const message =
      data.MESSAGE == null || data.MESSAGE === '' ? '' : data.MESSAGE;
    const buttons = [
      {
        text: AppConfig['BTN_ACCEPT'],
        handler: () => {
          this.doAction(status);
        },
      },
    ];
    if (data.buttonTwoText) {
      buttons.push({
        text: data.buttonTwoText,
        handler: () => {},
      });
    }
    const confirm = await this.alertCntrl.create({
      header: title,
      message,
      cssClass: 'alert-custom',
      buttons,
    });
    await confirm.present();
  }

  doAction(status?:string) {
    const opc = status || '';
    switch (opc) {
      case 'login':
        this.navCtrl.navigateRoot('/');
        break;
      default:
        break;
    }
  }
}
