import { Platform } from 'react-native';

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function getDefaultApiBaseUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}

export const API_BASE_URL = envApiBaseUrl || getDefaultApiBaseUrl();
