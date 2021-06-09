const { resolve } = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: resolve(__dirname, 'src/extension/background.js'),
    'xbull-sdk': resolve(__dirname, 'src/extension/xbull-sdk.js'),
    'content-script': resolve(__dirname, 'src/extension/content-script.js'),
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist/xbull'),
  },
  resolve: {
    extensions: ['.js'],
  },
  target: 'web',
};
