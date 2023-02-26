import { Networks } from 'soroban-client';

export interface IHorizonApi {
  _id: string;
  name: string;
  url: string;
  networkPassphrase: Networks;
  canRemove: boolean;
}

export function createHorizonApi(params: Omit<IHorizonApi, 'Server'>): IHorizonApi {
  return {
    _id: params._id,
    name: params.name,
    url: params.url,
    networkPassphrase: params.networkPassphrase,
    canRemove: params.canRemove,
  };
}
