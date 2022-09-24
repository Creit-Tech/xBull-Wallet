import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GiftCardsSearchComponent } from '~root/modules/gift-cards/pages/gift-cards-search/gift-cards-search.component';

const routes: Routes = [
  {
    path: '',
    component: GiftCardsSearchComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GiftCardsRoutingModule { }
