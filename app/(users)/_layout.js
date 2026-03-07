import { Stack, router } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { TouchableOpacity } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FixedHeader from "../../components/FixedHeader";
import { useAuth } from "../../RootLayout";


export default function RootLayout(){
  const { language } = useLanguage();
  const { user } = useAuth();
  const canManageUsers = ["admin", "manager", "business"].includes(user?.role);


return <Stack>
  <Stack.Screen
    name="index"
    options={{
      title:translations[language].users.title,
      header:()=>{
        return <FixedHeader title={translations[language].users.title}>
        {canManageUsers ? (
          <TouchableOpacity onPressIn={()=> router.push("(create_user)")}>
            <MaterialIcons name="person-add-alt-1" size={24} color="#4361EE" />
          </TouchableOpacity>
        ) : null}
      </FixedHeader>
      }
  }} />
</Stack>

}
