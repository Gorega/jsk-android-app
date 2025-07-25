// app/(camera)/scanReference.js
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import Animated from 'react-native-reanimated';

export default function ScanReference() {
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
        setError(translations[language].camera?.permission?.notGranted || 'Camera permission not granted');
      }
    };

    if (!permission) {
      requestCameraPermission();
    }
  }, [requestPermission, permission]);

  const handleBarCodeScanned = ({ type: barcodeType, data }) => {
    try {
      setLoading(true);
      let referenceId;
      
      // Handle different barcode types correctly
      if (barcodeType === 'qr') {
        try {
          // Try to parse as JSON first
          const parsedData = JSON.parse(data);
          referenceId = parsedData.id || parsedData.reference_id || data;
        } catch (parseError) {
          // If parsing fails, use the raw data as reference ID
          referenceId = data;
        }
      } else {
        // For non-QR barcodes, use the data directly
        referenceId = data;
      }
      
      setScanned(true);
      
      // Instead of using global variable, pass the data directly via router      
      // Use a simpler approach - just pass the scanned ID and go back
      setTimeout(() => {
        // Store the scanned ID in a global variable as a fallback
        if (typeof global === 'undefined') {
          global = {};
        }
        global.scannedReferenceId = referenceId;
        
        // Navigate back to the previous screen
        router.back();
      }, 300);
      
    } catch (err) {
      console.error('Error processing scan:', err);
      setError(translations[language].camera?.scanInvalidTextError || 'Invalid scan data');
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
            {translations[language].camera?.permission?.request || 'Please grant camera permission to scan QR codes'}
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
          {/* Back button */}
          <TouchableOpacity 
            style={[
              styles.backButtonContainer,
              isRTL ? { right: 20 } : { left: 20 }
            ]}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonCircle}>
              <MaterialCommunityIcons name="window-close" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
          
          {/* Scanner frame with animated border */}
          <View style={[
            styles.scannerFocusArea,
            { 
              borderColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 5,
            }
          ]}>
            <Animated.View 
              style={[
                styles.scanLine,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  transform: [
                    {
                      translateY: 0 // Replace with animation if needed
                    }
                  ]
                }
              ]} 
            />
          </View>
          
          {/* Instructions text */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.scanText}>
              {translations[language].camera?.scanText || 'Scan QR code for reference ID'}
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
                  {translations[language].camera?.scanAgainTapText || 'Scan Again'}
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
  scannerFocusArea: {
    width: 280,
    height: 280,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4361EE',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#4361EE',
    position: 'absolute',
    opacity: 0.8,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  errorText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  permissionContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  permissionText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});