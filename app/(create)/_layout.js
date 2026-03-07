import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { language } = useLanguage();
  const { orderId, mode } = useLocalSearchParams();
  const isBulkMode = mode === "bulk";
  const bulkTitle = translations[language]?.tabs?.createMultiple?.title || (language === "ar" ? "إنشاء عدة طلبات" : language === "he" ? "יצירת מספר הזמנות" : "Create Multiple Orders");

return <Stack>
  <Stack.Screen
    name="index"
    options={{
      title: isBulkMode ? bulkTitle : orderId ? `${translations[language].tabs.orders.create.edit} #${orderId}` : translations[language].tabs.orders.create.create,
      header:()=>{
        return <FixedHeader title={isBulkMode ? bulkTitle : orderId ? `${translations[language].tabs.orders.create.edit} #${orderId}` : translations[language].tabs.orders.create.create} />
      }
    
    }}
      
    />
</Stack>

}
