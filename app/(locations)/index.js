import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Dimensions, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import { translations } from "../../utils/languageContext";
import { useLanguage } from "../../utils/languageContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HomeScreen() {
  const [isMapReady, setIsMapReady] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === 'ar' || language === 'he';
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapType, setMapType] = useState('standard');

  useEffect(() => {
    setTimeout(() => setIsMapReady(true), 500); // Delay for rendering
  }, [language]);

  // Map language mapping
  const googleMapLanguage = {
    en: "en",
    ar: "ar",
    he: "iw", // Hebrew uses "iw" instead of "he" in Google Maps
  }[language] || "en"; // Default to English if the language is not found

  // Our office locations
  const locations = [
    {
      id: 'tulkarm',
      coordinate: { latitude: 32.3104, longitude: 35.0282 },
      title: translations[language].locations.tulkarm.title,
      description: translations[language].locations.tulkarm.desc,
      phone: '+970593686817',
      email: 'tulkarm@tayar.com',
      color: '#4361EE'
    },
    {
      id: 'hebron',
      coordinate: { latitude: 31.5326, longitude: 35.0998 },
      title: translations[language].locations.hebron.title,
      description: translations[language].locations.hebron.desc,
      phone: '+970593686818',
      email: 'hebron@tayar.com',
      color: '#4361EE'
    },
    {
      id: 'ramallah',
      coordinate: { latitude: 31.9522, longitude: 35.2332 },
      title: translations[language].locations.ramallah.title,
      description: translations[language].locations.ramallah.desc,
      phone: '+970593686819',
      email: 'ramallah@tayar.com',
      color: '#4361EE'
    },
    {
      id: 'jenin',
      coordinate: { latitude: 32.462, longitude: 35.2958 },
      title: translations[language].locations.jenin.title,
      description: translations[language].locations.jenin.desc,
      phone: '+970593686820',
      email: 'jenin@tayar.com',
      color: '#4361EE'
    }
  ];

  const renderLocationDetails = () => {
    if (!selectedLocation) return null;
    
    const location = locations.find(loc => loc.id === selectedLocation);
    if (!location) return null;

    return (
      <View style={styles.locationDetails}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationTitle}>{location.title}</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedLocation(null)}
          >
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.locationDescription}>{location.description}</Text>
        
        <View style={styles.contactInfo}>
          <View style={[
            styles.contactItem,
            { flexDirection: isRTL ? 'row-reverse' : 'row' }
          ]}>
            <MaterialIcons name="phone" size={20} color="#4361EE" />
            <Text style={[
              styles.contactText,
              { textAlign: isRTL ? 'right' : 'left' }
            ]}>
              {location.phone}
            </Text>
          </View>
          
          <View style={[
            styles.contactItem,
            { flexDirection: isRTL ? 'row-reverse' : 'row' }
          ]}>
            <MaterialIcons name="email" size={20} color="#4361EE" />
            <Text style={[
              styles.contactText,
              { textAlign: isRTL ? 'right' : 'left' }
            ]}>
              {location.email}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isMapReady ? (
        <>
          <MapView
            key={language} // Forces map re-render when language changes
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: 32.0643,
              longitude: 35.2137,
              latitudeDelta: 1,
              longitudeDelta: 1,
            }}
            mapType={mapType}
            showsUserLocation={true}
            showsMyLocationButton={true}
            locale={googleMapLanguage} // Forces Google Maps UI to use the selected language
          >
            {locations.map((marker, index) => (
              <Marker
                key={index}
                coordinate={marker.coordinate}
                title={marker.title}
                description={marker.description}
                pinColor="#4361EE"
                onPress={() => setSelectedLocation(marker.id)}
              >
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{marker.title}</Text>
                    <Text style={styles.calloutDescription}>{marker.description}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
          
          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={styles.mapControlButton}
              onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
            >
              <MaterialIcons 
                name={mapType === 'standard' ? 'satellite' : 'map'} 
                size={24} 
                color="#1E293B" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Back Button */}
          <TouchableOpacity 
            style={[
              styles.backButton,
              isRTL ? { left: 16 } : { right: 16 }
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-circle" size={36} color="#4361EE" />
          </TouchableOpacity>
          
          {/* Location Details */}
          {renderLocationDetails()}
          
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>
            {translations[language]?.locations?.loading || "Loading map..."}
          </Text>
        </View>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC",
  },
  map: { 
    width: "100%", 
    height: "100%" 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    color: "#64748B",
  },
  mapControls: {
    position: 'absolute',
    top: Platform.select({ ios: 48, android: 16 }),
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.select({ ios: 48, android: 16 }),
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  locationDetails: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#64748B',
  },
});
