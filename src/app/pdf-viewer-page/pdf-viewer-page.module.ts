import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PdfViewerPagePageRoutingModule } from './pdf-viewer-page-routing.module';
import { PdfViewerPagePage } from './pdf-viewer-page.page';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  imports: [
    PdfViewerModule,
    CommonModule,
    FormsModule,
    IonicModule,
    PdfViewerPagePageRoutingModule
  ],
  declarations: [PdfViewerPagePage]
})
export class PdfViewerPagePageModule {}
