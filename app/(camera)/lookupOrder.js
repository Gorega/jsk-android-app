import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from "expo-router";


export default function CameraScanner() {
  const { language } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await requestPermission();
      console.log("Camera permission status:", status);
      if (status !== 'granted') {
        setError(translations[language].camera.permission.notGranted);
      }
    };

    if (!permission) {
      requestCameraPermission();
    }
  }, [requestPermission, permission]);

  const handleBarCodeScanned = ({ type, data }) => {
    const parsedData = JSON.parse(data);
    setScanned(true);
    router.push({pathname:"/(tabs)/orders",params:{orderId:type === "code128" ? data : parsedData.order_id}})
  };


  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>{translations[language].camera.permission.request}</Text>
      </View>
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
          <View style={styles.border} />
          <Text style={styles.scanText}>
            {translations[language].camera.scanText}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  border: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: '#F8C332',
    borderRadius: 10,
  },
  rescanButton: {
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    marginTop: 15,
  },
});
