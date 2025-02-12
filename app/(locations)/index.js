import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { translations } from "../../utils/languageContext";
import { useLanguage } from "../../utils/languageContext";

export default function HomeScreen() {
  const [isMapReady, setIsMapReady] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    setTimeout(() => setIsMapReady(true), 500); // Delay for rendering
  }, [language]);

  // Map language mapping
  const googleMapLanguage = {
    en: "en",
    ar: "ar",
    he: "iw", // Hebrew uses "iw" instead of "he" in Google Maps
  }[language] || "en"; // Default to English if the language is not found

  return (
    <View style={styles.container}>
      {isMapReady ? (
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
          locale={googleMapLanguage} // Forces Google Maps UI to use the selected language
        >
          {/* Markers */}
          <Marker
            coordinate={{ latitude: 32.3104, longitude: 35.0282 }} // Tulkarm
            title={translations[language].locations.tulkarm.title}
            description={translations[language].locations.tulkarm.desc}
            pinColor="#F8C332"
          />
          <Marker
            coordinate={{ latitude: 31.5326, longitude: 35.0998 }} // Hebron
            title={translations[language].locations.hebron.title}
            description={translations[language].locations.hebron.desc}
            pinColor="#F8C332"
          />
          <Marker
            coordinate={{ latitude: 31.9522, longitude: 35.2332 }} // Ramallah
            title={translations[language].locations.ramallah.title}
            description={translations[language].locations.ramallah.desc}
            pinColor="#F8C332"
          />
          <Marker
            coordinate={{ latitude: 32.462, longitude: 35.2958 }} // Jenin
            title={translations[language].locations.jenin.title}
            description={translations[language].locations.jenin.desc}
            pinColor="#F8C332"
          />
        </MapView>
      ) : (
        <ActivityIndicator size="large" color="#F8C332" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
});
