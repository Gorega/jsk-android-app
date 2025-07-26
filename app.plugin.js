const { withAndroidManifest, withGradleProperties, withPlugins, withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

// Custom plugin to handle Google Maps for iOS
const withIosGoogleMaps = (config) => {
  return withInfoPlist(config, (config) => {
    // Add the required keys to Info.plist for Google Maps
    const infoPlist = config.modResults;
    
    // Only add if not already present
    if (!infoPlist.GMSApiKey) {
      // You should replace this with your actual Google Maps API key
      infoPlist.GMSApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY || '';
    }
    
    return config;
  });
};

// Custom plugin to handle iOS push notification entitlements
const withIosPushNotifications = (config) => {
  return withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;
    
    // Ensure aps-environment is set
    if (!entitlements['aps-environment']) {
      entitlements['aps-environment'] = 'development';
    }
    
    // Add time-sensitive notifications capability
    if (!entitlements['com.apple.developer.usernotifications.time-sensitive']) {
      entitlements['com.apple.developer.usernotifications.time-sensitive'] = true;
    }
    
    return config;
  });
};

module.exports = function configPlugin(config) {
  // First, set up the initial config if needed
  if (!config.plugins) config.plugins = [];
  
  // Add necessary permissions for push notifications
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Ensure we have the manifest object
    if (!androidManifest.manifest) {
      return config;
    }
    
    // Add permissions if they don't exist
    const permissions = [
      'android.permission.INTERNET',
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.WAKE_LOCK' // Add this permission for background notifications
    ];
    
    // Make sure we have a uses-permission array
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    // Add each permission if it doesn't exist
    permissions.forEach(permission => {
      const exists = androidManifest.manifest['uses-permission'].some(
        perm => perm.$?.['android:name'] === permission
      );
      
      if (!exists) {
        androidManifest.manifest['uses-permission'].push({
          $: {
            'android:name': permission
          }
        });
      }
    });
    
    // Ensure we have the application object
    if (androidManifest.manifest.application && androidManifest.manifest.application.length > 0) {
      const application = androidManifest.manifest.application[0];
      
      // Make sure we have a meta-data array
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }
      
      // Add FCM notification service meta-data if it doesn't exist
      const fcmMetaDataExists = application['meta-data'].some(
        meta => meta.$?.['android:name'] === 'expo.modules.notifications.default_notification_icon'
      );
      
      if (!fcmMetaDataExists) {
        application['meta-data'].push({
          $: {
            'android:name': 'expo.modules.notifications.default_notification_icon',
            'android:resource': '@drawable/notification_icon'
          }
        });
      }
    }
    
    return config;
  });
  
  // Add necessary gradle properties for FCM
  config = withGradleProperties(config, config => {
    config.modResults = config.modResults.filter(
      item => item.type !== 'property' || item.key !== 'android.useAndroidX'
    );
    
    config.modResults.push({
      type: 'property',
      key: 'android.useAndroidX',
      value: 'true'
    });
    
    return config;
  });
  
  // Apply our custom iOS Google Maps plugin
  config = withIosGoogleMaps(config);
  
  // Apply our custom iOS push notification entitlements
  config = withIosPushNotifications(config);
  
  // Configure iOS Info.plist for background modes
  config = withInfoPlist(config, config => {
    const infoPlist = config.modResults;
    
    // Ensure UIBackgroundModes includes remote-notification
    if (!infoPlist.UIBackgroundModes) {
      infoPlist.UIBackgroundModes = ['remote-notification'];
    } else if (!infoPlist.UIBackgroundModes.includes('remote-notification')) {
      infoPlist.UIBackgroundModes.push('remote-notification');
    }
    
    return config;
  });
  
  return config;
};