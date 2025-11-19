import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Alert,
  Animated 
} from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import * as Audio from 'expo-av';

export default function ScanCollectionConfirm() {
  const { language } = useLanguage();
  const { isRTL } = useRTLStyles();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scannedCollection, setScannedCollection] = useState(null);
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  // Animation for scan line
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;
  
  // Sound effects
  const [successSound, setSuccessSound] = useState();
  const [failureSound, setFailureSound] = useState();
  
  // Load sound effects
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: successSnd } = await Audio.Sound.createAsync(
          require('../../assets/sound/success.mp3')
        );
        setSuccessSound(successSnd);
        
        const { sound: failureSnd } = await Audio.Sound.createAsync(
          require('../../assets/sound/failure.mp3')
        );
        setFailureSound(failureSnd);
      } catch (error) {
      }
    };
    
    loadSounds();
    
    return () => {
      if (successSound) successSound.unloadAsync();
      if (failureSound) failureSound.unloadAsync();
    };
  }, []);

  // Start scan line animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        setError(translations[language]?.camera?.permission?.notGranted || 'Camera permission not granted');
      }
    };

    if (!permission) {
      requestCameraPermission();
    }
  }, [requestPermission, permission]);

  const playSuccessSound = async () => {
    try {
      if (successSound) {
        await successSound.setPositionAsync(0);
        await successSound.playAsync();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
    }
  };

  const playFailureSound = async () => {
    try {
      if (failureSound) {
        await failureSound.setPositionAsync(0);
        await failureSound.playAsync();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
    }
  };

  const handleBarCodeScanned = async ({ type: barcodeType, data }) => {
    try {
      setLoading(true);
      let collectionId;
      
      // Handle different barcode types correctly
      if (barcodeType === 'qr') {
        try {
          // Try to parse as JSON first
          const parsedData = JSON.parse(data);
          collectionId = parsedData.id || parsedData.collection_id || data;
        } catch (parseError) {
          // If parsing fails, use the raw data as collection ID
          collectionId = data;
        }
      } else {
        // For non-QR barcodes, use the data directly
        collectionId = data;
      }
      
      // Clean the collection ID - remove any non-numeric characters if it's a number
      if (/^\d+$/.test(collectionId)) {
        collectionId = collectionId.replace(/\D/g, '');
      }
      
      if (!collectionId) {
        throw new Error("Could not extract a valid collection ID from scan");
      }
      
      setScanned(true);
      
      // Directly fetch the collection by ID
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/${collectionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Extract the collection from the nested response structure and merge with other data
      const collectionData = responseData.collection || responseData;
      
      if (collectionData && collectionData.collection_id) {
        // Merge collection data with financials, orders, and other arrays from the response
        const fullCollectionData = {
          ...collectionData,
          financials: responseData.financials || [],
          orders: responseData.orders || [],
          received_amounts: responseData.received_amounts || [],
          expenses: responseData.expenses || [],
          status_history: responseData.status_history || [],
          cod_totals: responseData.cod_totals || []
        };
        setScannedCollection(fullCollectionData);
        playSuccessSound();
        
        // Auto confirm after a short delay
        setTimeout(() => {
          handleConfirmCollection(fullCollectionData);
        }, 1000);
      } else {
        setError(translations[language]?.collections?.collection?.collectionNotFound || 'Collection not found');
        playFailureSound();
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(translations[language]?.collections?.collection?.collectionNotFound || 'Collection not found');
      playFailureSound();
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCollection = async (collection) => {
    if (!collection) {
      setError(translations[language]?.collections?.collection?.noCollectionSelected || 'No collection selected');
      playFailureSound();
      return;
    }

    setConfirming(true);
    try {      
      // Check delivery_type instead of type
      const collectionType = collection.status_key;      
      // Set status based on delivery_type
      const status = collectionType === 'money_out' ? 'paid' : 'returned_delivered';
      
      const collectionId = collection.collection_id;
      
      // Create the API request for the collection
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/${collectionId}/status`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        credentials: 'include',
        body: JSON.stringify({
          status: status,
          note_content: null
        })
      });
      
      const data = await response.json();
      
      // Check if the response is ok
      if (!response.ok) {
        // Handle error responses from backend
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        Alert.alert(
          translations[language]?.collections?.collection?.error || "Error",
          errorMessage
        );
        playFailureSound();
      } else {
        // Handle successful response
        const successMessage = translations[language]?.collections?.collection?.statusUpdatedSuccessfully || "Status updated successfully";
        Alert.alert(
          translations[language]?.collections?.collection?.success || "Success",
          successMessage
        );
        playSuccessSound();
        
        // Return to main screen after confirmation
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      }
      
    } catch (err) {      
      // Handle different types of errors
      let errorMessage = translations[language]?.collections?.collection?.tryAgainLater || 'Please try again later';
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = translations[language]?.collections?.collection?.networkError || 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert(
        translations[language]?.collections?.collection?.error || "Error",
        errorMessage
      );
      playFailureSound();
    } finally {
      setConfirming(false);
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
            onPress={() => router.replace('/(tabs)')}
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
            {translations[language]?.camera?.permission?.request || 'Please grant camera permission to scan QR codes'}
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
      />
      <View style={[styles.overlay, StyleSheet.absoluteFillObject]} pointerEvents="box-none">
        {/* Back button */}
        <TouchableOpacity 
          style={[
            styles.backButtonContainer,
            isRTL ? { right: 20 } : { left: 20 }
          ]}
          onPress={() => router.replace('/(tabs)')}
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
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-120, 120]
                    })
                  }
                ]
              }
            ]} 
          />
        </View>

        {/* Instructions text */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.scanText}>
            {translations[language]?.collections?.collection?.scanToConfirm || 'Scan collection QR code to confirm'}
          </Text>
          
          {error && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={20} color="white" />
              <Text style={styles.errorBannerText}>
                {error}
              </Text>
            </View>
          )}
          
          {scanned && !scannedCollection && !loading && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Feather name="refresh-cw" size={16} color="white" style={{marginRight: 8}} />
              <Text style={styles.rescanButtonText}>
                {translations[language]?.camera?.scanAgainTapText || 'Scan Again'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Collection info */}
        {scannedCollection && (
          <View style={[styles.collectionInfoContainer, { backgroundColor: isDark ? colors.surface : '#fff' }]}>
            <View style={styles.collectionHeader}>
              <FontAwesome6 name={scannedCollection.type === 'money' ? 'money-bill-trend-up' : 'box'} size={24} color={colors.primary} />
              <Text style={[styles.collectionTitle, { color: colors.text }]}>
                {translations[language]?.collections?.collection?.collectionId}: #{scannedCollection.collection_id}
              </Text>
            </View>
            
            <View style={[styles.collectionDetail, { borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>
                {translations[language]?.collections?.collection?.type}:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {scannedCollection.type === 'money' 
                  ? translations[language]?.collections?.collection?.moneyCollection 
                  : translations[language]?.collections?.collection?.packageCollection}
              </Text>
            </View>
            
            {/* Financial Information */}
            {scannedCollection.financials && scannedCollection.financials.length > 0 && (
              <>
                <View style={[styles.collectionDetail, { borderColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    {translations[language]?.collections?.collection?.totalCodValue || 'Total COD Value'}:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {scannedCollection.financials[0].currency_symbol}{scannedCollection.financials[0].total_cod_value}
                  </Text>
                </View>
                
                <View style={[styles.collectionDetail, { borderColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>
                    {translations[language]?.collections?.collection?.finalAmount || 'Final Amount'}:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.success }]}>
                    {scannedCollection.financials[0].currency_symbol}{scannedCollection.financials[0].final_amount}
                  </Text>
                </View>
                
                {scannedCollection.financials[0].total_deductions > 0 && (
                  <View style={[styles.collectionDetail, { borderColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.text }]}>
                      {translations[language]?.collections?.collection?.totalDeductions || 'Total Deductions'}:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.error }]}>
                      {scannedCollection.financials[0].currency_symbol}{scannedCollection.financials[0].total_deductions}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            <View style={[styles.collectionDetail, { borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>
                {translations[language]?.collections?.collection?.orderCount || 'Order Count'}:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {scannedCollection.orders ? scannedCollection.orders.length : (scannedCollection.order_count || 0)}
              </Text>
            </View>
            
            {Array.isArray(scannedCollection.connected_collection_ids) && 
             scannedCollection.connected_collection_ids.length > 0 && (
              <View style={[styles.collectionDetail, { borderColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.text }]}>
                  {translations[language]?.collections?.collection?.connectedCollections || 'Connected Collections'}:
                </Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>
                  {scannedCollection.connected_collection_ids.join(', ')}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.confirmButton, confirming && styles.disabledButton]}
              onPress={() => handleConfirmCollection(scannedCollection)}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialIcons name="cloud-done" size={20} color="white" />
                  <Text style={styles.confirmButtonText}>
                    {scannedCollection.type === 'money'
                      ? translations[language]?.collections?.collection?.confirmPayment
                      : translations[language]?.collections?.collection?.confirmDelivery}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

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
  collectionInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  collectionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4361EE',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
});
