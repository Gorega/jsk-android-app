import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { TextInput, TouchableOpacity, View,StyleSheet,Text, ScrollView, SafeAreaView } from 'react-native';
import { useState } from 'react';
import ModalPresentation from "../../components/ModalPresentation";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function Search({
    searchValue,
    setSearchValue,
    filterByGroup,
    activeFilter,
    setActiveFilter,
    searchByGroup,
    activeSearchBy,
    setActiveSearchBy,
    searchByDateGroup,
    activeDate,
    setActiveDate,
    selectedDate,
    setSelectedDate,
    onClearFilters,
    showScanButton = true,
    addPaddingSpace
  }){

    const { language } = useLanguage();
    const [showSpecificFilters,setShowSpecificFilters] = useState(false);
    const [showDateFilters,setShowDateFilters] = useState(false);
    const [showCalendar,setShowCalendar] = useState(false);
    const [permission,requestPermission] = useCameraPermissions();

    return <>
        <SafeAreaView style={[styles.searchBox,{paddingTop:addPaddingSpace ? 40 : 15}]}>
        <View style={[styles.search,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
            <View style={[styles.inputField,{width:(activeSearchBy || activeDate ) ? "60%" : showScanButton ? "70%" : "80%",flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <EvilIcons name="search" size={24} color="black" />
                <TextInput
                    multiline
                    style={[styles.input,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}
                    placeholder={`${translations[language].search.placeholder} ${activeSearchBy && `${translations[language].search.by} ${activeSearchBy.name}`}`}
                    value={searchValue}
                    onChangeText={setSearchValue}
                />
            </View>
            {(activeSearchBy || activeDate) && <TouchableOpacity onPress={()=> {
                setActiveSearchBy("")
                setSearchValue("")
                setActiveDate("")
                onClearFilters();
            }}>
                <MaterialIcons name="clear" size={20} color="red" />
            </TouchableOpacity>}
            {showScanButton && <TouchableOpacity onPress={()=> {
              if(permission){
                router.push("(camera)/lookupOrder")
              }else{
                requestPermission()
              }
            }}>
              <Ionicons name="scan" size={24} color="black" />
            </TouchableOpacity>}
            <TouchableOpacity onPress={()=> setShowSpecificFilters(true)}>
                <AntDesign name="filter" size={20} color={activeSearchBy ? "#F8C332" : "black"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={()=> setShowDateFilters(true)}>
                <Ionicons name="calendar-number-outline" size={24} color={activeDate ? "#F8C332" : "black"} />
            </TouchableOpacity>
        </View>
        <View style={styles.filter}>
                <ScrollView style={[styles.filterScrollView,["he", "ar"].includes(language) && {transform: [{ scaleX: -1 }]}]} horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={[styles.filterBy,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",justifyContent: ["he", "ar"].includes(language) ? 'flex-end' : 'flex-start',transform: ["he", "ar"].includes(language) ? [{ scaleX: -1 }] : undefined}]}>
                        {filterByGroup?.map((filter,index)=>{
                            return <TouchableOpacity style={[styles.filterItem,activeFilter === filter.action && styles.activeFilter]} key={index} onPress={() => setActiveFilter(filter.action)}>
                                <Text style={activeFilter === filter.action ? styles.activeFilterText : null}>{filter.name}</Text>
                            </TouchableOpacity>
                        })}
                    </View> 
                </ScrollView>
            {/* <View style={styles.group}>
                <View style={styles.icon}>
                    <Ionicons name="filter" size={24} color="black" />
                </View>
                <View style={styles.icon}>
                    <Ionicons name="calendar-number-outline" size={24} color="black" />
                </View>
            </View> */}
        </View>
</SafeAreaView>

{showSpecificFilters && (
        <ModalPresentation
          showModal={showSpecificFilters}
          setShowModal={setShowSpecificFilters}
        >
          <Text style={styles.modalH2}>{translations[language].search.searchBy}</Text>
          <ScrollView>
            {searchByGroup?.map((item, index) => (
              <TouchableOpacity key={index} style={styles.modalItem} onPress={()=> {
                setActiveSearchBy(item)
                setShowSpecificFilters()
              }}>
                <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeModal} onPress={setShowSpecificFilters}>
                <Text>{translations[language].search.cancel}</Text>
          </TouchableOpacity>
        </ModalPresentation>
    )}
    {showDateFilters && (
        <ModalPresentation
        showModal={showDateFilters}
        setShowModal={setShowDateFilters}
      >
        <Text style={styles.modalH2}>{translations[language].search.searchByDate}</Text>
        <ScrollView>
          {searchByDateGroup?.map((item, index) => (
            <TouchableOpacity key={index} style={styles.modalItem} onPress={()=> {
              if(item.action === "custom"){
                setShowCalendar(true)
              }else{
                setActiveDate(item)
                setShowDateFilters()
              }
            }}>
              <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.closeModal} onPress={setShowDateFilters}>
              <Text>{translations[language].search.cancel}</Text>
        </TouchableOpacity>
      </ModalPresentation>
    )}
    {showCalendar && (
        <ModalPresentation
        showModal={showCalendar}
        setShowModal={setShowCalendar}
      >
        <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#F8C332' },
        }}
        theme={{
            todayTextColor:"#F8C332",
            arrowColor:"#F8C332"
        }}
      />
        <View style={{flexDirection:"row",justifyContent:"flex-end",alignItems:"center"}}>
            <TouchableOpacity style={styles.closeModal} onPress={()=>{
                setShowCalendar();
                setShowDateFilters();
                setActiveDate({action:"custom"})
            }}>
                <Text style={{color:"#F8C332"}}>{translations[language].search.confirm}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeModal} onPress={setShowCalendar}>
                <Text>{translations[language].search.cancel}</Text>
            </TouchableOpacity>
        </View>
      </ModalPresentation>
    )}
</>
}

const styles = StyleSheet.create({
    searchBox:{
        padding:15,
        backgroundColor:"white",
        boxShadow:"rgba(0, 0, 0, 0.16) 0px 1px 4px",
        justifyContent:"flex-end"
    },
    search:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
    },
    inputField:{
        flexDirection:"row",
        alignItems:"center",
        borderColor:"rgba(0,0,0,.1)",
        borderWidth:1
    },
    input:{
        width:"90%",
        textAlign:"left"
    },
    filter:{
        marginTop:25,
    },
    filterBy:{
        flexDirection:"row",
        gap:30
    },
    filterScrollView:{
        width:"100%",
    },
    filterItem: {
        padding: 8,
        borderRadius: 20,
    },
    activeFilter: {
        backgroundColor: '#F8C332',
    },
    activeFilterText: {
        color: 'white',
    },
    modalH2:{
        padding:10,
        fontSize:18,
        fontWeight:"500",
        borderBottomColor:"rgba(0,0,0,.2)",
        borderBottomWidth:2,
        textAlign:"center"
    },
    modalScrollView:{
        paddingBottom: 20,
    },
    modalItem:{
        padding:15,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1,
    },
    closeModal:{
        marginTop:15,
        flexDirection:"row",
        justifyContent:"flex-end",
        padding:15
    }
})