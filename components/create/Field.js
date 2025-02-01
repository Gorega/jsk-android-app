import { TextInput, View,Pressable,Text,StyleSheet } from "react-native";
import PickerModal from "../pickerModal/PickerModal";
import { useState } from "react";

export default function Field({field,setSelectedValue,loadMoreData,loadingMore,prickerSearchValue,setPickerSearchValue}){
    const [showPickerModal,setShowPickerModal] = useState(false);

    return <>
        <View style={styles.inputField}>
            {field.type === "input" && <TextInput style={{textAlign:"left"}} placeholder={field.label} value={field.value} onChangeText={field.onChange} />}
            {field.type === "select" && <Pressable style={styles.selectField} onPress={()=> setShowPickerModal(true)} value={field.value}>
                <Text>{field.value ? field.value : field.label}</Text>
            </Pressable>}
            {field.type === "checkbox" && <Pressable style={styles.flexInputField} onPress={field.onChange}>
                <Text>{field.label}</Text>
                <View style={[
                    styles.checkbox,
                    field.value && styles.checked
                ]}>
                    <View style={[
                        styles.toggle,
                        field.value && styles.toggleChecked
                    ]}>
                        <Text></Text>
                    </View>
                </View>    
            </Pressable>}
        </View>
        {showPickerModal && <PickerModal
            list={field.list}
            showPickerModal={showPickerModal}
            setShowPickerModal={()=> setShowPickerModal(false)}
            setSelectedValue={setSelectedValue}
            field={field}
            loadMoreData={loadMoreData}
            loadingMore={loadingMore}
            prickerSearchValue={prickerSearchValue}
            setPickerSearchValue={setPickerSearchValue}
        />}
    </>
}

const styles = StyleSheet.create({
    inputField:{
        borderColor:"rgba(0,0,0,.1)",
        borderWidth:1,
    },
    selectField:{
        borderColor:"rgba(0,0,0,.1)",
        borderWidth:1,
        padding:10
    },
    flexInputField:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        padding:10
    },
    checkbox:{
        width:40,
        backgroundColor:"rgba(0,0,0,.1)",
        borderRadius:15,
        flexDirection:"row",
        justifyContent:"flex-start"
    },
    checked:{
        justifyContent:"flex-end",
    },
    toggle:{
        width:20,
        backgroundColor:"#d9d9d9",
        borderRadius:15,
    },
    toggleChecked:{
        backgroundColor:"#F9AF39"
    }
})