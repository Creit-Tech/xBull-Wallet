import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalContainerComponent } from './modal-container/modal-container.component';
import { ModalsService } from '~root/shared/modals/modals.service';
import { SignRequestComponent } from '~root/shared/modals/components/sign-request/sign-request.component';
import { PasswordFormComponent } from './components/password-form/password-form.component';
import { FormsComponentsModule } from '~root/shared/forms-components/forms-components.module';
import { LoadingModule } from '~root/shared/loading/loading.module';
import { ModalWrapperComponent } from './modal-wrapper/modal-wrapper.component';

const COMPONENTS = [
  SignRequestComponent,
  ModalWrapperComponent,
];

@NgModule({
  declarations: [
    ModalContainerComponent,
    ...COMPONENTS,
    PasswordFormComponent,
  ],
  exports: COMPONENTS,
  imports: [
    CommonModule,
    FormsComponentsModule,
    LoadingModule,
  ],
})
export class ModalsModule {
  static forRoot(): ModuleWithProviders<ModalsModule> {
    return {
      ngModule: ModalsModule,
      providers: [
        ModalsService,
      ]
    };
  }
}
