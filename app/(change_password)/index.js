import { useState } from "react";
import { TextInput,View,Text,StyleSheet, TouchableOpacity } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function HomeScreen(){
    
    const { language } = useLanguage();
    const [currentPassword,setCurrentPassword] = useState(null);
    const [newPassword,setNewPassword] = useState(null);
    const [securePassword,setSecurePassword] = useState(true);

    return <View style={styles.container}>
        <View style={styles.inputField}>
            <Text style={[styles.inputLabel,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].chnagePassword.currentPass}</Text>
            <TextInput style={[styles.input,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]} secureTextEntry={true} value={currentPassword} onChangeText={(input)=> setCurrentPassword(input)} />
            <Text style={{marginTop:7,fontSize:12,textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{translations[language].chnagePassword.currentPassHint}</Text>
        </View>
        <View style={styles.inputField}>
            <Text style={[styles.inputLabel,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].chnagePassword.newPass}</Text>
            <View style={[styles.input,{padding:0,paddingHorizontal:10,flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",justifyContent:"space-between",alignItems:"center"}]}>
                <TextInput style={{width:"90%",textAlign:["he", "ar"].includes(language) ? "right" : "left"}} secureTextEntry={securePassword} value={newPassword} onChangeText={(input)=> setNewPassword(input)} />
                <TouchableOpacity onPress={()=> setSecurePassword(!securePassword)}>
                    {securePassword ? <Feather name="eye-off" size={20} color="black" /> : <Feather name="eye" size={24} color="black" />}
                </TouchableOpacity>
            </View>
        </View>
        <TouchableOpacity style={[styles.submit, (currentPassword && newPassword) && styles.activeSubmit]}>
            <Text style={{textAlign:"center",fontWeight:"600",color:(currentPassword && newPassword) ? "white" : "#ffffff"}}>{translations[language].chnagePassword.changePass}</Text>
        </TouchableOpacity>
    </View>
}

const styles = StyleSheet.create({
    container:{
        backgroundColor:"white",
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        padding:15,
        height:"100%",
        paddingTop:40
    },
    inputLabel:{
        fontWeight:"600"
    },
    input:{
        borderWidth:1,
        borderColor:"rgba(0,0,0,.1)",
        marginTop:10,
        padding:10,
    },
    inputField:{
        marginBottom:40
    },
    submit:{
        textAlign:"center",
        backgroundColor:"rgba(248, 195, 50, 0.4)",
        padding:15
    },
    activeSubmit:{
        backgroundColor:"#F8C332"
    }
})