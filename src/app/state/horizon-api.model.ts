import { Networks } from '@stellar/stellar-sdk';

export interface INetworkApi {
  _id: string;
  name: string;
  url: string;
  rpcUrl?: string;
  networkPassphrase: Networks;
  canRemove: boolean;
}

export function createNetworkApi(params: INetworkApi): INetworkApi {
  return {
    _id: params._id,
    name: params.name,
    url: params.url,
    rpcUrl: params.rpcUrl,
    networkPassphrase: params.networkPassphrase,
    canRemove: params.canRemove,
  };
}
