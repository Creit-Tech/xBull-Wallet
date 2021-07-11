import { Networks } from 'stellar-base';

export const ENV = 'ENVIRONMENT';

export const environment = {
  production: true,
  defaultApis: [{
    _id: 'aa604e66a74ade3ef250f904ef28c92d',
    name: 'Main Network',
    url: 'https://horizon.stellar.org',
    networkPassphrase: Networks.PUBLIC
  }, {
    _id: '10a05029fe79fe9df15c33ee2e2d43bb',
    name: 'Testnet Network',
    url: 'https://horizon-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET
  }]
};
