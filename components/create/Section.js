import { View,Text,StyleSheet, Pressable } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import Field from "./Field";
import { useLanguage } from '../../utils/languageContext';

export default function Section({section,setSelectedValue,loadMoreData,loadingMore,prickerSearchValue,setPickerSearchValue,fieldErrors,setFieldErrors}){
    const [showFields,setShowFields] = useState(true);
    const { language } = useLanguage();


    return <View style={[styles.section,{display:section.visibility === "hidden" && "none"}]}>
    <Pressable onPress={()=> setShowFields(!showFields)}>
        <View style={[styles.label,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={{alignItems:"center",gap:7,flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}}>
                {section.icon}
                <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{section.label}</Text>
            </View>
            <MaterialIcons style={showFields && styles.activeSection} name="arrow-right" size={24} color="#F8C332" />
        </View>
    </Pressable>
    {showFields && <View style={styles.fields}>
        {section?.fields?.flat().map((field,index) => (
            <Field
                field={field}
                key={index}
                setSelectedValue={setSelectedValue}
                loadMoreData={loadMoreData}
                loadingMore={loadingMore}
                prickerSearchValue={prickerSearchValue}
                setPickerSearchValue={setPickerSearchValue}
                error={fieldErrors?.[field.name]}
                setFieldErrors={setFieldErrors}
            />
        ))}
    </View>}
</View>
}

const styles = StyleSheet.create({
    section:{
        marginBottom:25,
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        backgroundColor:"white",
        padding:10,
    },
    fields:{
        marginTop:25,
        gap:20
    },
    label:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
    },
    activeSection:{
        transform:"rotate(90deg)",
    }
})