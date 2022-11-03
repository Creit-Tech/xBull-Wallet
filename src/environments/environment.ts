// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// Included with Angular CLI.

import { Networks } from 'stellar-base';

export const ENV = 'ENVIRONMENT';

export const environment = {
  xPointersApi: '/api-xPointers',
  xGCApi: '/api-xGC',
  production: false,
  platform: 'website',
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
  }, {
    _id: 'c49b3d6410e8dc1497ee9cf50d7e0a89',
    name: 'Public Node',
    url: 'https://horizon.publicnode.org',
    networkPassphrase: Networks.PUBLIC,
    canRemove: true,
  }],
  version: '1.10.5'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error';
