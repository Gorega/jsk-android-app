// app.config.js
import { config } from 'dotenv';

// Load environment variables based on the environment
const env = process.env.NODE_ENV || 'development';
const envPath = `.env.${env}`;

try {
  config({ path: envPath });
} catch (e) {
  console.log(`No ${envPath} file found, using default environment variables`);
}

// Default API URL if not defined in environment
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.taiar.org';

export default {
  name: 'Taiar',
  slug: 'taiar',
  version: '2.3.0',
  orientation: 'portrait',
  icon: './assets/images/tayar_logo.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/tayar_logo.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/c1d54568-437f-4a8c-a692-8b8ac589ffb0',
    enabled: true,
    checkAutomatically: 'ON_LOAD'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.expresstaiar.taiar'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/tayar_logo.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.taiar'
  },
  web: {
    favicon: './assets/images/tayar_logo.png'
  },
  extra: {
    apiUrl,
    eas: {
      projectId: 'c1d54568-437f-4a8c-a692-8b8ac589ffb0'
    }
  }
}; 