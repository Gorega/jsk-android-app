import { Stack } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { language } = useLanguage();

return <Stack>
  <Stack.Screen
   name="index"
  options={{
    title:translations[language].locations.title,
    header:()=>{
      return <FixedHeader title={translations[language].locations.title} />
    },
    }} />
</Stack>

}