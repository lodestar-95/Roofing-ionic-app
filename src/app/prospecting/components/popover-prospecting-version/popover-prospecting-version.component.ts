import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { AuthService } from 'src/app/login/services/auth/auth.service';
import { Version } from 'src/app/models/version.model';
import { AlertController } from '@ionic/angular';
import { Project } from 'src/app/models/project.model';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/app.reducer';

import { RejectReasonsService } from 'src/app/services/reject-reasons.service';
import { RejectReason } from 'src/app/models/reject-reason.model';

@Component({
  selector: 'app-popover-prospecting-version',
  templateUrl: './popover-prospecting-version.component.html',
  styleUrls: ['./popover-prospecting-version.component.scss'],
})
export class PopoverProspectingVersionComponent implements OnInit {
  @Input() versions: Version[];
  @Input() salesManId: number;
  currentVersionId: number;
  currentUserRoleId: number;
  currentUserId: number;
  project: Project;
  rejectReasons: RejectReason[]

  constructor(
    private popoverController: PopoverController,
    private alertController: AlertController,
    private store: Store<AppState>,
    private rejectReasonService: RejectReasonsService,
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

  async createVersion() {

    this.store.select('projects').subscribe(state => {
      this.project = state.project;

    });
    this.rejectReasons = await (await this.rejectReasonService.getMockRejectReason()).data

    let reject_message;

    if (this.project.id_reject_reason !== null)
      if (this.rejectReasons[this.project.id_reject_reason - 1].id === 6) {
        reject_message = "This proposal was marked as " + this.project.reject_reason;
      }
      else
        reject_message = "This proposal was marked as " + this.rejectReasons[this.project.id_reject_reason - 1].reason;
    else {
      reject_message = "Previous proposal was declined without a specified reason";
    }

    if (this.project.id_project_status === 5) {
      const alert = await this.alertController.create({
        header: 'Are you sure you want create a new proposal option?',
        message: reject_message,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
            }
          }, {
            text: 'Accept',
            handler: () => {
              this.popoverController.dismiss({ createNew: true });
            }
          }
        ]
      });
      await alert.present()
    }
    else
      this.popoverController.dismiss({ createNew: true });
  }

}
