import { Stack, router } from "expo-router";
import { TouchableOpacity } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function RootLayout(){

return <Stack>
  <Stack.Screen name="index" options={{title:"Users",headerRight:()=>{
    return <TouchableOpacity onPressIn={()=> router.push("(create_user)")}>
        <MaterialIcons name="person-add-alt-1" size={24} color="#F8C332" />
    </TouchableOpacity>
  }}} />
</Stack>

}