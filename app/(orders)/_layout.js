import { Stack } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function OrdersLayout(){
  const { language } = useLanguage();

  return (
    <Stack>
      <Stack.Screen
        name="readyOrders"
        options={{
          title: translations[language]?.common?.readyOrders || 'Ready Orders',
          header: () => (
            <FixedHeader title={translations[language]?.common?.readyOrders || 'Ready Orders'} />
          )
        }}
      />
    </Stack>
  );
}
