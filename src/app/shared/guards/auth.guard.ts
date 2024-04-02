import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NetworkValidateService } from 'src/app/shared/helpers/network-validate.service';
import { AuthService } from '../../login/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
/**
 * Check that the user is auth
 * @author: Carlos Rodríguez
 */
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private networkService: NetworkValidateService
  ) {}

  canActivate(): boolean {
    let isAuthenticated: boolean = true;
    if (this.networkService.isConnected)
      isAuthenticated = this.auth.isAuthenticated();
    if (isAuthenticated) {
      return true;
    } else {
      this.auth.logout();
      return false;
    }
  }
}
