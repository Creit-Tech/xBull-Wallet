export interface ICuratedAsset {
  _id: string;
  code: string;
  publicKey: string;
  domain: string;
  image: string;
  type: 'by_creit_tech' | 'yield_tokens' | 'published_backed';
}

export function createCuratedAsset(params: Omit<ICuratedAsset, '_id'>): ICuratedAsset {
  return {
    _id: `${params.code}_${params.publicKey}`,
    code: params.code,
    publicKey: params.publicKey,
    domain: params.domain,
    image: params.image,
    type: params.type,
  };
}
