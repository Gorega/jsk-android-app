import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { language } = useLanguage();
  const { orderId } = useLocalSearchParams();

  return <Stack>
    <Stack.Screen
      name="index"
      options={{
        title: `${translations[language].tabs.orders.order.editPhone || "Edit Receiver Phone"} #${orderId}`,
        header:()=>{
          return <FixedHeader title={`${translations[language].tabs.orders.order.editPhone || "Edit Receiver Phone"} #${orderId}`} />
        }
      }}
    />
  </Stack>
}