import { registerPlugin } from '@capacitor/core';

export interface HealthConnectPlugin {
  getStatus(): Promise<{ status: string }>;
  requestPermissions(): Promise<void>;
  readSteps(): Promise<{ records: Array<{ count: number, startTime: string, endTime: string }> }>;
  readWeight(): Promise<{ records: Array<{ weight: number, time: string }> }>;
  readHeight(): Promise<{ records: Array<{ height: number, time: string }> }>;
}

const HealthConnect = registerPlugin<HealthConnectPlugin>('HealthConnect');

export const checkHealthConnect = async () => {
  try {
    const { status } = await HealthConnect.getStatus();
    console.log('Health Connect Status:', status);

    if (status === 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED') {
      const providerPackageName = 'com.google.android.apps.healthdata';
      const uriString = `market://details?id=${providerPackageName}&url=healthconnect%3A%2F%2Fonboarding`;
      window.open(uriString, '_system');
    }

    return status;
  } catch (error) {
    console.error('Error checking Health Connect status:', error);
    return 'UNKNOWN';
  }
};

export default HealthConnect;
