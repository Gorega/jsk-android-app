import { TouchableOpacity,Text, View } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLanguage } from '../utils/languageContext';
import { router } from "expo-router";
import { useRTLStyles } from "../utils/RTLWrapper";

export default function FixedHeader({children,title,showBackButton=true}){
    const { language } = useLanguage();
    const rtl = useRTLStyles();

    return <View style={{
        height:100,
        backgroundColor:"white",
        boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
        flexDirection:"row",
        alignItems:"flex-end",
        justifyContent:"space-between",
        padding:15,
      }}>
    <View style={{flexDirection:"row",alignItems:"center",gap:15}}>
      {showBackButton && <TouchableOpacity onPressIn={()=> router.back()}>
        <MaterialIcons name={rtl.isRTL ? "arrow-forward" : "arrow-back"} size={24} color="black" />
      </TouchableOpacity>}
      <Text style={{fontSize:18,fontWeight:"500"}}>{title}</Text>
    </View>
      {children}
  </View>
}
