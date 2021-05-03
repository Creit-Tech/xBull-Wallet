import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrComponent } from './toastr.component';
import { ToastrService } from '~root/shared/toastr/toastr.service';



@NgModule({
  declarations: [
    ToastrComponent
  ],
  imports: [
    CommonModule
  ],
})
export class ToastrModule {
  static forRoot(): ModuleWithProviders<ToastrModule> {
    return {
      ngModule: ToastrModule,
      providers: [
        ToastrService
      ],
    };
  }
}
