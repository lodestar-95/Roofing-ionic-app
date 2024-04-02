import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentsModule } from '../shared/components/components.module';
import { ReviewMaterialsRoutingModule } from './review-materials.routing.module';
import { ReviewMaterialsComponent } from './review-materials.component';
import { IonicModule } from '@ionic/angular';
import { AccordionDetailComponent } from './components/accordion-detail/accordion-detail.component';
import { MaterialTableComponent } from './components/material-table/material-table.component';
import { MoveMaterialModalComponent } from './components/move-material-modal/move-material-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ProspectingPageModule } from '../prospecting/prospecting.module';
import { NewMaterialModalComponent } from './components/new-material-modal/new-material-modal.component';
import { PreviewOrderComponent } from './components/preview-order/preview-order.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';


@NgModule({
  declarations: [ReviewMaterialsComponent,
    AccordionDetailComponent,
    MaterialTableComponent,
    MoveMaterialModalComponent,
    NewMaterialModalComponent,
    PreviewOrderComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ComponentsModule,
    ReviewMaterialsRoutingModule,
    IonicModule,
    ReactiveFormsModule,
    ProspectingPageModule,
    PdfViewerModule
  ]
})
export class ReviewMaterialsModule { }
