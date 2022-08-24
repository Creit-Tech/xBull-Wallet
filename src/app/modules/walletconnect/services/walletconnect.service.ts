import { Inject, Injectable } from '@angular/core';
import SignClient from '@walletconnect/sign-client';
import { PairingTypes, ProposalTypes } from '@walletconnect/types';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { ENV, environment } from '~env';
import { Networks } from 'stellar-base';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  SessionProposalComponent
} from '~root/modules/walletconnect/components/session-proposal/session-proposal.component';
import { WalletConnectSessionsStore } from '~root/state/walletconnect-sessions/walletconnect-sessions.store';
import { createWalletConnectSession } from '~root/state/walletconnect-sessions/walletconnect-session.model';
import { WalletConnectSessionsQuery } from '~root/state/walletconnect-sessions/walletconnect-sessions.query';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  SessionRequestComponent
} from '~root/modules/walletconnect/components/session-request/session-request.component';

@Injectable({ providedIn: 'root' })
export class WalletConnectService {
  private client!: SignClient;
  private chain = {
    [Networks.PUBLIC]: 'pubnet',
    [Networks.TESTNET]: 'testnet',
  };

  constructor(
    @Inject(ENV)
    private readonly env: typeof environment,
    private readonly nzDrawerService: NzDrawerService,
    private readonly nzModalService: NzModalService,
    private readonly nzMessageService: NzMessageService,
    private readonly walletConnectSessionsStore: WalletConnectSessionsStore,
    private readonly walletConnectSessionsQuery: WalletConnectSessionsQuery,
  ) {}

  async startClient(): Promise<void> {
    if (!!this.client) {
      return;
    }

    try {
      this.client = await SignClient.init({
        projectId: '889aa10e443859bdfdbab44c2b34fc8e',
        logger: this.env.production ? undefined : 'debug',
        metadata: {
          name: 'xBull Wallet',
          description: 'The most versatile wallet in the Stellar Network',
          url: 'https://xbull.app',
          icons: ['https://cdn-xbull-app.nyc3.digitaloceanspaces.com/logo.svg'],
        },
      });
      this.handleSessionProposal();
      // this.handleSessionEvent();
      this.handleSessionUpdate();
      this.handleSessionRequest();
      this.handleSessionDelete();
      console.log('WalletConnect client started');
    } catch (e) {
      console.error('WalletConnect client failed to start');
    }
  }

  private handleSessionProposal(): void {
    // Show session proposal data to the user
    // i.e. in a modal with options to approve / reject it
    this.client.on('session_proposal', (data) => {
      if (!this.env.production) {
        console.log('session_proposal', data);
      }

      this.nzDrawerService.create({
        nzPlacement: 'bottom',
        nzContent: SessionProposalComponent,
        nzContentParams: {
          name: data.params.proposer.metadata.name,
          description: data.params.proposer.metadata.description,
          url: data.params.proposer.metadata.url,
          img: data.params.proposer.metadata.icons[0],
          proposal: data.params,
        },
        nzHeight: 'auto',
        nzClosable: false,
        nzWrapClassName: 'ios-safe-y',
      });

    });
  }

  // TODO: check later if we want to support this
  // private handleSessionEvent(): void {
  //   // Handle session events, such as 'chainChanged', 'accountsChanged', etc.
  //   this.client.on('session_event', (data) => {
  //     if (!this.env.production) {
  //       console.log('session_event', data);
  //     }
  //
  //   });
  // }

  private handleSessionUpdate(): void {
    this.client.on('session_update', ({ topic, params }) => {
      if (!this.env.production) {
        console.log('session_update', params);
      }

      const { namespaces } = params;
      const savedSession = this.walletConnectSessionsQuery.getEntity(topic);

      if (!!savedSession) {
        const updatedSession = { ...savedSession, namespaces };
        this.walletConnectSessionsStore.upsert(topic, updatedSession);
      }
    });
  }

  private handleSessionRequest(): void {
    this.client.on('session_request', (data) => {
      if (!this.env.production) {
        console.log('session_request', data);
      }

      const session = this.walletConnectSessionsQuery.getEntity(data.topic);

      if (!!session) {
        this.nzDrawerService.create({
          nzPlacement: 'bottom',
          nzContent: SessionRequestComponent,
          nzContentParams: {
            eventId: data.id,
            topic: data.topic,
            method: data.params.request.method as 'stellar_signXDR' | 'stellar_signAndSubmitXDR',
            xdr: data.params.request.params.xdr,
            name: session.peer.metadata.name,
            url: session.peer.metadata.url,
            img: session.peer.metadata.icons[0],
          },
          nzHeight: 'auto',
          nzClosable: false,
          nzWrapClassName: 'ios-safe-y',
        });
      }
    });
  }

  private handleSessionDelete(): void {
    this.client.on('session_delete', (data) => {
      if (!this.env.production) {
        console.log('session_delete', data);
      }

      const session = this.walletConnectSessionsQuery.getEntity(data.topic);

      if (!!session) {
        this.nzMessageService.success(`Session with ${session.peer.metadata.name} removed.`);
        this.walletConnectSessionsStore.remove(data.topic);
      }
    });
  }

  public async pairWithClient(uri: string): Promise<PairingTypes.Struct> {
    return this.client.pair({ uri });
  }

  public async approvePairing(data: {
    proposal: ProposalTypes.Struct;
    accountsPublicKeys: string[];
    network: Networks;
  }): Promise<void> {
    const targetChain = `stellar:${this.chain[data.network]}`;

    if (!data.proposal.requiredNamespaces.stellar.chains.includes(targetChain)) {
      throw new Error('Network is not supported, make sure you are using the accepted from the app (Public or Testnet)');
    }

    const { acknowledged } = await this.client.approve({
      id: data.proposal.id,
      namespaces: {
        stellar: {
          accounts: data.accountsPublicKeys.map((account) =>
            `${targetChain}:${account}`
          ),
          methods: data.proposal.requiredNamespaces.stellar.methods,
          events: data.proposal.requiredNamespaces.stellar.events,
        }
      }
    });

    const session = await acknowledged();

    const sessionModel = createWalletConnectSession({
      ...session,
      createdAt: new Date(),
    });

    this.walletConnectSessionsStore.upsert(sessionModel._id, sessionModel);
  }

  public async rejectProposal(id: number): Promise<void> {
    await this.client.reject({
      id,
      reason: {
        code: 1,
        message: 'rejected',
      },
    });
  }

  public async requestResponse(params: {
    id: number;
    topic: string;
    success: boolean;
    xdr?: string;
    errorMessage?: string
  }): Promise<void> {
    const responseObj: any = {
      topic: params.topic,
      response: {
        id: params.id,
        jsonrpc: '2.0',
      }
    };

    if (params.success) {
      responseObj.response.result = {
        [!!params.xdr ? 'signedXDR' : 'status']: params.xdr || 'success',
      };
    } else {
      responseObj.response.error = {
        code: -32000,
        message: params.errorMessage,
      };
    }

    await this.client.respond(responseObj);
  }

  public async rejectRequest(params: { topic: string; id: number }): Promise<void> {
    await this.client.respond({
      topic: params.topic,
      response: {
        id: params.id,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'User rejected the request',
        },
      },
    });
  }

  public async disconnectSession(params: { topic: string; reason: string; }): Promise<void> {
    await this.client.disconnect({
      topic: params.topic,
      reason: {
        message: params.reason,
        code: -1
      }
    });

    this.walletConnectSessionsStore.remove(params.topic);
  }
}
