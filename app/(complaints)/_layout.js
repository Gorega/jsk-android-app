import { Stack } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FixedHeader from "../../components/FixedHeader";

export default function RootLayout(){
    const { language } = useLanguage();
  

return <Stack>
  <Stack.Screen name="index" options={{
    title:translations[language].complaints.title,
    header:()=>{
      return <FixedHeader title={translations[language].complaints.title} />
    },
  }} />
  <Stack.Screen name="complaint" options={{
    title:translations[language].complaints.complaint,
    header:()=>{
      return <FixedHeader title={translations[language].complaints.complaint} />
    },
  }} />
  <Stack.Screen name="open_complaint" options={{
    title:translations[language].complaints.submit_complaint,
    header:()=>{
      return <FixedHeader title={translations[language].complaints.submit_complaint} />
    },
  }} />
</Stack>

}