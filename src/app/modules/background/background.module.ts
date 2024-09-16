import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from './background.component';
import { ModalsModule } from '~root/shared/shared-modals/modals.module';
import { SiteRequestComponent } from './components/site-request/site-request.component';
import { TranslationModule } from '~root/translation.module';
import { NzMenuDirective, NzMenuItemComponent } from 'ng-zorro-antd/menu';
import { RouterLink } from '@angular/router';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzWaveDirective } from 'ng-zorro-antd/core/wave';

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
    NzMenuDirective,
    NzMenuItemComponent,
    RouterLink,
    NzButtonComponent,
    NzWaveDirective,
  ],
})
export class BackgroundModule { }
