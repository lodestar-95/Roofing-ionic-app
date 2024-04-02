import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
      canActivate: [AuthGuard],
  },
  {
    path: '',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'reset-password/:token',
    loadChildren: () =>
      import('./reset-password/reset-password.module').then(
        (m) => m.ResetPasswordPageModule
      ),
  },
  {
    path: 'reset-password/show/message',
    loadChildren: () =>
      import('./reset-password/pages/message/message.module').then(
        (m) => m.MessagePageModule
      ),
  },
  {
    path: 'forget-password',
    loadChildren: () =>
      import('./forget-password/forget-password/forget-password.module').then(
        (m) => m.ForgetPasswordPageModule
      ),
  },
  // {
  //   path: 'prospecting',
  //   loadChildren: () => import('./prospecting/prospecting.module').then( m => m.ProspectingPageModule)
  // },
  {
    path: 'work-orders',
    loadChildren: () => import('./work-orders/work-orders.module').then( m => m.WorkOrdersPageModule)
  },
  {
    path: 'material',
    loadChildren: () => import('./material/material.module').then( m => m.MaterialPageModule)
  },
  {
    path: 'pdf-viewer-page',
    loadChildren: () => import('./pdf-viewer-page/pdf-viewer-page.module').then( m => m.PdfViewerPagePageModule)
  },
  // {
  //   path: 'estimate',
  //   loadChildren: () => import('./estimate/estimate.module').then( m => m.EstimatePageModule)
  // },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
