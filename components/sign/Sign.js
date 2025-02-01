import { View,Text, TouchableOpacity,StyleSheet,Image, ScrollView } from "react-native";
import TayarLogo from "../../assets/images/tayar_logo.png";
import Field from "./Field";

export default function Sign({fields,submit,children,setSelectedValue}){

    return <View style={styles.container}>
        <View style={styles.main}>
            <Image style={styles.logo} source={TayarLogo} />
            <ScrollView>
                <View style={styles.form}>
                    {fields?.map((field,index)=>{
                        return <Field key={index} field={field} setSelectedValue={setSelectedValue} />
                    })}
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.button} onPress={submit.action}>
                <Text style={styles.buttonText}>{submit.label}</Text>
            </TouchableOpacity>
        </View>
        {children}
</View>

}


const styles = StyleSheet.create({
    container:{
        padding:15,
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        backgroundColor:"white",
        height:"100%",
        width:"100%",
    },
    header:{
        position:"absolute",
        top:50,
        width:"100%",
        display:"flex",
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center"
    },
    label:{
        fontSize:22,
        fontWeight:600
    },
    main:{
        width:"80%",
        height:"75%"
    },
    logo:{
        width:120,
        height:120,
        margin:"auto",
        marginBottom:40
    },
    form:{
        height:"100%",
        textAlign:"center"
    },
    button:{
        marginTop:15,
        backgroundColor:"#F8C332",
        textAlign:"center",
        width:"100%",
        height:40,
        display:"flex",
        justifyContent:"center",
        alignItems:"center"
    },
    buttonText:{
        color:"black",
        fontWeight:600,
    }
})