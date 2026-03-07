import { useCallback } from "react";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../RootLayout";

export default function CreateMultipleTab() {
  const { user } = useAuth();
  useFocusEffect(
    useCallback(() => {
      if (user?.role !== "business") {
        router.replace("/(tabs)");
        return;
      }
      router.replace({ pathname: "/(create)", params: { mode: "bulk" } });
    }, [user?.role])
  );

  return null;
}
