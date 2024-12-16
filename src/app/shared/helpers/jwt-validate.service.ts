import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
/**
 * JWT validations
 * @author: Carlos Rodríguez
 */
export class JwtValidateService {
  constructor() {}

  /**
   * Validate expiration date
   * @param jwt
   * @returns
   */
  isDateValid(jwt: string) {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const payload: any = jwtHelper.decodeToken(jwt);

    const now: number = Number(moment.utc().format('X'));
    const exp: number = Number(moment.utc(payload.exp, 'X').format('X'));

    // let m1 = moment(now).toDate();
    // let m2 = moment(exp).toDate();

    return !(now >= exp);
  }

  /**
   * Get token payload
   * @param jwt
   */
  getPayload(jwt: string) {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const payload: any = jwtHelper.decodeToken(jwt);
    return payload;
  }
}
