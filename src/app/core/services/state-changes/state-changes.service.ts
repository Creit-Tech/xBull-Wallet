import { Injectable } from '@angular/core';
import { StrKey, xdr } from '@stellar/stellar-sdk';
import BigNumber from 'bignumber.js';

@Injectable({
  providedIn: 'root'
})
export class StateChangesService {

  constructor() { }

  parseEntriesDifferences(entries: Array<{ key: string; before: string; after: string }>): LedgerEntryDiff[] {
    return entries.map((change: { key: string; before: string; after: string }): LedgerEntryDiff => ({
      key: xdr.LedgerKey.fromXDR(Buffer.from(change.key, 'base64')),
      before: change.before ? xdr.LedgerEntry.fromXDR(Buffer.from(change.before, 'base64')) : null,
      after: change.after ? xdr.LedgerEntry.fromXDR(Buffer.from(change.after, 'base64')) : null,
    }));
  }

  parseBalanceChanges(params: {
    account: string;
    entriesDifferences: LedgerEntryDiff[];
  }): IAssetBalanceChange[] {
    const assetChanges: IAssetBalanceChange[] = [];

    for (const entryDiff of params.entriesDifferences) {
      let ledgerKey: xdr.LedgerKeyAccount | xdr.LedgerKeyTrustLine;
      let before: xdr.AccountEntry | xdr.TrustLineEntry | null;
      let after: xdr.AccountEntry | xdr.TrustLineEntry | null;

      switch (entryDiff.key.switch().name) {
        case 'account':
          ledgerKey = entryDiff.key.value() as xdr.LedgerKeyAccount;
          before = entryDiff.before && entryDiff.before.data().value() as xdr.AccountEntry;
          after = entryDiff.after && entryDiff.after.data().value() as xdr.AccountEntry;

          if (StrKey.encodeEd25519PublicKey(ledgerKey.accountId().value()) !== params.account) {
            continue;
          }

          assetChanges.push({
            asset: 'native',
            before: before
              ? new BigNumber(before.balance().toBigInt().toString()).dividedBy('10000000').toFixed(7)
              : '0',
            after: after
              ? new BigNumber(after.balance().toBigInt().toString()).dividedBy('10000000').toFixed(7)
              : '0',
          });
          break;

        case 'trustline':
          ledgerKey = entryDiff.key.value() as xdr.LedgerKeyTrustLine;
          before = entryDiff.before && entryDiff.before.data().value() as xdr.TrustLineEntry;
          after = entryDiff.after && entryDiff.after.data().value() as xdr.TrustLineEntry;

          if (StrKey.encodeEd25519PublicKey(ledgerKey.accountId().value()) !== params.account) {
            continue;
          }

          const asset = (ledgerKey as xdr.LedgerKeyTrustLine).asset().value();

          if (!asset || asset instanceof Array || (!xdr.AlphaNum4.isValid(asset) && !xdr.AlphaNum12.isValid(asset))) {
            continue;
          }

          assetChanges.push({
            asset: asset.assetCode().toString('utf8') + ':' + StrKey.encodeEd25519PublicKey(asset.issuer().value()),
            before: before
              ? new BigNumber(before.balance().toBigInt().toString()).dividedBy('10000000').toFixed(7)
              : '0',
            after: after
              ? new BigNumber(after.balance().toBigInt().toString()).dividedBy('10000000').toFixed(7)
              : '0',
          });
          break;
      }
    }

    return assetChanges;
  }
}

interface LedgerEntryDiff {
  key: xdr.LedgerKey;
  before: xdr.LedgerEntry | null;
  after: xdr.LedgerEntry | null;
}

export interface IAssetBalanceChange {
  asset: 'native' | string;
  before: string | null;
  after: string | null;
}
