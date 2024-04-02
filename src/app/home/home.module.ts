import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HomePage } from './home.page';
import { HomePageRoutingModule } from './home-routing.module';

import { BugsReportModalComponent } from './modals/bugs-report/bugs-report.component';
import { ImportModalComponent } from './modals/bugs-report/import-modal.component';

@NgModule({
  declarations: [
    HomePage,
    BugsReportModalComponent,
    ImportModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    HomePageRoutingModule
  ],
  exports: [],
})
export class HomePageModule {}
