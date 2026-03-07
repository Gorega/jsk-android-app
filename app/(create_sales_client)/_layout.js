import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { language } = useLanguage();
  const { clientId } = useLocalSearchParams();

return <Stack>
  <Stack.Screen
  name="index"
  options={{
    title: clientId ? `${translations[language].users.create.edit} #${clientId}` : `${translations[language].users.create.create}`,
    header:()=>{
      return <FixedHeader title={clientId ? `${translations[language].users.create.edit} #${clientId}` : `${translations[language].users.create.create}`} />
    }
    
    }} />
</Stack>

}