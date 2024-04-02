import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetailPage } from '../prospecting/pages/detail/detail.page';
import { HomePage } from './home.page';
import { MaterialPage } from '../material/material.page';
import { WorkOrdersPage } from '../work-orders/work-orders.page';
import { AuthGuard } from '../shared/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home/prospecting',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomePage,
    canActivate: [AuthGuard],
    children: [
      /**
       * Prospecting
       */
      {
        path: 'prospecting',
        canActivate: [AuthGuard],

        loadChildren: () =>
          import('../prospecting/prospecting.module').then(
            (m) => m.ProspectingPageModule
          ),
      },
      
      {
        path: 'prospecting/detail/:id',
        component: DetailPage,
        canActivate: [AuthGuard],
      },
      
      {
        path: 'material',
        canActivate: [AuthGuard],
        component: MaterialPage,
      },
      {
        path: 'work_orders',
        canActivate: [AuthGuard],
        component: WorkOrdersPage,
      },
      /**
       * Estimate
       */
      {
        path: 'estimate',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../estimate/estimate.module').then(
            (m) => m.EstimatePageModule
          ),
      },
      /**
       * Scope of work
       */
      {
        path: 'scope-of-work',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../scope-of-work/scope-of-work.module').then(
            (m) => m.ScopeOfWorkPageModule
          ),
      },
      /**
       * review-materials
       */
       {
        path: 'review-materials',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('../review-materials/review-materials.module').then(
            (m) => m.ReviewMaterialsModule
          ),
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
