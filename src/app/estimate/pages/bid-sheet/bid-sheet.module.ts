import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { BidSheetPage } from './bid-sheet.page';
import { ComponentsModule } from '../../../shared/components/components.module';
import { BidSheetTableComponent } from '../../components/bid-sheet-table/bid-sheet-table.component';
import { PopoverBidSheetBuildingComponent } from '../../components/popover-bid-sheet-building/popover-bid-sheet-building.component';
import { BidSheetService } from './bid-sheet.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule
  ],
  declarations: [BidSheetPage,
    BidSheetTableComponent,
    PopoverBidSheetBuildingComponent
  ],
  providers: [BidSheetService]
})
export class BidSheetPageModule { }
