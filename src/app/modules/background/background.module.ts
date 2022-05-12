import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from './background.component';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { SiteRequestComponent } from './components/site-request/site-request.component';
import { TranslationModule } from '~root/translation.module';

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
    TranslationModule.forChild(),
  ],
})
export class BackgroundModule { }
