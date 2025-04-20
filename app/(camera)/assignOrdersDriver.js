import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity,TextInput, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useAuth} from "../_layout";
import PickerModal from '../../components/pickerModal/PickerModal';
import { router } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function CameraScanner() {
  const {user,setTrackChanges} = useAuth();
  const { language } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);
  const [formSpinner,setFormSpinner] = useState({status:false});
  const [success,setSuccess] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [branches,setBranches] = useState([]);
  const [showCreateDispatchedCollectionModal,setShowCreateDispatchedCollectionModal] = useState(false);
  const [showPickerModal,setShowPickerModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [note,setNote] = useState("");
  const [manualOrderId, setManualOrderId] = useState("");
  const [selectedValue,setSelectedValue] = useState({
    fromBranch:"",
    toBranch:""
  });

  const createDispatchedCollection = async ()=>{
        try{
          setFormSpinner({status: true});
          
          const ids = scannedItems || [];
          // Format orders array based on collection type
          const formattedOrders = ids.map(id => ({ order_id: id }));

          const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections`,{
          method:"POST",
          credentials:"include",
          headers: {
              "Content-Type": "application/json",
              'Accept-Language': language
          },
          body:JSON.stringify({
              type_id: 4,
              orders: formattedOrders,
              driver_id:user?.userId,
              to_branch_id:selectedValue.toBranch?.branch_id,
              note_content:note
            })
      })
      const responseData = await res.json();
      if (!res.ok) {
          setFormSpinner({status:false})
          Alert.alert(
            translations[language].errors.error,
            responseData.message
          )
          throw new Error(responseData.error || 'Failed to create collection');
      }else{
        router.back();
        setTrackChanges({type:"COLLECTION_CREATED"})
        setSuccess(true);
      }
      }catch(err){
          setFormSpinner({status:false})
          console.log(err)
      }finally {
        setLoading(false);
    }
  }

  const fetchBranches = async () => {
    try{
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/branches?language_code=${language}`,{
        method:"GET",
        credentials:"include",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
          }
      })
      const data = await res.json();
      setBranches(data.data)
    }catch(err){
    }
};

const branchHandler = (fieldType)=>{
  setShowPickerModal(true)
  fetchBranches();
  setCurrentField(fieldType);
}

const handleManualOrderAdd = () => {
  if (!manualOrderId.trim()) return;

  const stringifiedItem = String(manualOrderId);
  const isDuplicate = scannedItems.some(item => String(item) === stringifiedItem);

  if (!isDuplicate) {
    setScannedItems(prev => [...prev, manualOrderId]);
    setManualOrderId(""); // Clear input after adding
  } else {
    setError(translations[language].camera.scanDuplicateTextError);
    setTimeout(() => setError(null), 2000);
  }
};

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
    try {
      let itemToAdd;
      if (type === 'qr') {
        // For QR codes, try to parse and get order_id
        const parsedData = JSON.parse(data);
        itemToAdd = parsedData.order_id;
      } else {
        // For barcodes, use the raw data
        itemToAdd = data;
      }

      // // validate scanned order
      // fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/collections/4/validate?order_ids=${itemToAdd}`,{credentials:"include"})
      // .then(async (res)=>{
      //     const data = await res.json();
      //     if(data.error){
      //       setError('This order already picked up by other driver');
      //     }else{
            
      //     }
      // })

      // Convert both the new item and existing items to strings for comparison
      const stringifiedItem = String(itemToAdd);
      const isDuplicate = scannedItems.some(item => String(item) === stringifiedItem);

      if (!isDuplicate) {
        setScannedItems(prev => [...prev, itemToAdd]);
        setScanned(true);
      } else {
        setError(translations[language].camera.scanDuplicateTextError);
        // Clear error after 2 seconds
        setTimeout(() => setError(null), 2000);
      }
    } catch (err) {
      console.error('Error processing scan:', err);
      setError(translations[language].camera.scanInvalidTextError);
      // Clear error after 2 seconds
      setTimeout(() => setError(null), 2000);
    }
  };


  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>{translations[language].camera.permission.request}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
      <CameraView
        style={[StyleSheet.absoluteFillObject, { height: '70%' }]}
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
          <View style={styles.border} />
          <Text style={styles.scanText}>
            {!scanned && translations[language].camera.scanText}
          </Text>
          {error && (
            <Text style={{color:"red",fontWeight:"500"}}>{error}</Text>
          )}
          {(scanned && !showCreateDispatchedCollectionModal) && (
            <Text
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              {translations[language].camera.scanAgainTapText}
            </Text>
          )}
        </View>
      </CameraView>
      
      {showCreateDispatchedCollectionModal
      ?
      <View style={styles.scannedItemsContainer}>
          <TouchableOpacity style={{marginBottom:10,transform:["he", "ar"].includes(language) ? [{ scaleX: -1 }] : [],flexDirection:["ar","he"].includes(language) ? "row" : "row-reverse"}} onPress={()=> setShowCreateDispatchedCollectionModal(false)}>
            <MaterialIcons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={translations[language].camera.note}
            value={note}
            onChangeText={(input)=> setNote(input)}
          />
          <TouchableOpacity style={styles.pickerBox} onPress={()=> branchHandler('toBranch')}>
            <Text style={{textAlign:["ar","he"].includes(language) ? "right" : "left"}}>{selectedValue.toBranch.name ? selectedValue.toBranch.name : translations[language].camera.toBranch}</Text>
          </TouchableOpacity>
          <View style={[styles.submit,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
            <TouchableOpacity onPress={createDispatchedCollection}>
              <Text style={{color:"#F8C332"}}>{translations[language].camera.confirm}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=> router.back()}>
              <Text>{translations[language].camera.cancel}</Text>
            </TouchableOpacity>
          </View>
      </View>
      :
      <View style={styles.scannedItemsContainer}>
        <View style={{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row",alignItems:"center",justifyContent:"space-between"}}>
          <Text style={styles.totalText}>
          {translations[language].camera.totalScanned}: {scannedItems.length}
          </Text>
          {scannedItems.length > 0 && <TouchableOpacity style={{padding:0,margin:0}} onPress={()=> setShowCreateDispatchedCollectionModal(true)}>
            <AntDesign name="checkcircleo" size={26} color="#F8C332" />
          </TouchableOpacity>}
        </View>
        {/* Add manual input section */}
        <View style={[styles.manualInputContainer,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
          <TextInput
            style={[styles.manualInput,{textAlign:["ar","he"].includes(language) ? "right" : "left"}]}
            placeholder={translations[language].camera.enterOrderId}
            value={manualOrderId}
            onChangeText={setManualOrderId}
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleManualOrderAdd}
          >
            <Text style={styles.addButtonText}>{translations[language].camera.add}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.itemsList}>
          {scannedItems.map((item, index) => (
            <View key={index} style={[styles.itemText,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
              <Text>
              {item}
              </Text>
              <TouchableOpacity onPress={()=> {
                const updatedItems = scannedItems.filter((_, i) => i !== index);
                setScannedItems(updatedItems);
              }}>
                <AntDesign name="delete" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
      }
    </View>

    {showPickerModal
    &&
    <PickerModal
        list={branches}
        setSelectedValue={setSelectedValue}
        showPickerModal={showPickerModal}
        setShowPickerModal={setShowPickerModal}
        field={{
            name: currentField,
            label: currentField === 'fromBranch' ? translations[language].camera.fromBranch : translations[language].camera.toBranch,
            showSearchBar: false
        }}
    />}
    </>
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
    backgroundColor: '#F8C332',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    marginTop: 15,
  },
  scannedItemsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 15,
    height: '40%',
    boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color:"#F8C332",
  },
  itemsList: {
    flexGrow: 1,
    marginTop:15
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
    borderWidth:1,
    borderColor:"rgba(0,0,0,.1)",
    padding:15,
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between"
  },
  pickerBox:{
    marginBottom:15,
    borderWidth:1,
    borderColor:"rgba(0,0,0,.1)",
    padding:15
  },
  input:{
    borderBottomColor:"rgba(0,0,0,.1)",
    borderBottomWidth:1,
    marginBottom:15
  },
  submit:{
    flexDirection:"row",
    justifyContent:"flex-end",
    gap:25,
    marginTop:2
  },
  manualInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
    marginTop:10
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,.1)',
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#F8C332',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});
