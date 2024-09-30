import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BugsReportsService } from 'src/app/services/bugs-reports.service';
import { LoadingService } from 'src/app/shared/helpers/loading.service';
@Component({
  selector: 'app-import-modal',
  templateUrl: './import-modal.component.html',
  styleUrls: ['./import-modal.component.scss']
})
export class ImportModalComponent implements OnInit, OnDestroy {
  bugsReportList: any[] = [];
  selectedBugsReport: any;
  offset = 0;
  limit = 10;
  hasMore = true;
  loading = false;
  iconHeight = 1;

  constructor(
    private modalController: ModalController,
    private bugsReportsService: BugsReportsService,
    private loadingService: LoadingService
  ) {}

  @ViewChild('iconElement') iconElement!: ElementRef;
  ngOnDestroy(): void {}

  ngOnInit(): void {
    this.getBugsReportsList();
  }

  onScroll(event: any): void {
    // Get the current scroll position and threshold values
    console.log(event.detail);

    const scrollTop = event.detail.scrollTop;
    const scrollHeight = document.getElementById('reportbugs').scrollHeight;

    // Check if we are near the bottom of the content
    if (scrollTop >= 1000 * this.iconHeight && this.hasMore && !this.loading) {
      this.getBugsReportsList();
      this.iconHeight += 1;
    }
  }

  async getBugsReportsList() {
    this.loading = true;
    this.loadingService.show();
    console.log('getBugsReportsList');

    const { data } = await this.bugsReportsService.list(this.offset);
    const newlist = data.map(item => {
      const url = item?.description?.split(' ')[0];
      if (url?.includes('https://ehroofing.atlassian.net/browse/KAN-')) {
        item.url = url;
        item.description = item.description.slice(url.length);
      }
      return item;
    });
    if (newlist.length < this.limit) {
      this.hasMore = false;
    }

    this.bugsReportList = [...this.bugsReportList, ...newlist];
    this.offset += this.limit;
    this.loading = false;
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

  goToJira(url: string) {
    window.open(url, '_blank');
  }
}
