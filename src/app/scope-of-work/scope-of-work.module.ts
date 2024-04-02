import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ScopeOfWorkPageRoutingModule } from './scope-of-work-routing.module';
import { ScopeOfWorkPage } from './scope-of-work.page';
import { ComponentsModule } from '../shared/components/components.module';
import { ScopeOfWorkListComponent } from './components/scope-of-work-list/scope-of-work-list.component';
import { ScopeEditModalComponent } from './modals/scope-edit-modal/scope-edit-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScopeOfWorkPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [
    ScopeOfWorkPage,
    ScopeOfWorkListComponent,
    ScopeEditModalComponent,
  ],
})
export class ScopeOfWorkPageModule {}
