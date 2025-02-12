import { TouchableOpacity,Text, View } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLanguage } from '../utils/languageContext';
import { router } from "expo-router";

export default function FixedHeader({children,title,showBackButton=true}){
    const { language } = useLanguage();

    return <View style={{
        height:80,
        backgroundColor:"white",
        boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
        flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",
        alignItems:"flex-end",
        justifyContent:"space-between",
        padding:15
      }}>
    <View style={{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",alignItems:"center",gap:15}}>
      {showBackButton && <TouchableOpacity onPressIn={()=> router.back()}>
        <MaterialIcons style={{transform:["he", "ar"].includes(language) ? [{ scaleX: -1 }] : []}} name="arrow-back" size={24} color="black" />
      </TouchableOpacity>}
      <Text style={{fontSize:18,fontWeight:"500"}}>{title}</Text>
    </View>
      {children}
  </View>
}