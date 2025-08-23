// app.config.js
import { config } from 'dotenv';

// Load environment variables based on the environment
const env = process.env.NODE_ENV || 'production';
const envPath = `.env.${env}`;

try {
  config({ path: envPath });
} catch (e) {
  console.log(`No ${envPath} file found, using default environment variables`);
}

// Load environment variables from env.js if available
let envVars = {};
try {
  envVars = require('./env.js');
} catch (e) {
  console.log('No env.js file found, using environment variables');
}

// Default API URL if not defined in environment
const apiUrl = process.env.EXPO_PUBLIC_API_URL || envVars.EXPO_PUBLIC_API_URL || 'https://api.taiar.org';
const googleMapsIosApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY || envVars.GOOGLE_MAPS_IOS_API_KEY || '';
const googleMapsAndroidApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY || envVars.GOOGLE_MAPS_ANDROID_API_KEY || '';

export default {
  name: 'Taiar',
  slug: 'taiar',
  version: '2.4.3',
  orientation: 'portrait',
  icon: './assets/images/tayar_logo_dark.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/tayar_logo_dark.png',
    resizeMode: 'contain',
    backgroundColor: '#252424'
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
      usesNonExemptEncryption: false,
      googleMapsApiKey: googleMapsIosApiKey
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/tayar_logo_dark.png',
      backgroundColor: '#252424'
    },
    package: 'com.taiar',
    // Enable edge-to-edge display
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: 'pan',
    // Enable system UI adjustments
    windowSoftInputMode: 'adjustResize',
    googleServicesFile: './google-services.json',
    config: {
      googleMaps: {
        apiKey: googleMapsAndroidApiKey
      }
    }
  },
  web: {
    favicon: './assets/images/tayar_logo_dark.png'
  },
  plugins: [
    './app.plugin.js',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '36.0.0'
        },
        ios: {
          useFrameworks: 'static',
          deploymentTarget: '15.1'
        }
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/tayar_logo_dark.png',
        color: '#252424',
        sounds: ['./assets/sound/success.mp3', './assets/sound/failure.mp3'],
        enableBackgroundRemoteNotifications: true,
        androidMode: 'default',
        androidCollapsedTitle: 'Taiar',
        androidBadgeIconType: 'large',
        androidImportance: 'max',
        iosDisplayInForeground: true
      }
    ]
  ],
  extra: {
    apiUrl,
    googleMapsIosApiKey,
    googleMapsAndroidApiKey,
    eas: {
      projectId: 'c1d54568-437f-4a8c-a692-8b8ac589ffb0'
    }
  }
}; 