import { Stack } from "expo-router";
import FixedHeader from "../../components/FixedHeader";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';

export default function RootLayout(){
  const { language } = useLanguage();

return <Stack>
  <Stack.Screen name="index" options={{
    title:translations[language].notifications?.title,
    header:()=>{
        return <FixedHeader title={translations[language].notifications?.title} />
      },
    }} />
</Stack>

}