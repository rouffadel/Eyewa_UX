import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ishaq.opticalpos',
  appName: 'Eyewa ERP',
  webDir: 'dist/optical-pos/browser',
  plugins: {
    Keyboard: {
      resize: 'body',
      // false avoids double-resize white gap on Android 9–10; adjustResize in manifest still applies
      resizeOnFullScreen: false,
    },
  },
};

export default config;
