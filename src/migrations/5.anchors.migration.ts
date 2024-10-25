import { AnchorsState } from '~root/modules/anchors/state/anchors.store';
import { createAnchor } from '~root/modules/anchors/state/anchor.model';
import { Networks } from '@stellar/stellar-sdk';

export const anchorsStoreMigration = (state: AnchorsState) => {
  if (!state.storeVersion || state.storeVersion < 1) {
    if (!!state.entities) {
      const mykoboAnchor = createAnchor({
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
      });

      const linkAnchor = createAnchor({
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
      });

      state.entities[mykoboAnchor._id] = mykoboAnchor;
      state.entities[linkAnchor._id] = linkAnchor;
    }

    state.storeVersion = 1;
  }
};
