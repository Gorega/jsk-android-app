import { AppRegistry, I18nManager } from 'react-native';
import App from './App';

// Apply RTL settings as early as possible
const applyRTLSettings = async () => {
  try {
    // Force RTL globally for Arabic and Hebrew
    const { getToken } = require('./utils/secureStore');
    const savedLanguage = await getToken('language') || 'ar';
    const shouldBeRTL = savedLanguage === 'ar' || savedLanguage === 'he';
    
    // Log before state
    console.log('Initial RTL state:', { isRTL: I18nManager.isRTL });
    
    // Apply RTL settings
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    
    // Log after state
    console.log('Applied RTL settings:', { 
      isRTL: I18nManager.isRTL, 
      language: savedLanguage, 
      shouldBeRTL 
    });
    
  } catch (error) {
    console.error('Error applying RTL settings:', error);
  }
};

// Apply RTL settings before registering the app
applyRTLSettings().then(() => {
  // Register the app component
  AppRegistry.registerComponent('main', () => App);
});