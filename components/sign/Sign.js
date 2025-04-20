import { View,Text, TouchableOpacity,StyleSheet,Image, ScrollView } from "react-native";
import TayarLogo from "../../assets/images/tayar_logo.png";
import Field from "./Field";

export default function Sign({fields,submit,children,setSelectedValue,error}){

    return <View style={styles.container}>
            <Image style={styles.logo} source={TayarLogo} />
            <View style={styles.main}>
                <ScrollView style={{height:"60%"}} showsVerticalScrollIndicator={false}>
                    {error && (
                        <Text style={styles.errorMessage}>{error}</Text>
                    )}
                    {fields?.map((field,index)=>{
                        return <Field key={index} field={field} setSelectedValue={setSelectedValue} />
                    })}
                </ScrollView>
            </View>
            <TouchableOpacity style={styles.button} onPress={submit.action}>
                <Text style={styles.buttonText}>{submit.label}</Text>
            </TouchableOpacity>
        {children}
</View>

}


const styles = StyleSheet.create({
    container:{
        padding:15,
        justifyContent:"center",
        alignItems:"center",
        backgroundColor:"white",
        width:"100%",
        flex:1
    },
    label:{
        fontSize:22,
        fontWeight:600
    },
    main:{
        width:"80%",
    },
    logo:{
        width:120,
        height:120,
        margin:"auto",
        marginBottom:40,
    },
    form:{
        textAlign:"center",
    },
    button:{
        marginBottom:15,
        backgroundColor:"#F8C332",
        textAlign:"center",
        width:"100%",
        height:40,
        justifyContent:"center",
        alignItems:"center"
    },
    buttonText:{
        color:"white",
        fontWeight:"600",
    },
    errorMessage: {
        color: "red",
        textAlign: "center",
        marginBottom: 10
    }
})