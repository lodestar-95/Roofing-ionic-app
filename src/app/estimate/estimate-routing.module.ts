import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EstimatePage } from './estimate.page';
import { BidSheetPage } from './pages/bid-sheet/bid-sheet.page';

const routes: Routes = [
  {
    path: '',
    component: EstimatePage
  },
  {
    path:'bid_sheet/:trademark/:materialtype',
    component: BidSheetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EstimatePageRoutingModule {}
