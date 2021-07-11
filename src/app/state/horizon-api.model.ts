export interface IHorizonApi {
  _id: string;
  name: string;
  url: string;
  networkPassphrase: string;
}

export function createHorizonApi(params: IHorizonApi): IHorizonApi {
  return {
    _id: params._id,
    name: params.name,
    url: params.url,
    networkPassphrase: params.networkPassphrase
  };
}
