import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WalletconnectRoutingModule } from './walletconnect-routing.module';
import { WalletConnectDashboardComponent } from './pages/walletconnect-dashboard/walletconnect-dashboard.component';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ReactiveFormsModule } from '@angular/forms';
import { SessionProposalComponent } from './components/session-proposal/session-proposal.component';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { SessionRequestComponent } from './components/session-request/session-request.component';
import { SessionDetailsComponent } from './components/session-details/session-details.component';


@NgModule({
  declarations: [
    WalletConnectDashboardComponent,
    SessionProposalComponent,
    SessionRequestComponent,
    SessionDetailsComponent
  ],
  imports: [
    CommonModule,
    WalletconnectRoutingModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzListModule,
    NzButtonModule,
    NzInputModule,
    ReactiveFormsModule,
    NzAvatarModule
  ]
})
export class WalletconnectModule { }
