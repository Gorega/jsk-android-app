import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { TextInput, TouchableOpacity, View, StyleSheet, Text, ScrollView, SafeAreaView, Platform } from 'react-native';
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
    const isRTL = ["he", "ar"].includes(language);

    // Helper function for RTL-aware positioning
    const getMargin = (side, value) => {
      if (!isRTL) return { [`margin${side}`]: value };
      
      // Flip left/right margins for RTL
      const flippedSide = side === 'Left' ? 'Right' : side === 'Right' ? 'Left' : side;
      return { [`margin${flippedSide}`]: value };
    };

    return <>
        <SafeAreaView style={[styles.searchBox, {paddingTop: addPaddingSpace ? 40 : 15}]}>
          <View style={[styles.search, {flexDirection: isRTL ? "row-reverse" : "row"}]}>
            <View style={[
              styles.inputField, 
              {
                width: (activeSearchBy || activeDate) ? "60%" : showScanButton ? "70%" : "80%",
                flexDirection: isRTL ? "row-reverse" : "row",
                borderRadius: 8,
                backgroundColor: '#F8F9FA',
                borderWidth: 0,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }
            ]}>
              <EvilIcons name="search" size={24} color="#4361EE" style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
              <TextInput
                style={[
                  styles.input,
                  {
                    textAlign: isRTL ? "right" : "left",
                    color: '#333',
                    fontSize: 15,
                    padding: 0,
                    flex: 1,
                  }
                ]}
                placeholder={`${translations[language].search.placeholder} ${activeSearchBy ? `${translations[language].search.by} ${activeSearchBy.name}` : ''}`}
                placeholderTextColor="#94A3B8"
                value={searchValue}
                onChangeText={setSearchValue}
              />
            </View>
            
            <View style={[
              styles.actionButtons,
              { flexDirection: isRTL ? "row-reverse" : "row" }
            ]}>
              {(activeSearchBy || activeDate) && (
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={()=> {
                    setActiveSearchBy("")
                    setSearchValue("")
                    setActiveDate("")
                    onClearFilters();
                  }}
                >
                  <MaterialIcons name="clear" size={22} color="#E63946" />
                </TouchableOpacity>
              )}
              
              {showScanButton && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={()=> {
                    if(permission){
                      router.push("(camera)/lookupOrder")
                    } else {
                      requestPermission()
                    }
                  }}
                >
                  <Ionicons name="scan" size={22} color="#4361EE" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={()=> setShowSpecificFilters(true)}
              >
                <AntDesign name="filter" size={20} color={activeSearchBy ? "#F8C332" : "#4361EE"} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={()=> setShowDateFilters(true)}
              >
                <Ionicons name="calendar-number-outline" size={22} color={activeDate ? "#F8C332" : "#4361EE"} />
              </TouchableOpacity>
            </View>
          </View>

          {filterByGroup && filterByGroup.length > 0 && (
            <View style={styles.filter}>
              <ScrollView 
                style={[
                  styles.filterScrollView,
                  isRTL && { transform: [{ scaleX: -1 }] }
                ]} 
                horizontal={true} 
                showsHorizontalScrollIndicator={false}
              >
                <View style={[
                  styles.filterBy,
                  {
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: isRTL ? 'flex-end' : 'flex-start',
                    transform: isRTL ? [{ scaleX: -1 }] : undefined
                  }
                ]}>
                  {filterByGroup.map((filter, index) => (
                    <TouchableOpacity 
                      style={[
                        styles.filterItem,
                        activeFilter === filter.action && styles.activeFilter
                      ]} 
                      key={index} 
                      onPress={() => setActiveFilter(filter.action)}
                    >
                      <Text style={[
                        styles.filterItemText,
                        activeFilter === filter.action && styles.activeFilterText
                      ]}>
                        {filter.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View> 
              </ScrollView>
            </View>
          )}
        </SafeAreaView>

        {showSpecificFilters && (
          <ModalPresentation
            showModal={showSpecificFilters}
            setShowModal={setShowSpecificFilters}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalH2}>{translations[language].search.searchBy}</Text>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {searchByGroup?.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.modalItem} 
                  onPress={()=> {
                    setActiveSearchBy(item)
                    setShowSpecificFilters()
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    {textAlign: isRTL ? "right" : "left"}
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={[
              styles.modalFooter,
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowSpecificFilters(false)}
              >
                <Text style={styles.modalButtonText}>{translations[language].search.cancel}</Text>
              </TouchableOpacity>
            </View>
          </ModalPresentation>
        )}

        {showDateFilters && (
          <ModalPresentation
            showModal={showDateFilters}
            setShowModal={setShowDateFilters}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalH2}>{translations[language].search.searchByDate}</Text>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {searchByDateGroup?.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.modalItem} 
                  onPress={()=> {
                    if(item.action === "custom"){
                      setShowCalendar(true)
                    } else {
                      setActiveDate(item)
                      setShowDateFilters()
                    }
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    {textAlign: isRTL ? "right" : "left"}
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={[
              styles.modalFooter,
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowDateFilters(false)}
              >
                <Text style={styles.modalButtonText}>{translations[language].search.cancel}</Text>
              </TouchableOpacity>
            </View>
          </ModalPresentation>
        )}

        {showCalendar && (
          <ModalPresentation
            showModal={showCalendar}
            setShowModal={setShowCalendar}
          >
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                }}
                markedDates={{
                  [selectedDate]: { selected: true, selectedColor: '#4361EE' },
                }}
                theme={{
                  todayTextColor: "#4361EE",
                  arrowColor: "#4361EE",
                  selectedDayBackgroundColor: '#4361EE',
                  textDayFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  textMonthFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  textDayHeaderFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '500',
                  textSectionTitleColor: '#4361EE',
                }}
              />
              
              <View style={[
                styles.calendarActions, 
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <TouchableOpacity 
                  style={[styles.calendarButton, styles.primaryButton]}
                  onPress={() => {
                    setShowCalendar(false);
                    setShowDateFilters(false);
                    setActiveDate({action: "custom"});
                  }}
                >
                  <Text style={styles.primaryButtonText}>{translations[language].search.confirm}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.calendarButton, styles.secondaryButton]}
                  onPress={() => setShowCalendar(false)}
                >
                  <Text style={styles.secondaryButtonText}>{translations[language].search.cancel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ModalPresentation>
        )}
    </>
}

const styles = StyleSheet.create({
    searchBox: {
        padding: 15,
        backgroundColor: "white",
        elevation: 4,
        shadowColor: "rgba(0, 0, 0, 0.1)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        justifyContent: "flex-end",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    search: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    inputField: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: "#E2E8F0",
        borderWidth: 1,
        borderRadius: 8,
        height: 44,
    },
    input: {
        width: "90%",
        fontSize: 15,
        color: "#333",
    },
    actionButtons: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
    },
    filter: {
        marginTop: 15,
    },
    filterBy: {
        flexDirection: "row",
        paddingVertical: 8,
    },
    filterScrollView: {
        width: "100%",
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 6,
        backgroundColor: '#F1F5F9',
    },
    filterItemText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    activeFilter: {
        backgroundColor: '#4361EE',
    },
    activeFilterText: {
        color: 'white',
        fontWeight: '600',
    },
    modalHeader: {
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingBottom: 10,
        marginBottom: 10,
    },
    modalH2: {
        padding: 10,
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        color: '#1E293B',
    },
    modalScrollView: {
        marginVertical: 10,
        maxHeight: 400,
    },
    modalItem: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomColor: "#E2E8F0",
        borderBottomWidth: 1,
    },
    modalItemText: {
        fontSize: 16,
        color: '#334155',
    },
    modalFooter: {
        marginTop: 15,
        flexDirection: "row",
        justifyContent: "flex-end",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingTop: 15,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#4361EE',
        fontWeight: '600',
    },
    calendarContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
    },
    calendarActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
    },
    calendarButton: {
        marginHorizontal: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    primaryButton: {
        backgroundColor: '#4361EE',
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#F1F5F9',
    },
    secondaryButtonText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 16,
    },
})