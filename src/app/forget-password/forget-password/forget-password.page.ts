import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ErrorDialogService } from 'src/app/common/services/error-dialog/error.service';
import { AppConfig } from 'src/app/config/app';
import { Location } from '@angular/common';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { UsersService } from 'src/app/common/services/storage/users.service';
import { NetworkValidateService } from 'src/app/shared/helpers/network-validate.service';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.page.html',
  styleUrls: ['./forget-password.page.scss'],
})
export class ForgetPasswordPage implements OnInit {

  resetForm: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private errorDialogService: ErrorDialogService,
    private readonly location: Location,
    private readonly authService: AuthService,
    //private usersService: UsersService,
    private networkService:NetworkValidateService) {
    this.resetForm = this.formBuilder.group({
      email: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(
            /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
          ),
        ]),
      ]
    });
   }

  ngOnInit() {
  }

  confirmForgetPass() {
    if (this.resetForm.valid) {
      const email = this.resetForm.controls['email'].value;
      if(this.networkService.isConnected) {

      this.authService.resetPassword(email).subscribe(
        (response) => {
          this.errorDialogService.showAlert(AppConfig['FORGET_PASSWORD'], 'login');
        },
        (error: any) => {
          this.errorDialogService.showAlert(AppConfig['ERROR_SERVER']);
        });
      }else{
        this.errorDialogService.showAlert(AppConfig['ERROR_SERVER']);
      }
    }
  }

  cancel(){
    this.location.back();
  }

}
