import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WorkOrdersPage } from './work-orders.page';

const routes: Routes = [
  {
    path: '',
    component: WorkOrdersPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkOrdersPageRoutingModule {}
