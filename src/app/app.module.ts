import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { ENV, environment } from '~env';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { ModalsModule } from '~root/shared/modals/modals.module';
import { HttpClientModule } from '@angular/common/http';
import { NgxMaskModule } from 'ngx-mask';
import { BackgroundModule } from '~root/modules/background/background.module';
import { SelectAccountComponent } from './core/layouts/main-layout/components/select-account/select-account.component';
import { SelectHorizonApiComponent } from './core/layouts/main-layout/components/select-horizon-api/select-horizon-api.component';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { SharedPipesModule } from '~root/shared/shared-pipes/shared-pipes.module';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { MobileModule } from '~root/mobile/mobile.module';
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzIconModule} from "ng-zorro-antd/icon";
import { NavMenuComponent } from './core/layouts/main-layout/components/nav-menu/nav-menu.component';
import {NzListModule} from "ng-zorro-antd/list";
import {NzMenuModule} from "ng-zorro-antd/menu";

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    SelectAccountComponent,
    SelectHorizonApiComponent,
    NavMenuComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      hardwareBackButton: false,
    }),
    BrowserAnimationsModule,
    AppRoutingModule,
    environment.production ? [] : AkitaNgDevtools.forRoot(),
    AkitaNgRouterStoreModule,
    ModalsModule.forRoot(),
    HttpClientModule,
    NgxMaskModule.forRoot(),
    BackgroundModule,
    FormsComponentsModule,
    SharedPipesModule,
    MobileModule.forRoot(),
    NzButtonModule,
    NzIconModule,
    NzListModule,
    NzMenuModule,
  ],
  providers: [
    {
      provide: ENV,
      useValue: environment,
    },
    { provide: NZ_I18N, useValue: en_US }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
