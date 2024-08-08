import {
  IRuntimeErrorResponse,
  IRuntimeGetNetworkResponse,
} from '~extension/interfaces';
import { getActiveApi } from '~extension/background/state.background';
import { IHorizonApi } from '~root/state';
import { Networks } from 'stellar-sdk';

export const requestNetwork = async (): Promise<IRuntimeGetNetworkResponse | IRuntimeErrorResponse> => {
  try {
    const savedPermissions: IHorizonApi = await getActiveApi();

    const index: number = Object.values(Networks)
      .findIndex((n: Networks): boolean => n === savedPermissions.networkPassphrase);

    return {
      error: false,
      payload: {
        network: Object.keys(Networks)[index],
        networkPassphrase: savedPermissions.networkPassphrase,
      },
    };
  } catch (e: any) {
    return {
      error: true,
      errorMessage: e,
    };
  }
};
