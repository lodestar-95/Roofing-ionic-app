import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { NavController } from '@ionic/angular';

import { environment } from '../../../../environments/environment';
import { AuthModel } from '../../models/auth.model';
import { UsersService } from 'src/app/common/services/storage/users.service';
import { ErrorDialogService } from 'src/app/common/services/error-dialog/error.service';
import { AppConfig } from 'src/app/config/app';
import { JwtValidateService } from '../../../shared/helpers/jwt-validate.service';
import { AuthRepository } from '../../db/auth.repository';
import { User } from 'src/app/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url = environment.url;
  token: string;
  repository: AuthRepository;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(
    public readonly http: HttpClient,
    private nav: NavController,
    private usersService: UsersService,
    private errorDialogService: ErrorDialogService,
    private jwtService: JwtValidateService,
    private storage: Storage
  ) {
    this.repository = new AuthRepository(this.storage, `auth`);
  }

  /**
   * Authenticate the user
   */
  authenticate(username: string, password: string) {
    const body = {
      username,
      password,
    };

    return this.http
      .post<AuthModel>(
        `${this.url}/auth/login`,
        JSON.stringify(body),
        this.httpOptions
      )
      .pipe(
        map(async (result) => {
          this.repository.create(result.data.user);
          this.usersService.addUserTokens(
            result.data.token,
            result.data.refreshToken
          );
          await this.usersService
            .getUser(username, password)
            .then(async (user) => {
              if (user) {
                await this.usersService.updateUser(username, password);
              } else {
                await this.usersService
                  .getUserByRole(username, result.data.user.role.id_role)
                  .then(async (user) => {
                    if (user) {
                      await this.usersService.updateUser(
                        username,
                        password,
                        result.data.user.role.id_role
                      );
                    } else {
                      await this.usersService.addUser(result, password);
                    }
                  });
              }
            });
          return result;
        })
      );
  }

  /**
   * Reset password the user
   */
  resetPassword(email: string) {
    const body = {
      email,
    };
    return this.http
      .post<AuthModel>(`${this.url}/auth/recoveryPassword`, body)
      .pipe(
        map((result) => {
          return result;
        })
      );
  }

  /**
   * Find user in storage by credentials
   */
  findUser(username: string, password: string) {
    return this.usersService.getUser(username, password).then(async (user) => {
      if (user) {
        var datef = new Date();
        var datei = user.last_access_date;
        var msDif = datef.getTime() - datei.getTime();
        var diasDif = msDif / (1000 * 60 * 60 * 24); //segundos*min*horas*dias - 1000 * 60 * 60 * 24
        const days: number = 30;
        if (diasDif > days) {
          let re = /\#/gi;
          AppConfig['ERROR_LONG_TIME_LOGIN']['MESSAGE'] = AppConfig[
            'ERROR_LONG_TIME_LOGIN'
          ]['MESSAGE'].replace(re, '' + days);
          this.errorDialogService.showAlert(AppConfig['ERROR_LONG_TIME_LOGIN']);
          return false;
        } else {
          await this.repository.create(user);
          return true;
        }
      } else {
        this.errorDialogService.showAlert(AppConfig['ERROR_LOGIN']);
        return false;
      }
    });
  }

  /**
   * Get authentication token.
   * @returns Auth token as string
   */
  getToken() {
    if (localStorage.getItem('token')) {
      this.token = localStorage.getItem('token');
    } else {
      this.token = '';
    }

    return this.token;
  }

  /**
   * validate that the expiration date is valid; otherwise refresh the token
   * @param jwt
   * @returns
   * @author: Carlos Rodríguez
   */
  tokenValidate(jwt: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let isTokenDateValid = this.jwtService.isDateValid(jwt);

      if (isTokenDateValid) {
        let refreshToken = localStorage.getItem('refreshToken');
        const body = {
          refreshToken,
        };

        this.http.post(`${this.url}/auth/refreshToken`, body).subscribe(
          (result: any) => {
            localStorage.setItem('token', result.token);
            localStorage.setItem('refreshToken', result.refreshToken);
            resolve(true);
          },
          () => {
            resolve(null);
          }
        );
      } else {
        resolve(false);
      }
    });
  }

  /**
   * Remove unwanted storage and redirect to login.
   */
  logout() {
    localStorage.clear();
    this.storage.remove('auth');
    this.nav.navigateRoot('/');
  }

  /**
   * Change system password.
   * @param password
   * @returns
   */
  changePassword(password: string, token: string) {
    const body = {
      password,
      token,
    };

    return this.http.post(`${this.url}/auth/changePassword`, body);
  }

  /**
   *
   * @returns
   * @author: Carlos Rodríguez
   */
  isAuthenticated() {
    if (!localStorage.getItem('token')) {
      return false;
    }

    return this.jwtService.isDateValid(localStorage.getItem('token'));
  }

  /**
   *
   * @returns
   * @author: Carlos Rodríguez
   */
  getAuthUser(): Promise<User> {
    return new Promise((resolve, reject) => {
      this.repository.findAll().then((result) => {
        if (result?.data?.length > 0) {
          resolve(result.data[0]);
        } else {
          resolve(null);
        }
      });
    });
  }
}
