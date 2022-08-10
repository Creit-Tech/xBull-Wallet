export interface IEarnStrategy {
  _id: string;
  type: 'lp_aqua_farm';
  minDeposit: number;
  poolIdToFarm: string;
  strategyImages: string[];
  assetCodeAccepted: string;
  assetIssuerAccepted: string;
  name: string;
  apr: number;
  apy: number;
  tvl: number;
  riskLevel: 'low' | 'medium' | 'high' | 'madness';
  depositFee: number;
  withdrawFee: number;
  holdingFee: number;
  feeAssetCode: 'USDC';
  details: {
    strategyDetails: string;
    riskLevel: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export function createEarnStrategy(params: IEarnStrategy): IEarnStrategy {
  return {
    _id: params._id,
    type: params.type,
    minDeposit: params.minDeposit,
    poolIdToFarm: params.poolIdToFarm,
    strategyImages: params.strategyImages,
    assetCodeAccepted: params.assetCodeAccepted,
    assetIssuerAccepted: params.assetIssuerAccepted,
    name: params.name,
    apr: params.apr,
    apy: params.apy,
    tvl: params.tvl,
    riskLevel: params.riskLevel,
    depositFee: params.depositFee,
    withdrawFee: params.withdrawFee,
    holdingFee: params.holdingFee,
    feeAssetCode: params.feeAssetCode,
    details: params.details,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}
