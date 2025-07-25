const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');

module.exports = function androidConfigPlugin(config) {
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
      'android.permission.POST_NOTIFICATIONS'
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
  
  return config;
};