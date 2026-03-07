// app.config.js
import { config } from 'dotenv';

// Load environment variables based on the environment
const env = process.env.NODE_ENV || 'production';
const envPath = `.env.${env}`;

const result = config({ path: envPath });
if (result?.error) {
  config();
}

// Load environment variables from env.js if available
let envVars = {};
try {
  envVars = require('./env.js');
} catch (e) {
  console.log('No env.js file found, using environment variables');
}

// Default API URL if not defined in environment
const apiUrl = process.env.EXPO_PUBLIC_API_URL || envVars.EXPO_PUBLIC_API_URL || 'https://api.jsk-logistics.org';
const googleMapsIosApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY || envVars.GOOGLE_MAPS_IOS_API_KEY || '';
const googleMapsAndroidApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY || envVars.GOOGLE_MAPS_ANDROID_API_KEY || '';

export default {
  name: 'JSK',
  slug: 'jsk',
  version: '3.7.0',
  orientation: 'portrait',
  icon: './assets/images/tayar_logo.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
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

  // ─── iOS ─────────────────────────────────────────────────────────────────
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.expressjsk.jsk',
    supportsRTL: true,
    config: {
      usesNonExemptEncryption: false,
      googleMapsApiKey: googleMapsIosApiKey
    },
    infoPlist: {
      // Camera — required for barcode scanning and photo capture
      NSCameraUsageDescription:
        'JSK needs access to your camera to scan order barcodes for quick tracking and to take photos to send in chat conversations.',

      // Microphone — required for voice messages in chat
      NSMicrophoneUsageDescription:
        'JSK needs access to your microphone to record and send voice messages in chat conversations.',

      // Face ID — required for biometric login on Face ID devices.
      // Missing this key causes [LAContext canEvaluatePolicy:error:] to throw
      // an NSException which crashes the Hermes GC on the TurboModule thread.
      NSFaceIDUsageDescription:
        'JSK uses Face ID to securely verify your identity when logging in, so only you can access your account.',

      // Photo Library — only needed if you want to let users pick from gallery
      NSPhotoLibraryUsageDescription:
        'JSK needs access to your photo library to let you attach images in chat conversations.',

      // Export compliance — app does not use non-exempt encryption
      ITSAppUsesNonExemptEncryption: false,

      // Background modes — enables push notifications when app is in background
      UIBackgroundModes: ['remote-notification'],
    }
  },

  // ─── Android ─────────────────────────────────────────────────────────────
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/tayar_logo.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.taiar',
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: 'pan',
    googleServicesFile: './google-services.json',
    allowBackup: false,
    supportsRTL: true,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.RESTART_PACKAGES',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'NOTIFICATIONS'
    ],
    config: {
      googleMaps: {
        apiKey: googleMapsAndroidApiKey
      }
    }
  },

  // ─── Web ─────────────────────────────────────────────────────────────────
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/tayar_logo.png'
  },

  // ─── Plugins ─────────────────────────────────────────────────────────────
  plugins: [
    // Core router — must be listed first
    'expo-router',

    // Splash screen
    [
      'expo-splash-screen',
      {
        image: './assets/images/tayar_logo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ],

    // Camera — adds NSCameraUsageDescription to Info.plist and CAMERA to AndroidManifest
    [
      'expo-camera',
      {
        cameraPermission:
          'JSK needs access to your camera to scan order barcodes for quick tracking and to take photos to send in chat conversations.'
      }
    ],

    // Local Authentication (Face ID / Fingerprint)
    // faceIDPermission → NSFaceIDUsageDescription in Info.plist (via plugin)
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'JSK uses Face ID to securely verify your identity when logging in, so only you can access your account.'
      }
    ],

    // Secure Store — no config needed; listed so the native module is linked
    'expo-secure-store',

    // Notifications
    [
      'expo-notifications',
      {
        icon: './assets/images/tayar_logo.png',
        color: '#ffffff',
        sounds: ['./assets/sound/success.mp3', './assets/sound/failure.mp3'],
        enableBackgroundRemoteNotifications: true,
        androidMode: 'default',
        androidCollapsedTitle: 'JSK',
        androidBadgeIconType: 'large',
        androidImportance: 'max',
        iosDisplayInForeground: true
      }
    ],

    // Build properties
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '36.0.0',
          kotlinVersion: '1.9.25',
          enableProguardInReleaseBuilds: true,
          enableSeparateBuildPerCPUArchitecture: true,
          largeHeap: true
        },
        ios: {
          useFrameworks: 'static',
          deploymentTarget: '15.1'
        }
      }
    ],

    // Custom plugin — Google Maps, push-notification entitlements, background modes
    './app.plugin.js'
  ],

  // ─── Experiments ─────────────────────────────────────────────────────────
  experiments: {
    typedRoutes: true
  },

  // ─── Extra / EAS ─────────────────────────────────────────────────────────
  extra: {
    apiUrl,
    googleMapsIosApiKey,
    googleMapsAndroidApiKey,
    router: {
      origin: false
    },
    eas: {
      projectId: '7cd8b12e-2b06-47bf-b819-a41c16408900'
    }
  },
  owner: 'expressjsk',

  // Legacy notification config (used by some older Expo tooling)
  notification: {
    icon: './assets/images/tayar_logo.png',
    color: '#ffffff',
    androidMode: 'default',
    androidCollapsedTitle: 'Updates from JSK',
    iosDisplayInForeground: true
  }
};
