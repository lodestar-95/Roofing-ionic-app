import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BugsReportsService } from 'src/app/services/bugs-reports.service';
import { LoadingService } from 'src/app/shared/helpers/loading.service';


@Component({
  selector: 'app-import-modal',
  templateUrl: './import-modal.component.html',
  styleUrls: ['./import-modal.component.scss'],
})
export class ImportModalComponent implements OnInit, OnDestroy {
  bugsReportList: any[];
  selectedBugsReport: any;

  constructor(
    private modalController: ModalController,
    private bugsReportsService: BugsReportsService,
    private loadingService: LoadingService
  ) {
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    this.getBugsReportsList();
  }

  async getBugsReportsList() {
    this.loadingService.show();

    const { data } = await this.bugsReportsService.list();
    this.bugsReportList = data.map(item => {
    const url = item?.description?.split(' ')[0];
    if(url?.includes('https://ehroofing.atlassian.net/browse/KAN-')){
      item.url = url;
      item.description = item.description.slice(url.length);
    }
      return item;
    });

    this.loadingService.hide();
  }

  selectBugsReport(bugsReport: any) {
    this.selectedBugsReport = bugsReport;
  }

  /**
   * Save lodal data and close modal
   */
  onConfirm() {
    this.modalController.dismiss(this.selectedBugsReport);
  }

  /**
   * Save lodal data and close modal
   */
  onCancel() {
    this.modalController.dismiss();
  }

  goToJira(url: string){
    window.open(url, '_blank');
  }
}
