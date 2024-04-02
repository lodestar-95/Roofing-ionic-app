import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PdfViewerPagePage } from './pdf-viewer-page.page';

const routes: Routes = [
  {
    path: '',
    component: PdfViewerPagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PdfViewerPagePageRoutingModule {}
