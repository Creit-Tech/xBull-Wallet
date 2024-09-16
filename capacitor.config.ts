import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.xbull.mobile',
  appName: 'xBull Wallet',
  webDir: 'dist/mobile',
  server: {
    androidScheme: 'https'
  }
};

export default config;
