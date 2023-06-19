import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { createAnchor, IAnchor } from './anchor.model';
import { Networks } from 'soroban-client';
import { BaseEntityStore } from '~root/state/base-entity.store';

export interface AnchorsState extends EntityState<IAnchor> {
  storeVersion: number;
}

@Injectable()
@StoreConfig({
  name: 'anchors',
  idKey: '_id',
  resettable: true,
})
export class AnchorsStore extends BaseEntityStore<AnchorsState> {

  constructor() {
    super({
      storeVersion: 1,
    });
    this.upsertMany(this.getDefaultAnchors());
  }

  getDefaultAnchors(): IAnchor[] {
    return [
      createAnchor({
        name: 'Ultra Stellar',
        url: 'https://ultrastellar.com',
        description: 'Ultra Stellar is building the future of money on the Stellar network. Our products provide access to a new financial infrastructure that helps anyone in the world to achieve financial freedom.',
        image: 'https://ultrastellar.com/static/images/org_logo.png',
        email: 'support@ultrastellar.com',
        networkPassphrase: Networks.PUBLIC,
        signingKey: 'GA3UK3JHOYYD3TAUH5C7NDOUDWBRF5FC4MECXFA2VRPEHIDQUOJIVOAJ',
        webAuthEndpoint: 'https://ultrastellar.com/auth',
        transferServerSep24: 'https://ultrastellar.com/sep24',
        canBeRemoved: false,
      }),
      createAnchor({
        name: 'KB Trading',
        url: 'https://kbtrading.org',
        description: 'KB trading software created and trades CLPX (Chile PESO COIN), BTCLN (Bitcoin Lightning), and in pilot mode IDRT Indonesia, XCHF Swiss tokens.',
        image: 'https://lirp.cdn-website.com/457debfa/dms3rep/multi/opt/kb2-138w.png',
        email: 'support@kbtrading.org',
        networkPassphrase: Networks.PUBLIC,
        signingKey: 'GAQJIBVWXUHLD5CSUZDWIQEML7MAGXSS64T6A26SI5CGA33U7ZSYIM54',
        webAuthEndpoint: 'https://kbtrading.org/auth',
        transferServerSep24: 'https://kbtrading.org/sep24',
        canBeRemoved: false,
      }),
      createAnchor({
        name: 'Anclap',
        url: 'https://api.anclap.com',
        description: 'Stable digital asset structuring and issuance.',
        image: 'https://home.anclap.com/wp-content/uploads/2021/09/Ico.svg',
        email: 'info@anclap.com',
        networkPassphrase: Networks.PUBLIC,
        signingKey: 'GDVHOU4AF2QINLYETV2YFC7YWPRVXN4SKR6SOJZ7LAWODJIZJ7ZPJUER',
        webAuthEndpoint: 'https://api.anclap.com/auth',
        transferServerSep24: 'https://api.anclap.com/transfer24',
        canBeRemoved: false,
      }),
      createAnchor({
        name: 'Relay Tech Services Ltd',
        url: 'https://sep.stablex.cloud',
        description: 'Stable digital asset structuring and issuance.',
        image: 'https://sep.stablex.cloud/favicon.png',
        email: 'support@stablex.zendesk.com',
        networkPassphrase: Networks.PUBLIC,
        signingKey: 'GD7IUGJDUJHWLO6XXLOYOHGJYVABIPMGFUFZXGEGLQGT5YULQLPE6UZ2',
        webAuthEndpoint: 'https://transfer-server.stablex.cloud/auth',
        transferServerSep24: 'https://transfer-server.stablex.cloud',
        canBeRemoved: false,
      }),
      createAnchor({
        name: 'ClickPesa',
        url: 'https://connect.clickpesa.com',
        description: 'ClickPesa offers a toolbox with payment solutions making it easier to receive and make payments for your business.',
        image: 'https://ipfs.io/ipfs/bafkreibsal2jwdm5n6wtqjo5egd4kp7xmhfsnk6sv3gwbgjy7ubvy4uu6e',
        email: 'service@clickpesa.com',
        networkPassphrase: Networks.PUBLIC,
        signingKey: 'GA6WRVV7W2XJTIGBOHR37HZM2X3AAINJ76UNRTWBBXUBWNMJCKWTMID3',
        webAuthEndpoint: 'https://connect.clickpesa.com/auth',
        transferServerSep24: 'https://connect.clickpesa.com/sep24',
        canBeRemoved: false,
      }),
      createAnchor({
        name: 'Stellar Development Foundation',
        url: 'https://testanchor.stellar.org',
        description: 'The Stellar Development Foundation (SDF) is a non-profit organization whose mission is to create equitable access to the global financial system.',
        image: '',
        email: '',
        networkPassphrase: Networks.TESTNET,
        signingKey: 'GCUZ6YLL5RQBTYLTTQLPCM73C5XAIUGK2TIMWQH7HPSGWVS2KJ2F3CHS',
        webAuthEndpoint: 'https://testanchor.stellar.org/auth',
        transferServerSep24: 'https://testanchor.stellar.org/sep24',
        canBeRemoved: false,
      }),
      createAnchor({
        name: 'MYKOBO',
        url: 'https://mykobo.co',
        description: 'Send money fast...',
        image: 'https://mykobo.co/img/eurc_icon_128.png',
        email: 'hello@mykobo.co',
        networkPassphrase: Networks.PUBLIC,
        signingKey: 'GAHNDAOJ7IB6KKMGKBGI5JWJHCTFXOVGY4U2N57C2CUZPK3SPEPCLU76',
        webAuthEndpoint: 'https://anchor.mykobo.co/auth',
        transferServerSep24: 'https://anchor.mykobo.co/sep24',
        canBeRemoved: false,
      }),
      createAnchor({
        name: 'LINK',
        url: 'https://www.ngnc.online',
        description: 'LINK is building web3 Cross Border payments infrastructure for the next billion Africans, providing services in a Faster and Cheaper way',
        image: 'https://uploads-ssl.webflow.com/60a70a1080cf2974d4b1595e/60b623a4d06b3b67a49c9e82_WEBCLIP.png',
        email: 'support@linkio.africa',
        networkPassphrase: Networks.PUBLIC,
        signingKey: 'GBCQXM5GLKX4KZFIZ4P4MUEOUMCEMDVMLN6DAQZYUZSIRKULXS3VTPYD',
        webAuthEndpoint: 'https://anchor.ngnc.online/auth',
        transferServerSep24: 'https://anchor.ngnc.online/sep24',
        canBeRemoved: false,
      }),
    ];
  }

}
