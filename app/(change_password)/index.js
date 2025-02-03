import { useState } from "react";
import { TextInput,View,Text,StyleSheet, TouchableOpacity } from "react-native";
import Feather from '@expo/vector-icons/Feather';

export default function HomeScreen(){

    const [currentPassword,setCurrentPassword] = useState(null);
    const [newPassword,setNewPassword] = useState(null);
    const [securePassword,setSecurePassword] = useState(true);

    return <View style={styles.container}>
        <View style={styles.inputField}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput style={styles.input} secureTextEntry={true} value={currentPassword} onChangeText={(input)=> setCurrentPassword(input)} />
            <Text style={{marginTop:7,fontSize:12}}>Enter your current password used for login</Text>
        </View>
        <View style={styles.inputField}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={[styles.input,{padding:0,paddingHorizontal:10,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}]}>
                <TextInput style={{width:"90%"}} secureTextEntry={securePassword} value={newPassword} onChangeText={(input)=> setNewPassword(input)} />
                <TouchableOpacity onPress={()=> setSecurePassword(!securePassword)}>
                    {securePassword ? <Feather name="eye-off" size={20} color="black" /> : <Feather name="eye" size={24} color="black" />}
                </TouchableOpacity>
            </View>
        </View>
        <TouchableOpacity style={[styles.submit, (currentPassword && newPassword) && styles.activeSubmit]}>
            <Text style={{textAlign:"center",fontWeight:"600",color:(currentPassword && newPassword) ? "white" : "#ffffff"}}>Change Password</Text>
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
        textAlign:"left"
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