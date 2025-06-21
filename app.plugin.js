const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function modifyGradlePropertiesPlugin(config) {
  // First, set up the initial config if needed
  if (!config.plugins) config.plugins = [];
  
  // Return the modified config
  return withAndroidManifest(config, async (config) => {
    // Patch the ExpoModulesCorePlugin.gradle file
    const fs = require('fs');
    const path = require('path');
    
    try {
      // This will be executed during the prebuild phase
      config.modResults = {
        ...config.modResults,
        // Just pass along the manifest unchanged
      };
      
      return config;
    } catch (e) {
      console.error("Error in custom plugin:", e);
      return config;
    }
  });
};