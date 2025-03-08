import { Stack } from "expo-router";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { language } = useLanguage();

return <Stack>
  <Stack.Screen name="index" options={
    {title:translations[language].tabs.orders.track.orderTracking,
    header:()=>{
      return <FixedHeader title={translations[language].tabs.orders.track.orderTracking} />
    },
    }} />
</Stack>

}