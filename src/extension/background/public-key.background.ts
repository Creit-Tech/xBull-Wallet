import { IRuntimeErrorResponse, IRuntimeGetPublicKeyMessage, IRuntimeGetPublicKeyResponse } from '~extension/interfaces';
import { getActiveAccount, getSitePermissions } from '~extension/background/state.background';

export const requestPublicKey = async (message: IRuntimeGetPublicKeyMessage): Promise<IRuntimeGetPublicKeyResponse | IRuntimeErrorResponse> => {
  const payload = message.payload;
  const savedPermissions = await getSitePermissions(payload.origin + '_' + payload.host);

  if (!savedPermissions?.canRequestPublicKey) {
    return {
      error: true,
      errorMessage: 'You are not authorized to request public keys from this wallet'
    };
  }

  try {
    const activeAccount = await getActiveAccount();

    return {
      error: false,
      payload: activeAccount.publicKey,
    };
  } catch (e) {
    return {
      error: true,
      errorMessage: e,
    };
  }
};
