import { Networks } from 'stellar-base';
import { createHash } from 'crypto';

export interface IAnchor {
  _id: string;
  networkPassphrase: Networks;
  name: string;
  url: string;
  image: string;
  email: string;
  description: string;

  signingKey: string;
  // transferServer: string;
  transferServerSep24: string;
  webAuthEndpoint: string;
  canBeRemoved: boolean;
}

export function createAnchor(params: Omit<IAnchor, '_id'>): IAnchor {
  return {
    _id: createHash('sha256')
      .update(`${params.url}_${params.networkPassphrase}`)
      .digest('base64'),
    networkPassphrase: params.networkPassphrase,
    name: params.name,
    url: params.url,
    image: params.image,
    email: params.email,
    description: params.description,
    signingKey: params.signingKey,
    transferServerSep24: params.transferServerSep24,
    webAuthEndpoint: params.webAuthEndpoint,
    canBeRemoved: params.canBeRemoved,
  };
}
