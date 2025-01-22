import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { LoadingController, ModalController, ToastController, AlertController } from '@ionic/angular';
import { select, Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import { AppState } from 'src/app/app.reducer';
import { Project } from 'src/app/models/project.model';
import { selectProject } from 'src/app/prospecting/state/propsecting.selectors';
import { DropboxApiService } from 'src/app/services/dropbox-api.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { CostsColorsComponent } from 'src/app/estimate/components/costs-colors/costs-colors.component';
import { GroupColor } from 'src/app/models/group-color.model';
import { Group } from 'src/app/models/group.model';
import { PvColor } from 'src/app/models/pv_color.model';
import { Version } from 'src/app/models/version.model'
import { Observable, Subscription } from 'rxjs';
import { PopoverController } from '@ionic/angular';
import { PopoverGroupColorsComponent } from '../../../estimate/components/popover-group-colors/popover-group-colors.component';
import { RolesPermissionsService } from '../../helpers/roles-permissions.service';
import { v4 as uuidv4 } from 'uuid';
import { CatalogsService } from 'src/app/services/catalogs.service';

@Component({
  selector: 'app-modal-acceptance',
  templateUrl: './modal-acceptance.component.html',
  styleUrls: ['./modal-acceptance.component.scss']
})
export class ModalAcceptanceComponent implements OnInit {
  @Input() isSigned: boolean;

  private id_project_status: number = 4;
  private id_project_status_online: number = 0;
  project$: Observable<Project>;

  stepsCompleted: boolean = false;
  lastDate: string;
  startDate: string;
  minDateString: string;
  dateType:string = '';

  groups: Group[];
  groupColors: GroupColor[];

  storeSubs: Subscription;
  canModifyProposal = true;
  userDisabledPermision = false;
  project: Project;
  version: Version;

  files: File[] = [];
  @ViewChild('fileinput', { static: false }) fileInput: ElementRef;

  mdlDateTitle:string = '';
  isMdlDateOpen:boolean = false;

  public workPriority = [
    { val: 'Low', isChecked: true, id: 0 },
    { val: 'Medium', isChecked: false, id: 1 },
    { val: 'High', isChecked: false, id: 2 }
  ];
  constructor(
    private store: Store<AppState>,
    private dropboxApiService: DropboxApiService,
    private loadingCtrl: LoadingController,
    private projectService: ProjectsService,
    public modalCtrl: ModalController,
    private toastController: ToastController,
    private popoverCtrl: PopoverController,
    private rolesPermissionsService: RolesPermissionsService,
    private catalogs: CatalogsService,
    private alertController: AlertController
  ) {

  }

  async ngOnInit() {
    this.project$ = this.store.pipe(select(selectProject));
    this.project$.subscribe((proyect) => {
        this.project = { ...proyect };
        this.startDate = this.project.start_date;
        this.lastDate = this.project.end_date;
        const currentVersion =  this.project.versions.find(version => version.is_current_version === true);
        this.version =  {...currentVersion};
        this.loadGroups();
    });
  }

  /**
   * The function loads group colors and groups, and assigns group colors to groups if they exist.
   */
  loadGroups() {
    this.catalogs.getGroupColors().then(result => (this.groupColors = result.data));
    this.catalogs.getGroups().then((result: any) => {
      this.groups = result.data;
      if (this.version?.pv_colors) {
        this.groups = this.groups.map(element => {
            const pvColor = this.version.pv_colors.find(x => x.id_group == element.id);
            // If pvColor exists, it searches for the corresponding groupColor; otherwise, it remains undefined.
            const groupColor = pvColor ? this.groupColors.find(x => x.id == pvColor.id_group_color) : undefined;
            // Only adds groupColor to the object if it exists, otherwise returns the original element.
            return groupColor ? { ...element, groupColor } : element;
          });
      }
    });
  }
  loadImageFromDevice($event) {
    const fileSelected = $event.target.files;
    this.files = [...this.files, ...fileSelected];
    if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
  }

  async uploadImageFile(file:any){
    let response = await this.dropboxApiService.uploadFile(
        this.buildName(this.project),
        this.buildAddress(this.project),
        file
      );
  }

  /**
   *
   * @param index
   */
  onIsPriorityChecked(index: number) {
    for (let i = 0; i < this.workPriority.length; i++) {
      if (i === index) continue;
      this.workPriority[i].isChecked = false;
    }
  }

  /*
   * remove an item in list files and input type file
   * @param index number
   */
  removeFile(index: number) {
    this.files = this.files.filter((item, i) => {
      return i != index;
    });
    var dt = new DataTransfer();
    this.files.map(item => dt.items.add(item));
    //this.inputFiles.nativeElement.files = dt.files;
  }

  /**
   *
   */
  isFormCompleted(){
    let groupColorValid = false;
    if(this.groups){
        const countWithGroupColor = this.groups.filter(item => item.hasOwnProperty('groupColor')).length;
        groupColorValid = this.groups.length==countWithGroupColor?true:false;
    }

    if(this.lastDate && this.startDate && this.files.length>0 && groupColorValid){
        this.stepsCompleted = true;
    }
    return !this.stepsCompleted;
  }

  async confirmContinue() {
    const alert = await this.alertController.create({
      header: 'Do you wish to continue with the Acceptance?',
      message: 'If you continue with the acceptance, the proposal can no longer be modified.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Continue',
          handler: () => {
            this.saveAcceptance();
          }
        }
      ]
    });

    await alert.present();
  }


  async saveAcceptance() {
    const loading = await this.loadingCtrl.create({
      message: 'Uploading the data...',
      spinner: 'circles'
    });

    loading.present();
    const selectedPriority = this.workPriority.find(item => item.isChecked);
    this.project.id_job_priority = selectedPriority.id;
    this.project.id_project_status = this.id_project_status;
    this.project.project_status = {id : 4, project_status : "accepted"};
    let filesUploaded = [];
    for (let index = 0; index < this.files.length; index++) {
      const file = this.files[index];
      try {
        let response = await this.dropboxApiService.uploadFile(
          this.buildName(this.project),
          this.buildAddress(this.project),
          file
        );
        filesUploaded.push({ ...file, ...response });
      } catch (error) {
        loading.dismiss();
        this.modalCtrl.dismiss();
        await this.presentToastError(error);
      }
    }

    this.project.project_files = filesUploaded.map(item => {
      return {
        id_project: this.project.id,
        url: item.result.path_display,
        size: item.result.size,
        id_resource: 22
      };
    });

    const versions = this.project.versions.map(x => {
        if (x.id == this.version.id) {
          return { ...this.version, isModified: true };
        } else {
          return { ...x };
        }
      });

    const projectUpdated: Project = {
        ...this.project,
        isModified: true,
        versions: versions
    };

    this.projectService.update(this.project.id, projectUpdated);
    loading.dismiss();
    await this.presentToastOk();
    this.modalCtrl.dismiss({
        redirect: true,
        saveDb:true
    });
  }

  /**
   * build name with project data
   * @param project
   * @returns string
   */
  buildName(project: Project): string {
    return `${project.contact_address.contact.first_name}-${project.contact_address.contact.last_name}`.replace(
      /\s+/g,
      '-'
    );
  }
  /**
   * build address with project data
   * @param project
   * @returns string
   */
  buildAddress(project: Project): string {
    return `${project.contact_address.address}-${project.contact_address.city}-${project.contact_address.country_state.country_state}`.replace(
      /\s+/g,
      '-'
    );
  }

  /**
   * Show toast All OK
   */
  async presentToastOk() {
    const toast = await this.toastController.create({
      message: 'The synchronization has finished.',
      duration: 2000
    });
    toast.present();
  }
  /**
   * Show toast All OK
   */
  async presentToastError(error) {
    const toast = await this.toastController.create({
      message: ('Error u' + error) as string,
      duration: 2000
    });
    toast.present();
  }

  async openPopoverColors(event: any, idGroup: number) {
    let colors = this.groupColors.filter(x => x.id_group == idGroup);
    const shingle_lines = this.version.shingle_lines;
    const materialTypeId = (shingle_lines.length>0)?shingle_lines[0].id_material_type:null;
    if(materialTypeId && idGroup == 4){
        colors = this.groupColors.filter(x => x.id_group == idGroup && x.id_material_type==materialTypeId);
    }

    const popover = await this.popoverCtrl.create({
      component: PopoverGroupColorsComponent,
      event,
      side: 'top',
      cssClass:'popover-colors-settings',
      size:'auto',
      mode:'md',
      alignment:'center',
      componentProps: {
        colors
      }
    });

    await popover.present();
    const result = await popover.onWillDismiss();
    if (result.data) {
      this.saveColor(result.data.id, idGroup);
    }
  }

  saveColor(idGroupColor: number, idGroup: number) {
    const color: PvColor = {
        id: uuidv4(),
        id_group_color: idGroupColor,
        id_version: this.version.id,
        id_group: idGroup,
        isModified: true
    };
    // Ensure that pv_colors is an array if it doesn't exist previously."
    let pv_colors = this.version.pv_colors ? [...this.version.pv_colors]: [];
    // To search if a color for the group already exists.
    const index = pv_colors.findIndex(x => x.id_group === idGroup);
    if (index !== -1) {
        // If it exists, update that specific element.
        pv_colors[index] = { ...pv_colors[index], id_group_color: idGroupColor, isModified: true };
    } else {
        // If it doesn't exist, add the new color.
        pv_colors.push(color);
    }
    // Mark the version as modified and save.
    this.version = { ...this.version, pv_colors, isModified: true };
    //agregamos el color al grupo
    this.groups = this.groups.map(group=>{
        if(group.id == idGroup){
            const groupColor = this.groupColors.find(x => x.id == idGroupColor);
            return groupColor ? { ...group, groupColor } : group;
        }
        return group;
    });
  }


  validateRolePermission() {
    if (this.project) {
      this.rolesPermissionsService
        .validateUserPermision(
          this.project.id_project_status,
          this.project.user_saleman.id_user,
          this.project
        )
        .then(result => {
          this.userDisabledPermision = result;
        });
    }
  }


  /**
   * The closeModal function dismisses the modal.
   */
  closeModal() {
    this.modalCtrl.dismiss();
  }

  /**
   * Modal Date Functions
   */
  openModalDatetime(type: string) {
    let minDate = new Date();
    this.dateType = type;
    this.mdlDateTitle = (this.dateType === 'start')?'Start Date':'End Date';
    if(this.startDate){
        minDate = new Date(this.startDate);
    }
    this.minDateString = minDate.toISOString();
    this.isMdlDateOpen = true;
  }
  mdlResponsePayload(payload: any) {
    this.isMdlDateOpen = payload.isDatePopUpOpen;
    if(payload.wasSelectedDate){
      var dateSelected = new Date(payload.dateSelected);
      this.setMinEndDate(dateSelected.toISOString());
    }
  }
  setMinEndDate(dateSelected:string) {
    if(this.dateType === 'start'){
        this.project.start_date = dateSelected;
        this.startDate = this.project.start_date;
    }

    if(this.dateType === 'last'){
        const endDateSelected = dateSelected;
        const date = new Date(this.startDate);
        const endDate = new Date(endDateSelected);
        if (date.getTime() >= endDate.getTime()) return;
        this.project.end_date = endDateSelected;
        this.lastDate = this.project.end_date;
    }
    this.isFormCompleted();
  }


}
