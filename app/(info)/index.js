import { View,StyleSheet,Text } from "react-native";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function HomeScreen(){
    const { language } = useLanguage();

    return <View style={styles.container}>
        <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].about.aboutLabel}</Text>
        <Text style={[styles.desc,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>
            {translations[language].about.aboutDesc}
        </Text>
    </View>
}

const styles = StyleSheet.create({
    container:{
        height:"100%",
        backgroundColor:"white",
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        padding:15,
        paddingTop:25
    },
    h2:{
        fontWeight:"600",
        fontSize:17,
        marginBottom:10,
        color:"#F8C332"
    },
    desc:{
        lineHeight:20,
    }
})