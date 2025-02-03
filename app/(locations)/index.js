import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

export default function HomeScreen() {
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsMapReady(true), 500); // Delay for rendering
    }, []);

  return <View style={styles.container}>
  {isMapReady ? <MapView
    key={Math.random()}
    provider={PROVIDER_GOOGLE}
    style={styles.map}
    initialRegion={{
      latitude: 32.0643,
      longitude: 35.2137,
      latitudeDelta: 1,
      longitudeDelta: 1,
    }}
  >
    {/* Markers */}
    <Marker
      coordinate={{ latitude: 32.3104, longitude: 35.0282 }} // Tulkarm
      title="Tulkarm"
      description="The main location hub"
      pinColor="#F8C332"
    />
    <Marker
      coordinate={{ latitude: 31.5326, longitude: 35.0998 }} // Hebron
      title="Hebron"
      description="Delivery hub in Hebron"
      pinColor="#F8C332"
    />
    <Marker
      coordinate={{ latitude: 31.9522, longitude: 35.2332 }} // Ramallah
      title="Ramallah"
      description="Delivery hub in Ramallah"
      pinColor="#F8C332"
    />
    <Marker
      coordinate={{ latitude: 32.4620, longitude: 35.2958 }} // Jenin
      title="Jenin"
      description="Delivery hub in Jenin"
      pinColor="#F8C332"
    />
  </MapView> : <ActivityIndicator size="50" color="#F8C332" />}
</View>
}

const styles = StyleSheet.create({
  container: { flex: 1,justifyContent:"center",alignItems:"center" },
  map: { width: "100%", height: "100%" },
});
