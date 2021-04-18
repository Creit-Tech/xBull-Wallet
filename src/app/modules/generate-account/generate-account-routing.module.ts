import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateAccountSelectionsComponent } from './pages/create-account-selections/create-account-selections.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: CreateAccountSelectionsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateAccountRoutingModule { }
