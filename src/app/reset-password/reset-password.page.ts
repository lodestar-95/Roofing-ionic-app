import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  LoadingController,
  NavController,
  ToastController,
} from '@ionic/angular';

import { JwtValidateService } from '../shared/helpers/jwt-validate.service';
import { MessageResetPasswordService } from './services/message-reset-password.service';
import { AuthService } from '../login/services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
/**
 * @author: Carlos Rodríguez
 */
export class ResetPasswordPage implements OnInit {
  token: string;
  payload: any;
  isLoading = true;
  password1: string;
  password2: string;
  sliderOpts: any;

  constructor(
    private route: ActivatedRoute,
    private jwtService: JwtValidateService,
    private loadingCtrl: LoadingController,
    private message: MessageResetPasswordService,
    private nav: NavController,
    private toastController: ToastController,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    await this.showLoading();

    this.token = this.route.snapshot.paramMap.get('token');
    this.payload = this.jwtService.getPayload(this.token);

    let isTokenDateValid = this.jwtService.isDateValid(this.token);
    if (isTokenDateValid) {
    } else {
      this.message.title = 'Reset your password';
      this.message.subTitle = 'The link to reset your password has expired.';
      this.message.icon = '=(';
      this.nav.navigateRoot('/reset-password/show/message');
    }

    await this.hideLoading();
  }

  /**
   * Shows the load inside the screen.
   * @returns
   */
  async showLoading() {
    if (this.isLoading) {
      this.isLoading = false;
      return await this.loadingCtrl
        .create({
          message: 'Espera por favor...',
        })
        .then((a) => {
          a.present().then(() => {
            if (this.isLoading) {
              a.dismiss().then(() => {});
            }
          });
        });
    }
  }

  /**
   * Hides the load inside the screen.
   * @returns
   */
  async hideLoading() {
    if (!this.isLoading) {
      this.isLoading = true;
      return await this.loadingCtrl.dismiss().then(() => {});
    }
  }

  /**
   * Change the user passwords.
   * @param form
   * @returns
   */
  changePassword(form: NgForm) {
    if (form.invalid) {
      return;
    }

    if (this.password1 === this.password2) {
      this.auth.changePassword(this.password1, this.token).subscribe(
        (result: any) => {
          if (result.isSuccess) {
            this.message.title = 'Password updated';
            this.message.subTitle =
              'Yor password has been updated succesfully.';
            this.message.icon = 'success';
            this.nav.navigateRoot('/reset-password/show/message');
          }
        },
        () => {
          this.message.title = 'Reset your password';
          this.message.subTitle =
            'The link to reset your password has expired.';
          this.message.icon = 'failed';
          this.nav.navigateRoot('/reset-password/show/message');
        }
      );
    } else {
      this.presentToast('Password does not match');
    }
  }

  /**
   * Present message inside the screen.
   * @param message
   */
  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      animated: true,
      color: 'dark',
    });
    toast.present();
  }
}
