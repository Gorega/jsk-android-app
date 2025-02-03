import { StyleSheet,Modal, View,Text, Pressable, TouchableOpacity, TextInput } from "react-native";
import EvilIcons from '@expo/vector-icons/EvilIcons';
import FlatListData from "../FlatListData";

export default function PickerModal({list,showPickerModal,setShowPickerModal,setSelectedValue,field,loadMoreData,loadingMore,prickerSearchValue,setPickerSearchValue}){
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
                <Text style={styles.label}>Choose a {field.label}</Text>
                {field.showSearchBar && <View style={styles.inputField}>
                    <EvilIcons name="search" size={24} color="black" />
                    <TextInput
                        style={{width:"88%",textAlign:"left"}}
                        placeholder="Search"
                        value={prickerSearchValue}
                        onChangeText={(input)=> setPickerSearchValue(input)}
                    />
                </View>}
                <FlatListData
                    list={list || []}
                    loadMoreData={loadMoreData}
                    loadingMore={loadingMore}
                    children={(item)=> (
                        <View style={styles.item}>
                            <TouchableOpacity onPress={()=> {
                                setSelectedValue((selectedValue) => ({...selectedValue,[name]:item}))
                                setShowPickerModal(false)
                            }}>
                                <Text>{item.label || `${item.name} ${item.phone ? "/ " + item.phone : ""}`}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
                <Pressable onPress={setShowPickerModal}>
                    <Text style={styles.quit}>Cancel</Text>
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
        paddingHorizontal:15,
        paddingVertical:20,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1
    },
    quit:{
        fontWeight:500,
        textAlign:"right"
    },
    inputField:{
        borderWidth:1,
        borderColor:"rgba(0,0,0,.1)",
        flexDirection:"row",
        alignItems:"center",
        gap:10
    }
})