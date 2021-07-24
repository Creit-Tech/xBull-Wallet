import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from './background.component';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { SiteRequestComponent } from './components/site-request/site-request.component';

@NgModule({
  declarations: [
    BackgroundComponent,
    SiteRequestComponent,
  ],
  exports: [
    BackgroundComponent,
  ],
  imports: [
    CommonModule,
    ModalsModule,
  ],
})
export class BackgroundModule { }
