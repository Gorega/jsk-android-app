# Tayar Android App Update

## Android 15 (API Level 35) Compatibility Update

This update addresses the Google Play requirement to target Android 15 (API level 35) by August 31, 2025.

### Changes Made

1. **Updated Target SDK Version**
   - The app now targets Android 15 (API level 35)
   - The build.gradle files were already configured with compileSdkVersion and targetSdkVersion set to 35

2. **Updated App Version**
   - Increased app version from 2.2.0 to 2.3.0
   - Updated versionCode from 1 to 2
   - Updated mock API server to match the new version

3. **Permission Updates**
   - Replaced deprecated `SCHEDULE_EXACT_ALARM` permission with `USE_EXACT_ALARM` to comply with Android 15 requirements

### Testing Instructions

1. Build and run the app on an Android device or emulator to ensure it works properly with the new target SDK version:
   ```
   npm run android
   ```

2. Test the update functionality using the mock API server:
   ```
   npm run mock-api
   ```

3. Verify that all app features work correctly with the new target SDK version.

### Release Process

1. Test the app thoroughly on different Android devices
2. Create a new release build:
   ```
   eas build --platform android --profile production
   ```
3. Submit the new build to Google Play Store

### Additional Notes

- The update to Android 15 ensures compliance with Google Play requirements
- This update maintains backward compatibility with older Android versions (minimum SDK version remains 24)
- No functional changes were made to the app, only platform compatibility updates 