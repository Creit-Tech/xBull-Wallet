import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'create-account',
    loadChildren: () => import('./modules/generate-account/generate-account.module')
      .then(m => m.GenerateAccountModule),
  },
  {
    path: '**', // TODO: update this once we have complete with the basic development of the welcome and dashboard
    redirectTo: 'create-account',
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
