import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { UsersService } from './common/services/storage/users.service';
import { NetworkValidateService } from './shared/helpers/network-validate.service';
import { default as general } from '../assets/json/configs-general.json';
import { General } from './models/general.model';
import { ConfigsGeneralService } from './services/configs-general.service';
import { AppConfig } from './config/app';
import { SideMenu } from './home/models/side-menu.model';
import { Store } from '@ngrx/store';
import { AppState } from './app.reducer';
import { LoadingService } from './shared/helpers/loading.service';
import { NavController, ToastController } from '@ionic/angular';
import { Version } from './models/version.model';
import { HashCodeService } from './shared/helpers/hash-code.service';
import { interval } from 'rxjs';
import { AuthService } from './login/services/auth/auth.service';
import { JwtValidateService } from './shared/helpers/jwt-validate.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  menuOptions: SideMenu[];
  project: any
  version: Version;

  constructor(
    private networkService: NetworkValidateService,
    private usersService: UsersService,
    private generalService: ConfigsGeneralService,
    public readonly http: HttpClient,
    private router: Router,
    private store: Store<AppState>,
    private loadingService: LoadingService,
    public toastController: ToastController,
    private nav: NavController,
    private hash: HashCodeService,
    private auth: AuthService,
    private jwtService: JwtValidateService,
  ) {
    this.getProject();
    this.networkService.validateNetwork();
    this.usersService.init();
    this.loadMenuOptions();
    this.isLoading();

    let configGeneral: General[] = JSON.parse(JSON.stringify(general.general));
    // this.generalService.loadConfigs(configGeneral);
    this.validateSessionToken();
  }

  validateSessionToken() {
   interval(60000).subscribe(async ()=>{
    const token = localStorage.getItem('token');

    if(!token) return;

    const isValid = this.jwtService.isDateValid(token);
    if (!isValid) {

      const toast = await this.toastController.create({
        message: 'Session expired',
        duration: 8000,
        color: 'dark',
        position: 'bottom',
      });

      await toast.present();
      this.auth.logout();
      return;
    }
    });
  }

  getProject() {
    this.store.select('projects').subscribe((state) => {
      this.project = state.project;
      if (!this.project) {
        return;
      }
      this.version = this.project.versions.find(x => x.active);
      if (!this.version) {
        return;
      }
    });
  }

  /**
   * Show or hide loading
   * @author Carlos Rodríguez
   */
  isLoading() {
    this.store.select('ui').subscribe(async (ui) => {
      if (ui.isLoading) {
        this.loadingService.show();
      } else {
        this.loadingService.hide();
      }
    });
  }

  loadMenuOptions() {
    this.menuOptions = AppConfig['MENU_OPTIONS'];
  }

  clickOption(menu) {
    this.menuOptions = this.menuOptions.map((item) => ({
      ...item,
      active: item.id === menu.id ? true : false,
    }));

    let verifiedRoof = false;
    let verifiedEstimate = false
    let version = this.project.versions.find((x) => x.active);
    this.project.versions.forEach(projectVersion => {
      if (version.id && projectVersion.id == version.id) {
        verifiedRoof = (version.is_Verified != undefined && version.is_Verified) ? true : false;
        if ((version.shingle_lines != undefined && version.shingle_lines.length >= 1) && (version.pv_colors != undefined && version.pv_colors.length == 3)) {
          verifiedEstimate = true;
        }
      }
    });

    let menuOptionsAux = JSON.parse(JSON.stringify(this.menuOptions));
    let opt = menuOptionsAux.find(mo => mo.active).name;

    if (opt == 'Estimates' && !verifiedRoof) {
      if (this.version.is_verified) {
        this.nav.navigateForward(`/home/estimate`);
      }
      else {
        this.presentToast();
      }

      return;
    }
    if (opt == 'Generate proposals' && !verifiedEstimate) {
      if (this.version.is_verified && this.proposalDoesntHaveChanges()) {
        this.nav.navigateForward('home/scope-of-work');
      }
      else {
        this.presentToast();
      }

      return;
    }


    if (opt == 'Proposal Preview' && !verifiedEstimate) {
      if (this.version.is_verified && this.proposalDoesntHaveChanges()) {

    //this.project = this.activatedRoute.snapshot.queryParams.project;
        this.nav.navigateForward('/pdf-viewer-page', {
          queryParams: { project: this.project }
        });
      }
      else {
        this.presentToast();
      }

      return;
    }

    const url = menu.url + (menu.id == 1 ? parseInt(localStorage.getItem('idProject')) : '');
    this.router.navigate([url]);
  }

  proposalDoesntHaveChanges() {
    const versionWithoutScope = this.getVersionWithoutScope(this.version);
    const versionText = JSON.stringify(versionWithoutScope);
    const hash = this.hash.getHashCode(versionText);

    const previousCode = localStorage.getItem('versionCode');
    return hash.toString() === previousCode;
  }

  getVersionWithoutScope(version: Version) {
    const buildings = version.buildings.map(x => {
      return { ...x, pb_scopes: [] };
    });

    return { ...version, buildings };
  }

  selectMenuOption() {
    this.menuOptions = this.menuOptions.map((item) => ({
      ...item,
      active: this.router.url.includes(item.url),
    }));
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Not available at the moment, try again later.',
      duration: 2000,
      color: 'dark',
      position: 'bottom'
    });
    toast.present();
  }
}
