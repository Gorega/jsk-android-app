import { Stack } from "expo-router";
import { useLanguage } from "../../utils/languageContext";
import { RTLWrapper } from "../../utils/RTLWrapper";
import { useTheme } from "../../utils/themeContext";
import { Colors } from "@/constants/Colors";
import FixedHeader from "../../components/FixedHeader";

export default function Layout() {
  const { language } = useLanguage();
  const translations = require("../../utils/languageContext").translations;
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  return (
    <RTLWrapper>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          animation: "slide_from_right",
        }}
      >
         <Stack.Screen
          name="index"
          options={{
            title:translations[language]?.driverStats?.title,
            header:()=>{
              return <FixedHeader title={translations[language]?.driverStats?.title} />
            }, 
            }} />
      </Stack>
    </RTLWrapper>
  );
} 