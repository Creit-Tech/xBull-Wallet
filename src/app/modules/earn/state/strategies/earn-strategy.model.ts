export interface IEarnStrategy {
  _id: string;

  strategyImage: string;
  pointerAssetCode: string;
  name: string;
  apr: number;
  tvl: number;
  riskLevel: string;
  holders: number;
  depositFee: number;
  withdrawFee: number;
  holdingFee: number;
  daysToEarn: number;
  totalSharesIssued: number;
  contractAccount: string;
  type: string;
  assetCodeAccepted: string;
  assetIssuerAccepted: string;
  tokenPrice: number;

  createdAt: Date;
  updatedAt: Date;
}

export function createEarnStrategy(params: IEarnStrategy): IEarnStrategy {
  return {
    _id: params._id,
    strategyImage: params.strategyImage,
    pointerAssetCode: params.pointerAssetCode,
    name: params.name,
    apr: params.apr,
    tvl: params.tvl,
    riskLevel: params.riskLevel,
    holders: params.holders,
    depositFee: params.depositFee,
    withdrawFee: params.withdrawFee,
    holdingFee: params.holdingFee,
    daysToEarn: params.daysToEarn,
    totalSharesIssued: params.totalSharesIssued,
    contractAccount: params.contractAccount,
    type: params.type,
    assetCodeAccepted: params.assetCodeAccepted,
    assetIssuerAccepted: params.assetIssuerAccepted,
    tokenPrice: params.tokenPrice,
    createdAt: new Date(params.createdAt),
    updatedAt: new Date(params.updatedAt),
  };
}
