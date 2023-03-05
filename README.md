![](https://xbull.app/assets/github-wallpaper.png)

# xBull Wallet

xBull is a wallet to serve as a bridge between websites/users and the Stellar blockchain.

### Our goals with xBull are:
- Be part of the infrastructure to boost the Stellar network adoption.
- Offer a curated and flawless user experience.
- Be a reference in the Stellar Blockchain wallet options.
- Make the interaction between users and the Stellar Blockchain easier.

* * *

## **Why another extension wallet?**
We are a software development team, and we (and our partners) have specific requests for businesses. Instead of telling other extensions that they need to add the features we want, we decided that we will create our own extension and at the same time provide more options to end users... Competition is the key to increasing the Stellar ecosystem.

But even if our wallet is aimed to serve our businesses, we designed it in a way it can be used by anyone so it's most likely that you will never notice that it was built with our projects in mind.

## **Features**
xBull tries to be an *easy to use* but powerful wallet, so you will find lots of features, some of them are:
- Generate keypairs from Mnemonic phrases or import one (you own the private keys).
- Support of multi wallets and different Horizon APIs.
- Trade assets with offers, limits and swaps operations.
- Advanced features like manually signing XDRs or generating a chain of operations (similar to the Stellar laboratory).
- Integrated SDK so sites can talk with the extension.
- Encrypted private keys and protection of public keys from websites until the user accepts to share them.
- And way more advanced features!

We are constantly adding new features, want to know all of them? Visit the [docs](https://xbull.app/?utm_source=github&utm_medium=Websites&utm_campaign=organic) and check all this wallet has to offer.

## Operations handled by the wallet
The Stellar Blockchain supports multiple kinds of transactions, xBull is designed to handle all of them. At this moment the supported operations are:

- [X] Create account
- [X] Payment
- [X] Path payment strict send
- [X] Path payment strict receive
- [X] Manage sell offer
- [X] Manage buy offer
- [X] Create passive sell offer
- [X] Set options
- [X] Change Trust
- [X] Allow trust
- [X] Account merge
- [X] Manage Data
- [X] Bump sequence
- [x] Create claimable Balance
- [X] Claim claimable Balance
- [X] Begin Sponsoring Future Reserves
- [X] End Sponsoring Future Reserves
- [x] Revoke Sponsorship
- [x] Clawback
- [x] Clawback Claimable Balance
- [X] Set Trust Line Flags
- [X] Liquidity Pool Deposit
- [X] Liquidity Pool Withdraw
- [x] Invoke host functions


# xBull "SDK"
> We suggest using our library "Stellar Wallets Kit" because by using it you will be able to integrate xBull and all other wallets in your website/app using a single library. Check it out [here](https://https://github.com/Creit-Tech/Stellar-Wallets-Kit)

Our wallet is shipped with an internal "SDK" which helps website owners to interact with the wallet. You can read all the details in the site, the SDK helps you to talk with our wallet like this:

**Request permissions to the wallet:**
```javascript
const permissions = await xBullSDK.connect({
	canRequestPublicKey: true,
	canRequestSign: true
});
```

**Request the public key:**
```javascript
const publicKey = await xBullSDK.getPublicKey();
```

**Request signing a transaction:**
```javascript
const signedTransaction = await xBullSDK.signXDR('AAAAAgAAAQAAAAAAAAAAAOwLt5VQAsyVhQr7Ps0XaKsE99JVCRWUV0V3t+B/5iYdAAABLAAAUN4AAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAElRoaXMgaXMgYSBuZXcgdGVzdAAAAAAAAwAAAAAAAAAAAAAAAGP4PCOshTlRoCoEFOyQZW8dCyRa4t28ju+DWOyBGWmQAAAAAACYloAAAAAAAAAAAQAAAQAAAAAAAAAAAGP4PCOshTlRoCoEFOyQZW8dCyRa4t28ju+DWOyBGWmQAAAAAAAAAAAC+vCAAAAAAAAAAAEAAAEAAAAAAAAAAABj+DwjrIU5UaAqBBTskGVvHQskWuLdvI7vg1jsgRlpkAAAAAAAAAAABycOAAAAAAAAAAAA')
``` 

> When requesting you can also send an object as a second parameter and specify the `network` and `publicKey` (both are required), this will change the selected account and use it to sign the transaction.


# FAQs

If you have any questions about the functionality of the wallet, please check our documentation [here](https://xbull.app/?utm_source=github&utm_medium=Websites&utm_campaign=organic) where you can find all the details about our wallet.

# Contributing
Pull requests are welcome. please open an issue first to discuss what you would like to change/add to the wallet, if you need to include new dependencies please explain the reasons why you can not do the changes without that new library.

Before sending a pull request, test the changes locally and make sure the changes are in line with the code. We will let you know if we will or will not include the updates.

# How to build it myself?
xBull Wallet is available to use by anyone and it's on the google Chrome Store once it's version is at least Beta (version 0.5.0), but just like everything in the Blockchain space, you should always question it.

Because of this, xBull Wallet is possible to be audited and built by anyone. You can pull the source code and generate the build which you can then import into your browser, that way the extension you don't need to trust the version that is hosted in the Google Chrome store.

If you want to learn more about this, please read the documentation [here](https://xbull.app/?utm_source=github&utm_medium=Websites&utm_campaign=organic) where we explain to you how to manually do it

# License
![](https://img.shields.io/badge/License-AGPLv3-lightgrey)

xBull Wallet's name and its design is Creit Tech's property. The code of this application is public and should always be public, any kind of modification and distribution of this software must follow the instructions in the `LICENSE.md` file and the statement before.

    xBull Wallet is a software to interact with the Stellar Blockchain with the help of different APIs
    Copyright (C) 2021  Creit Tech

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Proud from Creit Tech
xBull Wallet is developed by the Creit Tech team with the goal of providing a bridge between the Stellar Blockchain and users/websites. Our businesses needed a capable but at the same time easy to use wallet and that's why we created xBull, that way our clients and the community can use a wallet with a friendly UI and powerful features.

We are proud of what we have created and we are excited to create more businesses on top of the Stellar Blockchain.
