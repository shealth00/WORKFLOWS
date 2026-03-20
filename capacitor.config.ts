import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sallyhealth.workflows',
  appName: 'Sally Health',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
