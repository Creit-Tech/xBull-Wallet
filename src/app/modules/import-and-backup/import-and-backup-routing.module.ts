import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  ImportAndBackupSelectionComponent
} from '~root/modules/import-and-backup/pages/import-and-backup-selection/import-and-backup-selection.component';

const routes: Routes = [
  {
    path: '',
    component: ImportAndBackupSelectionComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImportAndBackupRoutingModule { }
