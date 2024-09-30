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
import { Device } from '@ionic-native/device/ngx';
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
    private device: Device,
    private netWork:Network,
    private evtSrv:EventService
    // private loading:LoadingService
  ) {
    device = new Device();
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
            this.getInitialcatalogs();

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
      console.log(res, 'UserFetched')
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

    

    console.log(this.networkService.isConnected, 'networkChange')
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
  getInitialcatalogs() {
    this.catalogsService.getInitialcatalogs();
    this.descriptionService.getProposalDescriptions();
    this.materialService.downloadMaterialData();

    console.log('PAKOOOOOOOO');

    const pixpString = '{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}{"users":[{"id_user":"5","id_contact":"2","username":"inspector@gmail.com","id_role":"3","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"5"},{"id_user":"1","id_contact":"2","username":"captain-america@avengers.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"1"},{"id_user":"2","id_contact":"2","username":"pmanager@ehroofing.com","id_role":"4","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"2"},{"id_user":"4","id_contact":"2","username":"admin@gmail.com","id_role":"1","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"4"},{"id_user":"15","id_contact":"2","username":"genesis@ehroofing.com","id_role":"2","contact":{"id_contact":"2","first_name":"Eren","last_name":"Jeager","id_contact_type":1},"id":"15"},{"id_user":"8","id_contact":"3","username":"andrescetec1@hotmail.com","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"8"},{"id_user":"7","id_contact":"3","username":"azopiyactle@onikom.com.mx","id_role":"1","contact":{"id_contact":"3","first_name":"Andres","last_name":"Zopi","id_contact_type":1},"id":"7"},{"id_user":"3","id_contact":"4","username":"jalvarez@onikom.com.mx","id_role":"1","contact":{"id_contact":"4","first_name":"Peter","last_name":"Parker","id_contact_type":1},"id":"3"},{"id_user":"10","id_contact":"5","username":"joahnSponsor1234@gmail.com","id_role":"1","contact":{"id_contact":"5","first_name":"Bruce","last_name":"Banner","id_contact_type":1},"id":"10"},{"id_user":"11","id_contact":"6","username":"alberto.zarate@gmail.com","id_role":"4","contact":{"id_contact":"6","first_name":"Miles","last_name":"Morales","id_contact_type":1},"id":"11"},{"id_user":"14","id_contact":"7","username":"john@ehroofing.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"14"},{"id_user":"9","id_contact":"7","username":"pedroinspector1234@gmail.com","id_role":"3","contact":{"id_contact":"7","first_name":"John","last_name":"Fidanza","id_contact_type":1},"id":"9"},{"id_user":"12","id_contact":"10","username":"edgar@ehroofing.com","id_role":"1","contact":{"id_contact":"10","first_name":"Edgar","last_name":"Sanchez","id_contact_type":1},"id":"12"},{"id_user":"13","id_contact":"11","username":"betty@ehroofing.com","id_role":"1","contact":{"id_contact":"11","first_name":"Beatriz","last_name":"Coronel","id_contact_type":1},"id":"13"},{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6"}],"syncDate_6":"2024-02-14T23:20:16.340Z","resource_6":[{"resource":"Prospecting","id_resource_parent":null,"id":1},{"resource":"Report Bug","id_resource_parent":null,"id":24}],"user":[{"id_user":"6","id_contact":"12","username":"jim@ehroofing.com","id_role":"3","role":{"id_role":"3","role":"Inspector"},"contact":{"id_contact":"12","first_name":"Jim","last_name":"McLeod","id_contact_type":1},"id":"6","last_access_date":"2024-02-14T23:14:30.314Z","password":"12345678"}]}';

    const deflator = new Pako.Deflate({
      level: 6,
      //to: 'string',
      gzip: true,
      header: {
        text: true,
        time: + new Date(),
        comment: ""
      }
    });

    deflator.push(pixpString, true);
    console.log(pixpString.length);

    // making a blob to be saved
    const value = deflator.result;
    console.log(value);
    console.log(value.length);
    console.log(value.byteLength);
    const inflatorString = new Pako.Inflate({ to: 'string' });
    inflatorString.push(value, true);
    console.log(inflatorString.result);

    /*
    const inflatorString = new Pako.Inflate({ to: 'string' });
    inflatorString.push("abc", true);
    console.log(inflatorString.result);
    const deflate = new Pako.Deflate({ level: 3, strategy: 2 });

    const deflator = new Pako.Deflate({
      gzip: true,
      header: {
          hcrc: true,
          time: 1234567,
          os: 15,
          name: "test name",
          comment: "test comment",
          extra: [4, 5, 6],
      },
    });
    //deflator.push('HOLA MUNDO', true);
    inflatorString.push(deflator.result, true);
    console.log(inflatorString.result);

    console.log(inflatorString.result);
    */
  }

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
          this.user.setValue(this.userEmail)
          // this.pass.setValue(this.savedUserpass)
          // await this.scanFinger();
          // this.login()
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
  //   // console.log(this.userRes, 'userRes')
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
      //const decviceID = await Device.getId();
      this.deviceId = this.device.uuid; //decviceID.identifier
      console.log('device decviceID', this.deviceId);
      // alert(JSON.stringify(this.deviceId))
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
      console.log('Text copied to clipboard:', text);
      this.showToast()

      // Optionally, display a success message to the user
    } catch (error) {
      console.error('Error copying text to clipboard:', error);
      // Optionally, display an error message to the user
    }
  }

}
