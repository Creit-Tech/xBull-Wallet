const { resolve } = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'none',
  entry: {
    background: resolve(__dirname, 'src/extension/background/background.ts'),
    'sdk': resolve(__dirname, 'src/extension/sdk/sdk.ts'),
    'content-script': resolve(__dirname, 'src/extension/content-script/content-script.ts'),
    'popup': resolve(__dirname, 'src/extension/popup.ts'),
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist/extension'),
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
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
          to: resolve(__dirname, "dist/extension/browser-polyfill.js"),
          toType: "file",
          force: true,
        },
        {
          from: resolve(__dirname, "src/manifest." + (process.env.MANIFEST_VERSION || 'v3') + '.json'),
          to: resolve(__dirname, "dist/extension/manifest.json"),
          toType: "file",
          force: true,
        },
      ],
    }),
  ],
};
