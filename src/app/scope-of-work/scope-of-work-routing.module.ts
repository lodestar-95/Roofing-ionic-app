import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScopeOfWorkPage } from './scope-of-work.page';

const routes: Routes = [
  {
    path: '',
    component: ScopeOfWorkPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScopeOfWorkPageRoutingModule {}
