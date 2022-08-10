export interface IEarnToken {
  walletAccountId: string;
  publicKey: string;
  token: string;
}

export function createEarnToken(params: IEarnToken): IEarnToken {
  return {
    walletAccountId: params.walletAccountId,
    publicKey: params.publicKey,
    token: params.token,
  };
}
