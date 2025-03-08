import { StyleSheet,Modal, View,Text, Pressable, TouchableOpacity, TextInput } from "react-native";
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FlatListData from "../FlatListData";

export default function PickerModal({list,showPickerModal,setShowPickerModal,setSelectedValue,field,loadMoreData,loadingMore,prickerSearchValue,setPickerSearchValue}){
    const { language } = useLanguage();
    const {name} = field;

    return <Modal
        style={styles.modal}
        animationType="fade"
        visible={showPickerModal}
        onRequestClose={setShowPickerModal}
        transparent
    >
        <View style={styles.container}>
            <View style={styles.main}>
                <Text style={styles.label}>{translations[language].picker.choose} {field.label}</Text>
                {field.showSearchBar && <View style={[styles.inputField,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <EvilIcons name="search" size={24} color="black" />
                    <TextInput
                        style={{width:"88%",textAlign:["he", "ar"].includes(language) ? "right" : "left"}}
                        placeholder={translations[language].picker.searchPlaceholder}
                        value={prickerSearchValue}
                        onChangeText={(input)=> setPickerSearchValue(input)}
                    />
                </View>}
                <FlatListData
                    list={list || []}
                    loadMoreData={loadMoreData ? loadMoreData : null}
                    loadingMore={loadingMore ? loadingMore : false}
                    children={(item)=> (
                        <View style={styles.item}>
                            <TouchableOpacity onPress={()=> {
                                setSelectedValue((selectedValue) => ({...selectedValue,[name]:item}))
                                setShowPickerModal(false)
                            }}>
                                <Text style={[styles.itemField,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{item.label || `${item.name} ${item.phone ? "/ " + item.phone : ""}`}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
                <Pressable onPress={setShowPickerModal}>
                    <Text style={styles.quit}>{translations[language].picker.cancel}</Text>
                </Pressable>
            </View>
        </View>
    </Modal>
}


const styles = StyleSheet.create({
    container:{
        width:"100%",
        height:"100%",
        backgroundColor:"rgba(0,0,0,.5)"
    },
    main:{
        position:"absolute",
        top:"50%",
        left:"50%",
        transform:"translate(-50%,-50%)",
        backgroundColor:"white",
        height:"80%",
        width:"90%",
        padding:15
    },
    label:{
        fontSize:18,
        fontWeight:600,
        marginBottom:25,
        textAlign:"center"
    },
    item:{
        margin:0,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
    },
    itemField:{
    paddingHorizontal:15,
    paddingVertical:20,
    width:"100%",
    },
    quit:{
        fontWeight:"500",
        textAlign:"right",
        marginTop:25
    },
    inputField:{
        borderWidth:1,
        borderColor:"rgba(0,0,0,.1)",
        flexDirection:"row",
        alignItems:"center",
        gap:10
    }
})