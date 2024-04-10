import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { AppState } from 'src/app/app.reducer';
import { Project } from 'src/app/models/project.model';
import { RejectReason } from 'src/app/models/reject-reason.model';
import { selectProject } from 'src/app/prospecting/state/propsecting.selectors';
import { ProjectsService } from 'src/app/services/projects.service';
import { RejectReasonsService } from 'src/app/services/reject-reasons.service';
import * as rejectReasonActions from '../../../state/reject-reason/reject-reason.actions';

@Component({
  selector: 'app-modal-reject-proposal',
  templateUrl: './modal-reject-proposal.component.html',
  styleUrls: ['./modal-reject-proposal.component.scss'],
})
export class ModalRejectProposalComponent implements OnInit {
  private id_project_status:number = 5;

  form: FormGroup;
  rejectReasons: RejectReason[]
  private idCustom: number = 5;
  constructor(
    private formBuilder: FormBuilder,
    private rejectReasonService: RejectReasonsService,
    private store: Store<AppState>,
    private projectService: ProjectsService,
    public modalCtrl: ModalController,
    public toastController: ToastController
  ) {
    this.form = this.formBuilder.group({
      reasons: new FormArray([]),
      reason: new FormControl({ value: "", disabled: true })
    });
  }

  async ngOnInit() {
    try {
      this.rejectReasons = await (await this.rejectReasonService.getMockRejectReason()).data
      this.store.dispatch(rejectReasonActions.setRejectReasons({ rejectReasons: this.rejectReasons }))
      this.addCheckboxes();
    } catch (error) {
      alert("error")
    }
  }
  get reasonsFormArray() {
    return this.form.controls.reasons as FormArray;
  }
  private addCheckboxes() {
    this.rejectReasons.forEach(() => this.reasonsFormArray.push(new FormControl(false)));
  }
  /**
   * Save reject Proposal
   */
  async saveRejectProposal() {
    const selectedReason: RejectReason = this.form.value.reasons
      .map((checked, i) => checked ? this.rejectReasons[i] : null)
      .find(v => v !== null);
    const project = { ...await this.store.pipe(select(selectProject), first()).toPromise() };
    project.id_reject_reason = selectedReason.id;
    project.id_project_status = this.id_project_status
    project.project_status = {id : 5, project_status : "rejected"};

    if (selectedReason.id === this.idCustom + 1) project.reject_reason = this.form.controls.reason.value
    else project.reject_reason = ""

    project.isModified = true;
    this.projectService.update(project.id, project)
    await this.presentToastOk()
    this.modalCtrl.dismiss({
        redirect: true,
        saveDb:true
    });
  }
  /**
   *
   * @param index
   */
  onIsReasonChecked(index: number) {
    if (index === this.idCustom) {
      this.form.controls.reason.enable()
    } else {
      this.form.controls.reason.disable()
    }
    for (let i = 0; i < this.reasonsFormArray.length; i++) {
      if (i === index) continue;
      this.reasonsFormArray.controls[i].setValue(false)
    }
  }
  /**
   *
   * @returns
   */
  oneReasonSelect(): boolean {
    return !this.form.value.reasons
      .map((checked, i) => checked ? this.rejectReasons[i].id : null)
      .find(v => v !== null);
  }
  /**
   * Show toast All OK
   */
  async presentToastOk() {
    const toast = await this.toastController.create({
      message: 'Data has been saved.',
      duration: 2000
    });
    toast.present();
  }
}
