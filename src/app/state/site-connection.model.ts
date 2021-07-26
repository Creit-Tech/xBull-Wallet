export const siteConnectionDocVersion = 1;

export interface ISiteConnection {
  _id: string; // origin_host format
  host: string;
  origin: string;
  canRequestPublicKey: boolean;
  canRequestSign: boolean;
  createdAt: number;

  docVersion: number; // This field is used for migrations
}

export function createSiteConnection(params: Omit<ISiteConnection, 'docVersion'>): ISiteConnection {
  return {
    _id: params._id,
    host: params.host,
    origin: params.origin,
    canRequestPublicKey: params.canRequestPublicKey,
    canRequestSign: params.canRequestSign,
    createdAt: params.createdAt,
    docVersion: siteConnectionDocVersion,
  };
}
