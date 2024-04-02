import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';
import * as uiActions from '../ui.action';

@Injectable({
  providedIn: 'root',
})

/**
 * @author Carlos Rodríguez
 */
export class LoadingService {
  private isLoading = true;

  constructor(
    private loadingCtrl: LoadingController,
    private store: Store<AppState>
  ) {}

  loading(val: boolean = true) {
    if (val) {
      this.store.dispatch(uiActions.isLoading());
    } else {
      this.store.dispatch(uiActions.stopLoading());
    }

    return val;
  }

  async show() {
    if (!this.isLoading) {
      this.isLoading = true;
      return await this.loadingCtrl
        .create({
          message: 'Please wait...',
        })
        .then((a) => {
          a.present().then(() => {
            if (!this.isLoading) {
              a.dismiss().then(() => {});
            }
          });
        });
    }
  }

  async hide() {
    try {
        this.isLoading = false;
        return await this.loadingCtrl.dismiss().then(() => {});
    } catch {

    }
  }
}
