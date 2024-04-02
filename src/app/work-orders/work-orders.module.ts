import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WorkOrdersPageRoutingModule } from './work-orders-routing.module';

import { WorkOrdersPage } from './work-orders.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WorkOrdersPageRoutingModule
  ],
  declarations: [WorkOrdersPage]
})
export class WorkOrdersPageModule {}
