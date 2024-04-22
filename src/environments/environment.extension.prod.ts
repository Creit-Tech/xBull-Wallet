import { Networks } from 'stellar-sdk';

export const ENV = 'ENVIRONMENT';

export const environment = {
  xPointersApi: 'https://farming.xbull.app',
  xGCApi: 'https://gcsr.xbull.app',
  production: true,
  platform: 'extension',
  defaultApis: [{
    _id: 'aa604e66a74ade3ef250f904ef28c92d',
    name: 'Main Network',
    url: 'https://horizon.stellar.org',
    networkPassphrase: Networks.PUBLIC,
    canRemove: false,
  }, {
    _id: '10a05029fe79fe9df15c33ee2e2d43bb',
    name: 'Testnet Network',
    url: 'https://horizon-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
    canRemove: false,
  }],
  version: '1.20.0',
};
