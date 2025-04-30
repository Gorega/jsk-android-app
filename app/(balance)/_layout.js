import { Stack } from "expo-router";
import React from "react";
import { useLanguage } from "../../utils/languageContext";
import { translations } from "../../utils/languageContext";
import FixedHeader from "../../components/FixedHeader";

export default function BalanceLayout() {
  const { language } = useLanguage();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerTintColor: "#1F2937",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title:`${translations[language].balance.balanceHistory}`,
          header:()=>{
            return <FixedHeader title={translations[language].balance.balanceHistory} />
          }, 
        }}
      />
    </Stack>
  );
}