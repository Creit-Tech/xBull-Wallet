export interface ISiteConnection {
  _id: string; // origin_host format
  canRequestPublicKey: boolean;
  canRequestSign: boolean;
  createdAt: number;
}

export function createSiteConnection(params: ISiteConnection): ISiteConnection {
  return {
    _id: params._id,
    canRequestPublicKey: params.canRequestPublicKey,
    canRequestSign: params.canRequestSign,
    createdAt: params.createdAt,
  };
}
