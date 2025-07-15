import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, DeviceEventEmitter } from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';

export default function CameraScanner() {
  const { language } = useLanguage();
  const { isRTL } = useRTLStyles();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        setError(translations[language].camera.permission.notGranted);
      }
    };

    if (!permission) {
      requestCameraPermission();
    }
  }, [requestPermission, permission]);

  const handleBarCodeScanned = ({ type, data }) => {
    try {
      setLoading(true);
      let orderId;
      
      // Handle different barcode types correctly
      if (type === 'qr') {
        try {
          // Try to parse as JSON first
          // const parsedData = JSON.parse(data);
          orderId = data;
        } catch (parseError) {
          // If parsing fails, use the raw data as order ID
          orderId = data;
        }
      } else {
        // For non-QR barcodes, use the data directly
        orderId = data;
      }
      
      setScanned(true);
      
      // First navigate to orders tab without parameters to clear existing filters
      router.replace({
        pathname: "/(tabs)/orders"
      });
      
      // Then after a small delay, set only the multi_id parameter
      // This avoids conflicts between different filter types
      setTimeout(() => {
        router.setParams({
          multi_id: orderId,
          reset: "true"
        });
      }, 50);
      
    } catch (err) {
      setError(translations[language].camera.scanInvalidTextError || 'Invalid scan data');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <MaterialIcons name="error-outline" size={50} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              {translations[language]?.back || 'Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Feather name="camera-off" size={50} color="#4361EE" />
          <Text style={styles.permissionText}>
            {translations[language].camera.permission.request}
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              {translations[language]?.grantPermission || 'Grant Permission'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing='back'
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [
            'qr',
            'ean-13',
            'ean-8',
            'code-128',
            'code-39',
            'upc-e',
            'codabar'
          ],
        }}
      >
        <View style={styles.overlay}>
          {/* Scanner frame with animated border */}
          <View style={styles.frameBorder}>
            <View 
              style={[
                styles.corner, 
                styles.topLeft,
                { borderColor: colors.primary }
              ]} 
            />
            <View 
              style={[
                styles.corner, 
                styles.topRight,
                { borderColor: colors.primary }
              ]} 
            />
            <View 
              style={[
                styles.corner, 
                styles.bottomLeft,
                { borderColor: colors.primary }
              ]} 
            />
            <View 
              style={[
                styles.corner, 
                styles.bottomRight,
                { borderColor: colors.primary }
              ]} 
            />
          </View>
          
          {/* Instructions text */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.scanText}>
              {translations[language].camera.scanText}
            </Text>
            
            {error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={20} color="white" />
                <Text style={styles.errorBannerText}>
                  {error}
                </Text>
              </View>
            )}
            
            {scanned && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => setScanned(false)}
              >
                <Feather name="refresh-cw" size={16} color="white" style={{marginRight: 8}} />
                <Text style={styles.rescanButtonText}>
                  {translations[language].camera.scanAgainTapText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4361EE" />
              <Text style={styles.loadingText}>
                {translations[language]?.processing || 'Processing...'}
              </Text>
            </View>
          )}
          
          {/* Back button */}
          <TouchableOpacity 
            style={[
              styles.backButtonContainer,
              isRTL ? { right: 20 } : { left: 20 }
            ]}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonCircle}>
              <Feather 
                name={isRTL ? "chevron-right" : "chevron-left"} 
                size={24} 
                color="#FFFFFF" 
              />
            </View>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    direction: 'ltr',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameBorder: {
    width: 250,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    direction: 'ltr',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rescanButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 16,
  },
  errorBannerText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '80%',
  },
  errorText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '80%',
  },
  permissionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
