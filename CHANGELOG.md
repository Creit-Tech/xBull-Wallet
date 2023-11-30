# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.17.1] - 2023-06-27
### Add
- Add bump and restore operations to the valid list of operations
- latest soroban client version

## [1.17.1] - 2023-06-27
### Add
- Add localhost as a whitelisted option for unsecured pages (non HTTPS) when using the extension version

## [1.17.0] - 2023-06-24
### Add
- Add simple support to SEP-0007

### Changed
- Do not show the claimable balance options when sending a payment to the asset issuer.

## [1.16.3] - 2023-06-19
### Add
- Mykobo and Link to the anchors default options

## [1.16.2] - 2023-06-16
### Add
- Actions to automatically deploy to the stores (version of the app was upgraded in order to test)

## [1.16.1] - 2023-06-15
### Add
- Add a new modal component to make the request of the public key from an Air-gapped wallet easier.

### Changed
- Update the name of the option to create an Air-gapped wallet so it includes "LumenSigner" for now because is the only of its kind available on Stellar

## [1.16.0] - 2023-06-14
### Add
- Support to air-gapped wallets (QR sharing protocols). The first protocol added is the one from LumenSigner (https://github.com/LumenSigner/lumensigner)

### Changed
- In order to make it easier to handle wallet types and account types in the future, all references to those fields were changed to an Enum


## [1.15.3] - 2023-04-29
### Changed
- Bump Soroban Client package so the wallet can sign Soroban preview 9 transactions

## [1.15.2] - 2023-04-20
### Add
- Now when the wallet loads we also make a basic account request so we also handle those cases where the stream is not available (soroban sandbox development)

### Fixed
- Trezor signing broken: The public key was in the wrong format when creating the tx after a Trezor device has sined it
- Claimable balances list: Some types of claimable balances predictions were wrongly validated

## [1.15.1] - 2023-04-07
### Add
- Add support to Soroban preview 8

### Changed
- We removed the node tree for the host invocation function, this will be added backed later when it supports the breaking changed introduced with the new soroban preview

## [1.15.0] - 2023-03-06
### Add
- Add Soroban Client dependency and allow Soroban operations

### Updated
- Multiple dependencies updated

## [1.11.0] - 2022-11-28
### Add
- Disable WalletConnect button while is starting the process and show a message notifying it

## [1.10.6] - 2022-11-11
### Fixed
- Fix issue with counter asset when using assets no account in the wallet holds

### Changed
- WalletConnect now uses the new core.pairing methods
- If transaction base signature is longer than 1000 digits, we use transaction signing over regular signing (when using ledger wallets)

## [1.10.5] - 2022-11-03
### Changed
- WalletConnect version updated to its latest version

## [1.10.2] - 2022-11-02
### Add
- Add the Spanish version of the Airtime page

## [1.10.1] - 2022-11-01
### Add
- Add a check in the deposit LP page so if the user is not sorting the assets correctly, the wallet sorts them 

## [1.10.0] - 2022-10-30
### Add
- Add versioning in the generate order request (gift cards section)
- Add phone airtime feature

### Changed
- Update the amounts we show in the Gift Card sections so is easier to see the prices in currencies that are different from USDC

## [1.9.0] - 2022-10-21
### Added
- Earning page will now show vault snapshots being taken every day like tvl, usd tvl and number of shares

### Changed
- Order ids in the gift card details modal will now be hidden and instead the user will be able to copy it

## [1.8.0] - 2022-09-27
### Added
- Gift Cards section, users can now buy popular brands' gift cards directly from the wallet and with any asset they hold.

## [1.7.1] - 2022-09-22
### Added
- If recipient of a payment doesn't have a trustline and the sender doesn't want to create a claimable balance, fallback to a regular payment (this is use when burning funds)

## [1.7.0] - 2022-09-03
### Added
- Add new anchors module with Sep-24 support

## [1.6.3] - 2022-09-03
### Fixed
- Fix typo and add validations in the Walletconnect model so we prevent issues when there was a missing value after the entity was updated

## [1.6.2] - 2022-08-30
### Added
- Add support to Muxed accounts

### Fixed
- Fix path payment component

## [1.6.1] - 2022-08-25
### Fixed
- WalletConnect option was not available unless you set your wallet in advanced mode which was incorrect

## [1.6.0] - 2022-08-23
### Added 
- Allow merging accounts from the lab module
- Ask the user if it wants to create a new account when sending a payment to an uncreated account
- Ask the user if it wants to create a new claimable balance for the destination if the destination does not have a trust line set up yet
- Add WalletConnect support for all platforms

## [1.5.1] - 2022-08-23
### Fixed
- Deposit vaults validation was expecting a wrong min value. Now it's dynamic, and it expects the correct one for each vault.
- Small typo in the English version of the earn help information

## [1.5.0] - 2022-08-09
### Added
- "Earn" feature which connects to our farming service for the Stellar Network -> https://xbull.app/farming
- Proxy functionality for local development
- Upgrade Angular 13 -> 14
- Upgrade Angular cdk version 12 -> 13
- Ng Zorro version 13

### Fixed
- Fixed multiple places where text was not showed because of wrong translate implementation

## [1.4.5] - 2022-07-11
### Added
- Support for SEP-0014, if `ASSET_METADATA_SERVER` is available and the currency is not listed on the toml file then we search the server.

### Changed
- Masked public keys are not 4 and 6 digits instead of 4 and 4 digits, this because scammers are trying to generate keys with the same last 4 digits from popular assets in the network
- Destination public keys are now masked at the signing confirmation component

### Fixed
- Fixed the extension version number which was not reflecting the current version number deployed.

## [1.4.0] - 2022-06-06
### Added
- New CHANGELOG file following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) specification.
- Import/Export flow so the state of xBull Wallet can be moved from one app to another one (example from a phone version to an extension version)

### Fixed
- On website versions, sometimes when first launching the app it started on the `create-account` page. Now it's always starting at the homepage (unless there is no wallet created yet).
- Old iOS Safari versions are not compatible with the Broadcast channel object, we are now catching those cases.
