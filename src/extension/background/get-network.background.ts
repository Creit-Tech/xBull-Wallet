import {
  IRuntimeErrorResponse,
  IRuntimeGetNetworkResponse,
} from '~extension/interfaces';
import { getActiveApi } from '~extension/background/state.background';
import { INetworkApi } from '~root/state';
import { Networks } from 'stellar-sdk';

export const requestNetwork = async (): Promise<IRuntimeGetNetworkResponse | IRuntimeErrorResponse> => {
  try {
    const savedApi: INetworkApi = await getActiveApi();

    const index: number = Object.values(Networks)
      .findIndex((n: Networks): boolean => n === savedApi.networkPassphrase);

    return {
      error: false,
      payload: {
        network: Object.keys(Networks)[index],
        networkPassphrase: savedApi.networkPassphrase,
      },
    };
  } catch (e: any) {
    return {
      error: true,
      errorMessage: e,
    };
  }
};
