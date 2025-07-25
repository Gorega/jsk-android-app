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
  version: '2.4.1',
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
    bundleIdentifier: 'com.expresstaiar.taiar',
    // Enable edge-to-edge display
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/tayar_logo.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.taiar',
    // Enable edge-to-edge display
    softwareKeyboardLayoutMode: 'pan',
    // Enable system UI adjustments
    windowSoftInputMode: 'adjustResize',
    googleServicesFile: './google-services.json'
  },
  web: {
    favicon: './assets/images/tayar_logo.png'
  },
  plugins: [
    './app.plugin.js',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0'
        }
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/tayar_logo.png',
        color: '#ffffff',
        sounds: ['./assets/sound/success.mp3', './assets/sound/failure.mp3']
      }
    ]
  ],
  extra: {
    apiUrl,
    eas: {
      projectId: 'c1d54568-437f-4a8c-a692-8b8ac589ffb0'
    }
  }
}; 