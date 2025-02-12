import { useState } from "react";
import { StyleSheet,TextInput,Text, Pressable } from "react-native";
import PickerModal from "../pickerModal/PickerModal"
import { useLanguage } from '../../utils/languageContext';

export default function Field({field,setSelectedValue}){
    const [showPickerModal,setShowPickerModal] = useState(false);
    const { language } = useLanguage();

    return <>
        {field.type === "input"
        ?
        <TextInput
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
            placeholder={field.label}
        />
        :
        <Pressable onPress={()=> setShowPickerModal(true)} value={field.value}>
            <Text style={[styles.input,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{field.value ? field.value : field.label}</Text>
        </Pressable>
        }

        {showPickerModal && <PickerModal
            list={field.list}
            showPickerModal={showPickerModal}
            setShowPickerModal={()=> setShowPickerModal(false)}
            setSelectedValue={setSelectedValue}
            field={field}
        />}
    </>

}

const styles = StyleSheet.create({
    input:{
        borderBlockColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
        marginBottom:25,
        paddingHorizontal:7,
        paddingVertical:15,
        width:"100%"
    }
})