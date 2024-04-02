import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { Version } from 'src/app/models/version.model';

@Component({
  selector: 'app-popover-prospecting-version',
  templateUrl: './popover-prospecting-version.component.html',
  styleUrls: ['./popover-prospecting-version.component.scss'],
})
export class PopoverProspectingVersionComponent implements OnInit {
  @Input() versions: Version[];
  @Input() salesManId:number;
  currentVersionId: number;
  currentUserRoleId: number;
  currentUserId: number;

  constructor(private popoverController: PopoverController,
    private auth: AuthService) { }

  ngOnInit() {
    this.initData();
  }

  initData() {
    if (!this.versions) {
      return;
    }
    this.currentVersionId = this.versions.find(v => v.active)?.id ?? 0;

    this.auth.getAuthUser().then((user) => {
      this.currentUserRoleId = parseInt(user.role.id_role);
      this.currentUserId = user.id;
    });
  }

  /**
   * Dissmiss modal and return version selected
   * @param version 
   * @author: Carlos Rodríguez
   */
  selectVersion(version: Version) {
    this.popoverController.dismiss(version);
  }

  createVersion() {
    this.popoverController.dismiss({ createNew: true });
  }
}
