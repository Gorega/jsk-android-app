import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await requestPermission();
      console.log("Camera permission status:", status);
      if (status !== 'granted') {
        setError('Camera permission not granted');
      }
    };

    if (!permission) {
      requestCameraPermission();
    }
  }, [requestPermission, permission]);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
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
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing='back'
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
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
          {scanned ? 'Tap to Scan Again' : 'Position barcode within frame'}
          </Text>
          {scanned && (
            <Text
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              Tap to Scan Again
            </Text>
          )}
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
    borderWidth: 2,
    borderColor: 'white',
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
