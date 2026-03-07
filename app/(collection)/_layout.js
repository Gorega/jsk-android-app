import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { type } = useLocalSearchParams();
  const { language } = useLanguage();

return <Stack>
  <Stack.Screen
    name="index"
    options={{
      title:`${type} ${translations[language].collections.title}`,
      header:()=>{
        return <FixedHeader title={translations[language].tabs.collections.title} />
      }, 
    }} />
</Stack>

}