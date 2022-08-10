# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
