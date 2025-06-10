import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView,Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from "../../RootLayout";
import PickerModal from '../../components/pickerModal/PickerModal';
import { router } from 'expo-router';
import { getToken } from '../../utils/secureStore';
import { Audio } from 'expo-av';
import { useRTLStyles } from '../../utils/RTLWrapper';

export default function CameraScanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [formSpinner, setFormSpinner] = useState({ status: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [drivers,setDrivers] = useState([]);
  const [showCreateDispatchedCollectionModal, setShowCreateDispatchedCollectionModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [note, setNote] = useState("");
  const rtl = useRTLStyles();
  const [manualOrderId, setManualOrderId] = useState("");
  const [selectedValue, setSelectedValue] = useState({
    toBranch: null,
    toDriver:null
  });
  const [processingBarcode, setProcessingBarcode] = useState(false);

  // Simple vibration function instead of sound to avoid file errors
  const vibrate = (pattern) => {
    if (pattern === 'success') {
      // Short vibration for success
      try {
        Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const soundObject = new Audio.Sound();
        soundObject.setOnPlaybackStatusUpdate(null);
        soundObject.loadAsync(require('../../assets/sound/success.mp3')).then(() => {
          soundObject.playAsync();
        }).catch(error => {
        });
      } catch (error) {
      }
    } else if (pattern === 'error') {
      // Longer vibration for error
      try {
        Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const soundObject = new Audio.Sound();
        soundObject.setOnPlaybackStatusUpdate(null);
        soundObject.loadAsync(require('../../assets/sound/failure.mp3')).then(() => {
          soundObject.playAsync();
        }).catch(error => {
        });
      } catch (error) {
      }
    }
  };

  const playSuccessSound = async () => {
    vibrate('success');
  };

  const playErrorSound = async () => {
    vibrate('error');
  };

  const createDispatchedCollection = async () => {

    try {
      setFormSpinner({ status: true });
      
      const ids = scannedItems || [];
      if (ids.length === 0) {
        Alert.alert(
          translations[language].errors.error,
          translations[language].camera.noItemsScanned
        );
        setFormSpinner({ status: false });
        return;
      }

      // Format orders array based on collection type
      const formattedOrders = ids.map(id => {
        const orderId = typeof id === 'object' ? id.order_id : id;
        return { order_id: orderId };
      });
      
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          'Accept-Language': language,
          // "Cookie": token ? `token=${token}` : ""
        },
        body: JSON.stringify({
          type_id: 6,
          orders: formattedOrders,
          driver_id: user?.userId,
          to_branch_id: selectedValue.toBranch?.branch_id ? selectedValue.toBranch?.branch_id : null,
          to_driver_id: selectedValue.toDriver?.user_id ? selectedValue.toDriver?.user_id : null,
          note_content: note,
          from_driver_balance: false
        })
      });
      
      const responseData = await res.json();
      if (!res.ok) {
        console.log(responseData)
        setFormSpinner({ status: false });
        Alert.alert(
          translations[language].errors.error,
          responseData.message
        );
        throw new Error(responseData.error || 'Failed to create collection');
      } else {
        router.back();
        setSuccess(true);
      }
    } catch (err) {
      setFormSpinner({ status: false });
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    setLoading(true)
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/branches?language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        }
      });
      const data = await res.json();
      setBranches(data.data);
      setLoading(false)
    } catch (err) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].camera.branchesError
      );
    }
  };

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?role_id=4,9&language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        }
      });
      const data = await res.json();
      setDrivers(data.data);
      setLoading(false)
    } catch (err) {
      Alert.alert(
        translations[language].errors.error,
        translations[language].camera.driversError
      );
    }
  };

  const branchHandler = (fieldType) => {
    setShowPickerModal(true);
    fetchBranches();
    setCurrentField(fieldType);
  };

  const driverHandler = (fieldType) => {
    setShowPickerModal(true);
    fetchDrivers();
    setCurrentField(fieldType);
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      // const token = await getToken("userToken");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}/basic_info?language_code=${language}`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          // "Cookie": token ? `token=${token}` : ""
        }
      });
      
      // Check for non-JSON responses first
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError(translations[language].camera.orderNotFoundError);
        setTimeout(() => setError(null), 2000);
        return null;
      }
      
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        setError(translations[language].camera.orderNotFoundError);
        setTimeout(() => setError(null), 2000);
        return null;
      }
      
      if (!res.ok) {
        setError(data.message || translations[language].camera.orderNotFoundError);
        setTimeout(() => setError(null), 2000);
        return null;
      }
      
      return data.data;
    } catch (err) {
      setError(translations[language].camera.orderLookupError);
      setTimeout(() => setError(null), 2000);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleManualOrderAdd = async () => {
    if (!manualOrderId.trim()) return;

    const stringifiedItem = String(manualOrderId);
    const isDuplicate = scannedItems.some(item => 
      String(item.order_id) === stringifiedItem || String(item.reference_id) === stringifiedItem
    );

    if (isDuplicate) {
      setError(translations[language].camera.scanDuplicateTextError);
      playErrorSound();
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Fetch order details
    const orderDetails = await fetchOrderDetails(manualOrderId);
    
    if (orderDetails) {
      setScannedItems(prev => [...prev, orderDetails]);
      setManualOrderId(""); // Clear input after adding
      playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    // Prevent duplicate scans by checking if we're already processing a barcode
    if (processingBarcode) return;
    
    setProcessingBarcode(true);
    
    try {
      let itemToAdd = data;
      
      if (type === 'qr') {
        try {
          // Try parsing as JSON first
          const parsedData = JSON.parse(data);
          itemToAdd = parsedData;
        } catch (parseError) {
          // If parsing fails, use the raw data
          itemToAdd = data;
        }
      }

      // Convert to string for comparison
      const stringifiedItem = String(itemToAdd);
      const isDuplicate = scannedItems.some(item => 
        String(item.order_id) === stringifiedItem || String(item.reference_id) === stringifiedItem
      );

      if (isDuplicate) {
        setError(translations[language].camera.scanDuplicateTextError);
        playErrorSound();
        setTimeout(() => setError(null), 5000);
        setProcessingBarcode(false);
        return;
      }

      // Fetch order details
      const orderDetails = await fetchOrderDetails(stringifiedItem);
      
      if (orderDetails) {
        setScannedItems(prev => [...prev, orderDetails]);
        setScanned(true);
        playSuccessSound();
      } else {
        playErrorSound();
      }
    } catch (err) {
      setError(translations[language].camera.scanInvalidTextError);
      playErrorSound();
      setTimeout(() => setError(null), 5000);
    } finally {
      // Allow new scan after a short delay
      setTimeout(() => {
        setProcessingBarcode(false);
      }, 1500);
    }
  };

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
    <>
      <View style={styles.container}>
        <CameraView
          style={[StyleSheet.absoluteFillObject, { height: '60%' }]}
          active={!showCreateDispatchedCollectionModal}
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
                  rtl.isRTL ? { right: 20 } : { left: 20 }
                ]}
                onPress={() => router.back()}
              >
                <View style={styles.backButtonCircle}>
                  <Feather 
                    name={rtl.isRTL ? "chevron-right" : "chevron-left"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
              </TouchableOpacity>
            {/* Scanner frame with animated border */}
            <View style={styles.frameBorder}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
          
            {/* Instructions text */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.scanText}>
                {!scanned && translations[language].camera.scanText}
              </Text>
              
              {error && (
                <View style={styles.errorBanner}>
                  <MaterialIcons name="error-outline" size={20} color="white" />
                  <Text style={styles.errorBannerText}>
                    {error}
                  </Text>
                </View>
              )}
              
              {(scanned && !showCreateDispatchedCollectionModal) && (
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
          </View>
        </CameraView>
      
        {showCreateDispatchedCollectionModal ? (
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader]}>
              <Text style={styles.modalTitle}>
                {translations[language].camera.createCollection}
              </Text>
              <TouchableOpacity 
                style={[styles.backButton, rtl.isRTL && { right: 16 }]} 
                onPress={() => setShowCreateDispatchedCollectionModal(false)}
              >
                <Feather 
                  name={rtl.isRTL ? "chevron-right" : "chevron-left"} 
                  size={24} 
                  color="#4361EE" 
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
            <View style={styles.modalContent}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel,{
                    ...Platform.select({
                        ios: {
                            textAlign:rtl.isRTL ? "left" : "right"
                        }
                    }),
                }]}>
                  {translations[language].camera.note}
                </Text>
                <TextInput
                  style={[styles.textInput]}
                  placeholder={translations[language].camera.notePlaceholder}
                  value={note}
                  onChangeText={(input) => setNote(input)}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel,{
                    ...Platform.select({
                        ios: {
                            textAlign:rtl.isRTL ? "left" : "right"
                        }
                    }),
                }]}>
                  {translations[language].camera.toBranch}
                </Text>
                <TouchableOpacity 
                  style={styles.pickerButton} 
                  onPress={() => branchHandler('toBranch')}
                >
                  <Text style={[
                    styles.pickerButtonText, 
                    selectedValue.toBranch?.name ? styles.pickerSelectedText : styles.pickerPlaceholderText,
                  ]}>
                    {selectedValue.toBranch?.name || translations[language].camera.selectBranch}
                  </Text>
                  <Feather name="chevron-down" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldContainer]}>
                <Text style={[styles.fieldLabel,{
                    ...Platform.select({
                        ios: {
                            textAlign:rtl.isRTL ? "left" : "right"
                        }
                    }),
                }]}>
                  {translations[language].camera.toDriver}
                </Text>
                <TouchableOpacity 
                  style={styles.pickerButton} 
                  onPress={() => driverHandler('toDriver')}
                >
                  <Text style={[
                    styles.pickerButtonText, 
                    selectedValue.toDriver?.name ? styles.pickerSelectedText : styles.pickerPlaceholderText,
                  ]}>
                    {selectedValue.toDriver?.name || translations[language].camera.selectDriver}
                  </Text>
                  <Feather name="chevron-down" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowCreateDispatchedCollectionModal(false)}
                >
                  <Text style={styles.cancelButtonText}>
                    {translations[language].camera.cancel}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmButton} 
                  onPress={createDispatchedCollection}
                  disabled={formSpinner.status}
                >
                  {formSpinner.status ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {translations[language].camera.confirm}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.scannedItemsContainer}>
            <View style={styles.scannedHeaderContainer}>
              <View style={[
                styles.scannedHeader
              ]}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>
                    {translations[language].camera.totalScanned}:
                  </Text>
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalValue}>{scannedItems.length}</Text>
                  </View>
                </View>
                
                {scannedItems.length > 0 && (
                  <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={() => setShowCreateDispatchedCollectionModal(true)}
                  >
                    <Text style={styles.nextButtonText}>
                      {translations[language].camera.next}
                    </Text>
                    <Feather 
                      name={rtl.isRTL ? "chevron-left" : "chevron-right"} 
                      size={16} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Add manual input section */}
            <View style={styles.manualInputContainer}>
              <TextInput
                style={[styles.manualInput]}
                placeholder={translations[language].camera.enterOrderId}
                value={manualOrderId}
                onChangeText={setManualOrderId}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleManualOrderAdd}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.addButtonText}>{translations[language].camera.add}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Scanned items list */}
            {scannedItems.length > 0 ? (
              <ScrollView 
                style={styles.itemsScrollView}
                contentContainerStyle={styles.itemsList}
              >
                {scannedItems.map((item, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.itemContainer
                    ]}
                  >
                    <View style={[
                      styles.itemContent
                    ]}>
                      <View style={[
                        styles.itemIconContainer
                      ]}>
                        <Feather name="package" size={16} color="#4361EE" />
                      </View>
                      <View style={[styles.itemTextContainer,{
                          ...Platform.select({
                              ios: {
                                  alignItems:rtl.isRTL ? "flex-start" : "flex-end"
                              }
                          }),
                      }]}>
                        <Text style={[styles.itemText]}>
                          {typeof item === 'object' ? item.order_id : item}
                        </Text>
                        {typeof item === 'object' && (
                          <>
                            <Text style={[styles.itemDetailText]}>
                              {item.receiver_name}
                            </Text>
                            <Text style={[styles.itemDetailText]}>
                              {item.receiver_city}{item.receiver_area ? ` - ${item.receiver_area}` : ''}{item.receiver_address ? ` - ${item.receiver_address}` : ''}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        const updatedItems = scannedItems.filter((_, i) => i !== index);
                        setScannedItems(updatedItems);
                      }}
                    >
                      <Feather name="trash-2" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="inbox" size={40} color="#94A3B8" />
                <Text style={styles.emptyText}>
                  {translations[language].camera.noItemsYet}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {showPickerModal && (
        <PickerModal
          list={currentField === "toBranch" ? branches : drivers}
          setSelectedValue={setSelectedValue}
          showPickerModal={showPickerModal}
          setShowPickerModal={setShowPickerModal}
          loading={loading}
          field={{
            name: currentField,
            label: currentField === 'toBranch' 
              ? translations[language].camera.toBranch 
              : translations[language].camera.toDriver,
            showSearchBar: true
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  frameBorder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop:-50
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4361EE',
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4361EE',
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4361EE',
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4361EE',
    borderBottomRightRadius: 12,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 70,
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
  // Scanned items container styles
  scannedItemsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    paddingBottom: 10,
  },
  scannedHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scannedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap:10
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:10
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  totalBadge: {
    backgroundColor: '#4361EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalValue: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4361EE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap:10
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
  manualInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#4361EE',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  itemsScrollView: {
    flex: 1,
  },
  itemsList: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap:10
  },
  itemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  itemDetailText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    padding: 16,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  backButton: {
    position: 'absolute',
    padding: 4,
  },
  modalContent: {
    padding: 16,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: '#1F2937',
    minHeight: 50,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  pickerButtonText: {
    fontSize: 14,
  },
  pickerPlaceholderText: {
    color: '#94A3B8',
  },
  pickerSelectedText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 'auto',
    paddingBottom: 16,
    position:"fixed"
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
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