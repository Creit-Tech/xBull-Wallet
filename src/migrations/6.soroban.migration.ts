import { IWalletsAccount, WalletAccountType, WalletsAccountsState } from '~root/state';
import { Networks } from '@stellar/stellar-sdk';
import { createHash } from 'crypto';

function generateWalletAccountId(params: { network: Networks; publicKey: string }): string {
  return createHash('md5')
    .update(`${params.network}_${params.publicKey}`)
    .digest('hex');
}

export const sorobanAccountsMigration = (state: WalletsAccountsState) => {
  // If store is less than version 2, add the type 'with_secret_key' because they were the only kind we were using
  if (!state.storeVersion || state.storeVersion < 2) {
    if (!!state.entities) {
      const sorobanPublicKeys: string[] = Object.values(state.entities).filter((entity: IWalletsAccount) => {
        const futurenetId: string = createHash('md5')
          .update(`${Networks.FUTURENET}_${entity.publicKey}`)
          .digest('hex');

        const sandboxId: string = createHash('md5')
          .update(`${Networks.SANDBOX}_${entity.publicKey}`)
          .digest('hex');

        const standaloneId: string = createHash('md5')
          .update(`${Networks.STANDALONE}_${entity.publicKey}`)
          .digest('hex');


        return [futurenetId, sandboxId, standaloneId].indexOf(entity.publicKey) !== -1;
      })
        .map((entity: IWalletsAccount) => entity.publicKey);

      for (const entitiesKey in state.entities) {
        if (state.entities.hasOwnProperty(entitiesKey)) {
          state.entities[entitiesKey].docVersion = 2;
          if (sorobanPublicKeys.indexOf(state.entities[entitiesKey].publicKey) !== -1) {
            const futurenetId =
              generateWalletAccountId({ network: Networks.FUTURENET, publicKey: state.entities[entitiesKey].publicKey });
            const standaloneId =
              generateWalletAccountId({ network: Networks.STANDALONE, publicKey: state.entities[entitiesKey].publicKey });
            const sandboxId =
              generateWalletAccountId({ network: Networks.SANDBOX, publicKey: state.entities[entitiesKey].publicKey });

            const { _id, accountRecord, ...rest } = state.entities[entitiesKey];
            state.entities[futurenetId] = { _id: futurenetId, ...rest };
            state.entities[standaloneId] = { _id: standaloneId, ...rest };
            state.entities[sandboxId] = { _id: sandboxId, ...rest };
            state.ids?.push(futurenetId);
            state.ids?.push(standaloneId);
            state.ids?.push(sandboxId);
          }
        }
      }
    }

    state.storeVersion = 2;
  }
};
