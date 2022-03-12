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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { MobileModule } from '~root/mobile/mobile.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NavMenuComponent } from './core/layouts/main-layout/components/nav-menu/nav-menu.component';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { MainLayoutV1Component } from './core/layouts/main-layout-v1/main-layout-v1.component';
import { MobileMenuComponent } from './core/layouts/main-layout-v1/components/mobile-menu/mobile-menu.component';
import { LayoutV1HeaderComponent } from './core/layouts/main-layout-v1/components/layout-v1-header/layout-v1-header.component';
import { LayoutV1AccountHorizonSelectorComponent } from './core/layouts/main-layout-v1/components/layout-v1-account-horizon-selector/layout-v1-account-horizon-selector.component';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    SelectAccountComponent,
    SelectHorizonApiComponent,
    NavMenuComponent,
    MainLayoutV1Component,
    MobileMenuComponent,
    LayoutV1HeaderComponent,
    LayoutV1AccountHorizonSelectorComponent
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
    NzLayoutModule,
    NzSelectModule,
    ReactiveFormsModule,
    NzDividerModule,
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
