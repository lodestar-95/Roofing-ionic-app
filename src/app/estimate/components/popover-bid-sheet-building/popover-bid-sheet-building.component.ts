import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Building } from 'src/app/models/building.model';

@Component({
  selector: 'app-popover-bid-sheet-building',
  templateUrl: './popover-bid-sheet-building.component.html',
  styleUrls: ['./popover-bid-sheet-building.component.scss'],
})
export class PopoverBidSheetBuildingComponent implements OnInit {
  @Input() buildings: Building[];
  activeBuldings: Building[];
  currentBuildingId: number;
  constructor(private popoverController: PopoverController) { }

  ngOnInit() {
    this.initData();
  }

  initData() {
    if (!this.buildings) {
      return;
    }

    this.activeBuldings = this.buildings.filter(building => building.deletedAt == null);

    this.currentBuildingId = this.buildings.find(building => building.active)?.id;
    if(!this.currentBuildingId){
      this.currentBuildingId = this.buildings.find(building => building.is_main_building)?.id ?? 0;
    }
  }

  selectBuilding(buildings: Building[]) {
    this.popoverController.dismiss(buildings);
  }
}
