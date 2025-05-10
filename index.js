import 'react-native-gesture-handler';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';

async function bootstrap() {
  try {
    // keep splash up
    await SplashScreen.preventAutoHideAsync();

    const savedLanguage = await SecureStore.getItemAsync('language') || 'ar';
    const shouldBeRTL = savedLanguage === 'ar' || savedLanguage === 'he';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
  } catch (e) {
    console.warn('RTL bootstrap error:', e);
  }
}

bootstrap().finally(async () => {
  // hide splash once RTL is set
  await SplashScreen.hideAsync();
  const App = require('./App').default;
  registerRootComponent(App);
});
