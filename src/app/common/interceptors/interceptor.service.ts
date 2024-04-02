import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../login/services/auth/auth.service';
import { ToastController } from '@ionic/angular';
import { NetworkValidateService } from 'src/app/shared/helpers/network-validate.service';

@Injectable({
  providedIn: 'root',
})
/**
 * @author: Carlos Rodríguez
 */
export class InterceptorService implements HttpInterceptor {
  constructor(private auth: AuthService,
    private toastCtrl: ToastController,
    private networkService: NetworkValidateService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    if (
      !req.url.endsWith('/refreshToken') &&
      !req.url.endsWith('/recoveryPassword') &&
      !req.url.endsWith('/changePassword') && 
      this.networkService.isConnected
    ) {
      this.auth.tokenValidate(token).then(async (result) => {
        console.warn('is token valid?', result);
        if (result == false) {

          const toast = await this.toastCtrl.create({
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

    const headers = new HttpHeaders({
      'x-token': token,
    });

    req = req.clone({
      headers,
    });

    req = req.clone({ headers: req.headers.set('Accept', '*/*') }); //application/json
    req = req.clone({
      headers: req.headers.set(
        'Access-Control-Allow-Headers',
        'Authorization, Expires, Pragma, DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range'
      ),
    });

    return next.handle(req).pipe(catchError(this.showError));
  }

  showError(error: HttpErrorResponse) {
    // console.log('Error Interceptor', error);
    return throwError(error);
  }
}
