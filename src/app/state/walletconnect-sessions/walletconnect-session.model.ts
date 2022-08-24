import { SessionTypes } from '@walletconnect/types';
import { SHA256 } from 'crypto-js';

export interface IWalletConnectSessionModel extends SessionTypes.Struct {
  _id: string; // this is the hash of name_url
  createdAt: Date;
}

export const createWalletConnectSession = (data: Omit<IWalletConnectSessionModel, '_id'>) => {
  return {
    ...data,
    _id: data.topic,
    // _id: SHA256(
    //   data.peer.metadata.name
    //   + '_' +
    //   data.peer.metadata.url
    // ).toString(),
    createAt: new Date(data.createdAt),
  };
};
