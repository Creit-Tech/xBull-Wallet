export enum VaultStatus {
  WAITING_CREATION = 'WAITING_CREATION',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export enum VaultTransactionStatus {
  WAITING_DEPOSIT = 'WAITING_DEPOSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// In the future we can have a vault deposit collection is needed
export interface IEarnVaultTransaction {
  _id: string;
  amount: number;
  baseXDR: string;
  status: VaultTransactionStatus;
  cancelReason?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEarnVault {
  _id: string;
  depositorPublicKey: string;
  strategyId: string;
  status: VaultStatus;
  cancelReason?: string;
  lastReinvestment?: Date;
  apy: number;
  apr: number;
  tvl: number;
  creationXDR: string;
  vaultAccount: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createEarnVault(params: IEarnVault): IEarnVault {
  return {
    _id: params._id,
    depositorPublicKey: params.depositorPublicKey,
    strategyId: params.strategyId,
    status: params.status,
    cancelReason: params.cancelReason,
    lastReinvestment: params.lastReinvestment,
    apy: params.apy,
    apr: params.apr,
    tvl: params.tvl,
    creationXDR: params.creationXDR,
    vaultAccount: params.vaultAccount,
    transactionId: params.transactionId,
    createdAt: new Date(params.createdAt),
    updatedAt: new Date(params.updatedAt),
  };
}
