module.exports = {
  hooks: {
    readPackage: (pkg, context) => {
      if (
        pkg.name === '@stellar/stellar-sdk' ||
        pkg.name === 'stellar-sdk' ||
        pkg.name === '@stellar/stellar-base' ||
        pkg.name === 'stellar-base'
      ) {
        if (pkg.optionalDependencies['sodium-native']) {
          context.log(`Removing "sodium-native" from package ${pkg.name}`)
          delete pkg.optionalDependencies['sodium-native']
        }
      }
      return pkg
    }
  }
}
