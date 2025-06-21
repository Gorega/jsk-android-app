import { Stack, router } from "expo-router";
import FixedHeader from "../../components/FixedHeader";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import { TouchableOpacity, Text, Alert } from "react-native";
import { useAuth } from "../../RootLayout";
import { useState, useCallback } from "react";

export default function RootLayout() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Create a function to immediately update notifications
  const refreshNotifications = useCallback(() => {
    const newKey = refreshKey + 1;
    setRefreshKey(newKey);
    
    // Force an immediate refresh by navigating to the same screen with updated params
    router.setParams({ refreshKey: newKey.toString() });
  }, [refreshKey]);

  const handleDeleteAll = async () => {
    Alert.alert(
      translations[language]?.notifications?.deleteAll,
      translations[language]?.notifications?.deleteAllConfirm,
      [
        {
          text: translations[language]?.notifications?.confirmation?.cancel,
          style: "cancel"
        },
        {
          text: translations[language]?.notifications?.deleteAll,
          style: "destructive",
          onPress: async () => {
            try {
              // Set notifications to empty array immediately for instant UI feedback
              refreshNotifications();
              
              const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/all`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                  'Accept': 'application/json',
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  user_id: user.userId
                })
              });

              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              
              // We've already refreshed the UI, so no need to do it again
            } catch (error) {
              console.error("Failed to delete all notifications:", error);
              // If there was an error, refresh again to show correct state
              refreshNotifications();
            }
          }
        }
      ]
    );
  };

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: translations[language].notifications?.title,
          header: () => {
            return (
              <FixedHeader title={translations[language].notifications?.title}>
                <TouchableOpacity 
                  onPress={handleDeleteAll}
                  style={{
                    backgroundColor: "#FF6B6B",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "500" }}>
                    {translations[language]?.notifications?.deleteAll || "Delete All"}
                  </Text>
                </TouchableOpacity>
              </FixedHeader>
            );
          },
        }} 
        initialParams={{ refreshKey: refreshKey.toString() }}
      />
    </Stack>
  );
}