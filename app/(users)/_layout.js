import { Stack, router } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { TouchableOpacity } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FixedHeader from "../../components/FixedHeader";


export default function RootLayout(){
  const { language } = useLanguage();


return <Stack>
  <Stack.Screen
    name="index"
    options={{
      title:translations[language].users.title,
      header:()=>{
        return <FixedHeader title={translations[language].users.title}>
        <TouchableOpacity onPressIn={()=> router.push("(create_user)")}>
          <MaterialIcons name="person-add-alt-1" size={24} color="#E1251B" />
        </TouchableOpacity>
      </FixedHeader>
      }
  }} />
</Stack>

}