import { ApplicationRef, Injectable } from '@angular/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { EventService } from 'src/app/services/event.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkValidateService {
  _isConnected: boolean =true;
  connectSubscription: any;
  disconnectSubscription: any;

  constructor(
    private network: Network,
    private applicationRef: ApplicationRef,
    private evtSrv:EventService
  ) { }

  set isConnected(isConnected: boolean) {
    this._isConnected = isConnected;
  }
  get isConnected() {
    return this._isConnected;
  }

  validateNetwork() {
    //if (this.platform.is('hybrid')) {
      // watch network for a disconnection
      this.disconnectSubscription = this.network.onDisconnect().subscribe(() => {
        this.isConnected = false;

        this.evtSrv.publish('network:update',this.isConnected)

        this.applicationRef.tick();
      });

      // watch network for a connection
      this.connectSubscription = this.network.onConnect().subscribe(() => {
        this.isConnected = true;

        this.evtSrv.publish('network:update',this.isConnected)
        this.applicationRef.tick();
        // We just got a connection but we need to wait briefly
        // before we determine the connection type. Might need to wait.
        // prior to doing any api requests as well.
        setTimeout(() => {
          if (this.network.type === 'wifi') {
        this.evtSrv.publish('network:update',this.isConnected)

          }
        }, 3000);
      });
    //}
  }

  ngOnDestroy(): void {
    this.onDestroy();
  }

  ionViewWillLeave() {
    this.onDestroy();
  }

  onDestroy() {

  }

  
}
