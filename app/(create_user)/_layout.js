import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { language } = useLanguage();
  const { userId } = useLocalSearchParams();

return <Stack>
  <Stack.Screen
  name="index"
  options={{
    title: userId ? `${translations[language].users.create.edit} #${userId}` : `${translations[language].users.create.create}`,
    header:()=>{
      return <FixedHeader title={userId ? `${translations[language].users.create.edit} #${userId}` : `${translations[language].users.create.create}`} />
    }
    
    }} />
</Stack>

}