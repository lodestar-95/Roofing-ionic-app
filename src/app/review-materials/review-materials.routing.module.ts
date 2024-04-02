import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReviewMaterialsComponent } from './review-materials.component';
import { PreviewOrderComponent } from './components/preview-order/preview-order.component';

const routes: Routes = [
  {
    path: ':id', 
    component: ReviewMaterialsComponent
  },
  {
    path:'preview/:supplierId',
    component: PreviewOrderComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReviewMaterialsRoutingModule {}