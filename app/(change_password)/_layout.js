import { Stack, useLocalSearchParams } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const userIdParam = Array.isArray(params?.userId) ? params.userId[0] : params?.userId;
  const title = userIdParam ? `${translations[language].chnagePassword.title} #${userIdParam}` : translations[language].chnagePassword.title;


return <Stack>
  <Stack.Screen
    name="index"
    options={{
      title,
      header:()=>{
        return <FixedHeader title={title} />
      }, 
      }} />
</Stack>

}
