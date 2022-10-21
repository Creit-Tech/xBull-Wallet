import { IAnchor } from '~root/modules/anchors/state/anchor.model';
import { IWalletsAccount } from '~root/state';
import { SHA256 } from 'crypto-js';

export interface IAnchorsAuthToken {
  _id: string; // anchorId_publicKey
  token: string;
  anchorId: IAnchor['_id'];
  publicKey: IWalletsAccount['publicKey'];
}

export function createAnchorsAuthTokenId(params: Pick<IAnchorsAuthToken, 'anchorId' | 'publicKey'>): string {
  return SHA256(
    params.anchorId
    + '_' +
    params.publicKey
  ).toString();
}

export function createAnchorsAuthToken(params: Omit<IAnchorsAuthToken, '_id'>): IAnchorsAuthToken {
  return {
    _id: createAnchorsAuthTokenId(params),
    token: params.token,
    anchorId: params.anchorId,
    publicKey: params.publicKey,
  };
}
