import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, Platform, MenuController, AlertController, ToastController } from '@ionic/angular';
import { ErrorDialogService } from '../common/services/error-dialog/error.service';
import { AppConfig } from '../config/app';
import { AuthService } from './services/auth/auth.service';
import { Router } from '@angular/router';
import { NetworkValidateService } from '../shared/helpers/network-validate.service';
import { CatalogsService } from '../services/catalogs.service';
import { LoadingService } from '../shared/helpers/loading.service';
import { ProposalDescriptionsService } from '../services/proposal-descriptions.service';
import { MaterialService } from '../services/material.service';
import Pako from 'pako';
import { TouchID } from '@awesome-cordova-plugins/touch-id/ngx';
import { Storage } from '@ionic/storage';
//import { Device } from '@capacitor/device';
import { UniqueDeviceID } from '@ionic-native/unique-device-id/ngx/';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  username: string;
  password: string;
  code: string = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly platform: Platform,
    private readonly navCtrl: NavController,
    public networkService: NetworkValidateService,
    private errorDialogService: ErrorDialogService,
    private menu: MenuController,
    private router: Router,
    private catalogsService: CatalogsService,
    private loading: LoadingService,
    private descriptionService: ProposalDescriptionsService,
    private materialService: MaterialService,
    private touchId: TouchID,
    private storage: Storage,
    private alertCtr: AlertController,
    private toastController: ToastController,
    private netWork:Network,
    private evtSrv:EventService,
    private uniqueDeviceID: UniqueDeviceID
    // private loading:LoadingService
  ) {
    this.loginForm = this.formBuilder.group({
      username: [
        '',
        Validators.compose([
          Validators.required,
          Validators.pattern(
            /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
          ),
        ]),
      ],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(6)]),
      ],
    });

    this.evtSrv.subscribe('fetchUSerData',()=>{

      let userName=localStorage.getItem('lastUserName')
      let userPass=localStorage.getItem('lastUserPass')
      if(this.networkService.isConnected){
        this.getUserByDeviceId().then(()=>{
          this.user.setValue(this.userEmail)
        })
      }else{
        if(userName){
          this.user.setValue(userName)
        }
      }
    })


    this.evtSrv.subscribe('network:update', async (res) => {
      if (res === true || res === 'true') {
        await this.loading.loading(true);
        try {
          await this.getUserByDeviceId();
          this.user.setValue('');
          let email = String(this.userRes?.username);
          if(email !=undefined && email !='undefined' && email !=null){

            this.user.setValue(email);
          }
        } catch (error) {
          console.error('Error during network update:', error);
        } finally {
          await this.loading.loading(false);
        }
      }else if(res === false || res ==='false'){
        let userName=localStorage.getItem('lastUserName')
        if(userName){
          this.user.setValue(userName)
        }
      }
    });

  }


  ngOnDestroy(){
    this.evtSrv.destroy('network:update')
  }



  async validateNet(){
  await this.networkService.validateNetwork()
  }

 

  async ngOnInit() {
    setTimeout(()=>{
      let userName=localStorage.getItem('lastUserName')
      if(this.networkService.isConnected){
         
      }else{
        if(userName){
          this.user.setValue(userName)
        }
      }
     },1000)
    this.menu.enable(false);

    
  }

  login() {
    var that = this
    
    if (this.loginForm.valid) {
      this.username = this.loginForm.controls['username'].value;
      this.password = this.loginForm.controls['password'].value;


      this.loading.loading(true);
      if (this.networkService.isConnected) {
        this.authService.authenticate(this.username, this.password).subscribe(
          (response) => {
            response.then((result) => {
              let userLoggedIn=localStorage.getItem('lastUserName')
              let userLoggedInPass=localStorage.getItem('lastUserPass')
              if(userLoggedIn){
                
              }else{
                localStorage.setItem('lastUserName',that.loginForm.controls.username.value)
      
              }

              if(userLoggedInPass){

              }else{
                localStorage.setItem('lastUserPass', that.loginForm.controls.password.value)
              }


 
              this.storage.set('lastUserName', that.loginForm.controls.username.value);
              this.storage.set('lastUserPass', that.loginForm.controls.password.value);
              this.storage.set('device_id', that.deviceId);
              if (result && result.isSuccess) {
                // guardar storage
               
                this.navCtrl.navigateRoot('/home/prospecting');


                that.loginForm.reset();
              }
            });
          },
          (error: any) => {
            this.loading.loading(false);
            that.loginForm.reset()

            if (error.status === 400) {
              this.errorDialogService.showAlert(AppConfig['ERROR_LOGIN']);
            } else {
              this.errorDialogService.showAlert(AppConfig['ERROR_SERVER']);
            }
          },
          () => {
            this.loading.loading(false);
          }
        );
      } else {
        this.authService
          .findUser(this.username, this.password)
          .then((result) => {
            if (result) {
              let userLoggedIn=localStorage.getItem('lastUserName')
              let userLoggedInPass=localStorage.getItem('lastUserPass')
              if(userLoggedIn){
                
              }else{
                localStorage.setItem('lastUserName',that.loginForm.controls.username.value)
              
              }

              if(userLoggedInPass){

              }else{
                localStorage.setItem('lastUserPass', that.loginForm.controls.password.value)
              }
 
              this.storage.set('lastUserName', that.loginForm.controls.username.value);
              this.storage.set('lastUserPass', that.loginForm.controls.password.value);
              this.storage.set('device_id', that.deviceId);
              this.navCtrl.navigateRoot('/home/prospecting');
            }
          })
          .finally(() => {
            this.loading.loading(false);
          });
      }
    }
  }



  userRes: any
  showDeviceId: boolean = true
   userEmail:any
  async getUserByDeviceId() {
    // alert(JSON.stringify(this.deviceId))
    await this.authService.getUserWithDeviceId(this.deviceId).then((res: any) => {
      this.userRes = res?.data?.user
      this.userEmail=this.userRes?.username
     if(this.userEmail){
      localStorage.setItem('lastUserName',this.userEmail)
     }

      if (this.userRes) {
        this.showDeviceId = false
      } else {
        this.showDeviceId = true
      }



      // alert(JSON.stringify(res))
    }, err => {
      console.log(err)
      // alert(JSON.stringify(err))
    })
  }

  forgotPass() {
    this.router.navigate(['forget-password']);
  }

  clearField(name) {
    this.loginForm.get(name).setValue('');
  }

  changeNetwork(event) {
    this.networkService.isConnected = event.detail.checked;
  }

  get user() {
    return this.loginForm.get('username');
  }
  get pass() {
    return this.loginForm.get('password');
  }

  /**
   *
   * @author: Carlos Rodríguez
   */

  async ionViewWillEnter() {

    let tempDeviceId
    this.checkFingerPrintisAvailable();
    // this.savedUserName=localStorage.getItem('lastUserName')
    // this.savedUserpass=localStorage.getItem('lastUserPass')

    let userName=localStorage.getItem('lastUserName')
    let userPass=localStorage.getItem('lastUserPass')
    this.storage.get('lastUserName').then((res) => {
      this.savedUserName = res;
    });
    this.storage.get('lastUserPass').then((res) => {
      this.savedUserpass = res;
    });
    this.storage.get('device_id').then((res) => {
      tempDeviceId = res
    })
    await this.logDeviceInfo().then(async()=>{
      await this.getUserByDeviceId().then(()=>{
        if (tempDeviceId == this.deviceId) {

          console.log("this.deviceId", this.deviceId);
          
          this.user.setValue(this.userEmail)
          // this.pass.setValue(this.savedUserpass)
          // this.scanFinger();

          // this.router.navigate(['/home/prospecting']);
          // this.uniqueDeviceID.get()
          //    .then((uuid: any) =>{
          //      this.deviceId = uuid;
          //    })
          //   .catch((error: any) => console.log(error));
          this.loading.loading(false)
    
        } else {
          this.loading.loading(false)
          // alert('No user is registered with this device yet!')
        }
      });
    });


    
    if(this.networkService.isConnected){

     if(this.userEmail){
      this.user.setValue(this.userEmail)
     }
      
    }else{
      if(userName){
        this.user.setValue(userName)
      }
    }
   

  }


  ionViewDidLeave() {
    this.userRes=''
  }



  // async check() {
  //   if (this.userRes.username && this.userRes?.password) {
  //     this.user?.setValue(this.userRes?.username)
  //     this.pass?.setValue(this.userRes?.password)

  //     await this.login()
  //   }
  // }

  enableFingrPrint = false;
  async checkFingerPrintisAvailable() {
    const touchIdAvailable = await this.touchId.isAvailable();

    if (touchIdAvailable) {
      this.enableFingrPrint = true;
    }
  }



  showFingerPrint: any;

  savedUserName: any;
  savedUserpass: any;
  async scanFinger() {
   if(this.networkService.isConnected){
    if (this.userRes?.username != undefined) {
      try {
        const touchIdAvailable = await this.touchId.isAvailable();
        if (touchIdAvailable) {
          this.loading.loading(false)
          const fingerprintResult = await this.touchId.verifyFingerprint('Verify Your Touch ID').then(async (res) => {
              // alert(JSON.stringify(this.userRes))
              if (this.userRes.username) {
                this.user.setValue(this.userEmail)
                if (this.savedUserpass) {
                  this.pass.setValue(this.savedUserpass)
                } 

                await this.login()
              }
            
          


          });
        } else {
          console.error('Touch ID not available');
          this.loading.loading(false)

        }
      } catch (error) {

        console.error('Error while authenticating with fingerprint:', error);
      }
    } else {
      alert('Device id is not registered with db yet')
    }
   }else{
    let userName=localStorage.getItem('lastUserName')
    let userPass=localStorage.getItem('lastUserPass')
      try {
        const touchIdAvailable = await this.touchId.isAvailable();
        if (touchIdAvailable) {
          this.loading.loading(false)
          const fingerprintResult = await this.touchId.verifyFingerprint('Verify Your Touch ID').then(async (res) => {
           
             if(userName){
              this.user.setValue(userName)
             }

             if(userPass){
              this.pass.setValue(userPass)

             }
              this.login()
          });
        } else {
          console.error('Touch ID not available');
          this.loading.loading(false)

        }
      } catch (error) {
        console.error('Error while authenticating with fingerprint:', error);
      }
    
   }

  }
  deviceInfo: any
  deviceId: any = ''
async logDeviceInfo() {
    if (this.platform.is('hybrid')) {
      this.loading.loading(true);
      await this.uniqueDeviceID.get()
      .then((uuid: any) =>{
        this.deviceId = uuid;
      })
     .catch((error: any) => console.log(error));
    }
  }

  async showToast() {
    let toast = await this.toastController.create({
      message: 'Text coppied successfully',
      duration:3000,
      icon:'checkmark-outline'
    })
    await toast.present()
  }


  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast()

      // Optionally, display a success message to the user
    } catch (error) {
      console.error('Error copying text to clipboard:', error);
      // Optionally, display an error message to the user
    }
  }

}
