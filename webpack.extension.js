const { resolve } = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'none',
  entry: {
    background: resolve(__dirname, 'src/extension/background/background.ts'),
    'sdk': resolve(__dirname, 'src/extension/sdk/sdk.ts'),
    'content-script': resolve(__dirname, 'src/extension/content-script/content-script.ts'),
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist/xbull'),
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        options: {
          configFile: resolve(__dirname, './tsconfig.extension.json')
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.ts'],
    alias: {
      "~root": resolve(__dirname, "./src/app/"),
      "~env": resolve(__dirname, "./src/env/"),
      "~extension": resolve(__dirname, "./src/extension/")
    }
  },
  target: 'web',
};
