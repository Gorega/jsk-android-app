import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { TextInput, TouchableOpacity, View, StyleSheet, Text, ScrollView, SafeAreaView, Platform, I18nManager, Dimensions, Animated, Keyboard } from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import ModalPresentation from "../../components/ModalPresentation";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { router, useFocusEffect } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

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
    showScanButton = true,
    addPaddingSpace,
    onClearFilters,
    onScanCollection,
    searchResultCount
  }){

    const { language } = useLanguage();
    const [showSpecificFilters,setShowSpecificFilters] = useState(false);
    const [showDateFilters,setShowDateFilters] = useState(false);
    const [showCalendar,setShowCalendar] = useState(false);
    const [showFiltersModal,setShowFiltersModal] = useState(false);
    const [permission,requestPermission] = useCameraPermissions();
    const rtl = useRTLStyles();
    const [isFocused, setIsFocused] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    // Animation when focus changes
    useEffect(() => {
      Animated.timing(scaleAnim, {
        toValue: isFocused ? 1.03 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, [isFocused, scaleAnim]);
    
    // Handle active filter changes
    useEffect(() => {
      if (activeFilter) {
        // Add any additional effects when filter changes
      }
    }, [activeFilter]);
    
    const clearAll = () => {
      setActiveSearchBy("");
      setSearchValue("");
      setActiveDate("");
      Keyboard.dismiss();
    };

    // Listen for scanned reference ID from scanReference screen
    useEffect(() => {
      // Check if we have a scanned reference ID in the global object
      if (global && global.scannedReferenceId && onScanCollection) {
        const scannedId = global.scannedReferenceId;
        
        // Clear the global variable immediately to prevent duplicate processing
        global.scannedReferenceId = null;
        
        // Call the handler function with the scanned ID
        onScanCollection(scannedId);
      }
    }, [onScanCollection]);
    
    // Check for scanned reference ID when screen is focused
    useFocusEffect(
      useCallback(() => {
        if (global && global.scannedReferenceId && onScanCollection) {
          const scannedId = global.scannedReferenceId;
          
          // Clear the global variable immediately to prevent duplicate processing
          global.scannedReferenceId = null;
          
          // Call the handler function with the scanned ID
          onScanCollection(scannedId);
        }
        return () => {
          // Clean up when screen loses focus
        };
      }, [onScanCollection])
    );

    const handleScanPress = () => {
      if (permission) {
        if (onScanCollection) {
          // For collection screen, use scanReference to get collection ID
          router.push("(camera)/scanReference");
        } else {
          // For other screens, use the default lookupOrder behavior
          router.push("(camera)/lookupOrder");
        }
      } else {
        requestPermission();
      }
    };

    return <>
      <SafeAreaView style={[styles.searchBox, {paddingTop: addPaddingSpace ? 32 : 12, backgroundColor: colors.card}]}>
        <View style={styles.search}>
          <Animated.View 
            style={[
              styles.inputField, 
              {
                width: (activeSearchBy || activeDate) ? "60%" : showScanButton ? "70%" : "80%",
                transform: [{ scale: scaleAnim }],
                backgroundColor: isDark ? colors.surface : '#F8F9FA',
                borderWidth: isFocused ? 1 : 0,
                borderColor: isFocused ? '#4361EE' : '#E2E8F0',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                shadowColor: isFocused ? "rgba(67, 97, 238, 0.2)" : "rgba(0, 0, 0, 0.1)",
                shadowOffset: { width: 0, height: isFocused ? 3 : 1 },
                shadowOpacity: isFocused ? 0.4 : 0.2,
                shadowRadius: isFocused ? 6 : 3,
                elevation: isFocused ? 4 : 2,
              }
            ]}
          >
            <EvilIcons name="search" size={24} color="#4361EE" />
            <TextInput
              style={[
                styles.input,
                {
                  textAlign: rtl.isRTL ? "right" : "left",
                  color: colors.text,
                  fontSize: 15,
                  padding: 0,
                  flex: 1,
                  marginHorizontal: rtl.isRTL ? 8 : 0,
                  fontWeight: '400',
                }
              ]}
              placeholder={`${translations[language].search.placeholder} ${activeSearchBy ? `${translations[language].search.by} ${activeSearchBy.name}` : ''}`}
              placeholderTextColor={isDark ? "#94A3B8" : "#94A3B8"}
              value={searchValue}
              onChangeText={setSearchValue}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {searchValue ? (
              <TouchableOpacity onPress={() => setSearchValue('')}>
                <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </Animated.View>
          
          <View style={styles.actionButtons}>
            {(activeSearchBy || activeDate) && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.clearButton]} 
                onPress={clearAll}
              >
                <MaterialIcons name="clear" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {showScanButton && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.actionIconButton]}
                onPress={handleScanPress}
              >
                <Ionicons name="scan" size={22} color="#4361EE" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.iconButton, styles.actionIconButton, activeSearchBy && styles.activeIconButton]}
              onPress={()=> setShowSpecificFilters(true)}
            >
              <AntDesign name="filter" size={20} color={activeSearchBy ? "#FFFFFF" : "#4361EE"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, styles.actionIconButton, activeDate && styles.activeIconButton]}
              onPress={()=> setShowDateFilters(true)}
            >
              <Ionicons name="calendar-number-outline" size={22} color={activeDate ? "#FFFFFF" : "#4361EE"} />
            </TouchableOpacity>
          </View>
        </View>

        {(activeSearchBy || activeDate) && (
          <View style={styles.activeFiltersBar}>
            {activeSearchBy && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  {activeSearchBy.name}
                </Text>
                <TouchableOpacity onPress={() => setActiveSearchBy("")}>
                  <Ionicons name="close-circle" size={18} color="#4361EE" />
                </TouchableOpacity>
              </View>
            )}
            
            {activeDate && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  {activeDate.name || translations[language].search.customDate}
                </Text>
                <TouchableOpacity onPress={() => setActiveDate("")}>
                  <Ionicons name="close-circle" size={18} color="#4361EE" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.filter}>
          <TouchableOpacity 
            style={[styles.selectBox, activeFilter && styles.activeSelectBox, {backgroundColor: isDark ? colors.surface : '#F8F9FA', borderColor: isDark ? colors.border : '#E2E8F0'}]}
            onPress={() => setShowFiltersModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectBoxContent}>
              <View style={styles.selectBoxTextContainer}>
                <Text style={[
                  styles.selectBoxText,
                  activeFilter && styles.selectBoxTextActive,
                  {color: isDark ? colors.text : '#1E293B'}
                ]}>
                  {activeFilter 
                    ? filterByGroup?.find(filter => filter.action === activeFilter)?.name 
                    : translations[language].search.all || "All"}
                </Text>
              </View>
              <View style={styles.selectBoxIcon}>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#4361EE" />
              </View>
            </View>
          </TouchableOpacity>
          
          {(activeSearchBy || activeDate || activeFilter || searchValue) && searchResultCount !== undefined && (
            <View style={[styles.searchResultCount, {
              backgroundColor: isDark ? 'rgba(67, 97, 238, 0.15)' : 'rgba(67, 97, 238, 0.08)'
            }]}>
              <Text style={[styles.searchResultCountText, {color: isDark ? colors.primary : colors.primary}]}>
                {searchResultCount} {translations[language]?.search?.results || 'results'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {showSpecificFilters && (
        <ModalPresentation
          showModal={showSpecificFilters}
          setShowModal={setShowSpecificFilters}
        >
          <View style={[styles.modalHeader, {backgroundColor: isDark ? colors.card : 'white', borderBottomColor: isDark ? colors.border : '#E2E8F0'}]}>
            <View style={[styles.modalHeaderBar, {backgroundColor: isDark ? colors.border : '#E2E8F0'}]} />
            <Text style={[styles.modalH2, {color: colors.text}]}>{translations[language].search.searchBy}</Text>
          </View>
          
          <ScrollView style={[styles.modalScrollView, {backgroundColor: isDark ? colors.card : 'white'}]} showsVerticalScrollIndicator={false}>
            {searchByGroup?.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.modalItem,
                  activeSearchBy?.action === item.action && styles.modalItemActive,
                  {borderBottomColor: isDark ? colors.border : '#E2E8F0', backgroundColor: activeSearchBy?.action === item.action ? (isDark ? 'rgba(67, 97, 238, 0.15)' : 'rgba(67, 97, 238, 0.05)') : 'transparent'}
                ]} 
                onPress={()=> {
                  setActiveSearchBy(item)
                  setShowSpecificFilters()
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  activeSearchBy?.action === item.action && styles.modalItemTextActive,
                  {color: activeSearchBy?.action === item.action ? '#4361EE' : colors.text}
                ]}>
                  {item.name}
                </Text>
                {activeSearchBy?.action === item.action && (
                  <MaterialIcons name="check-circle" size={22} color="#4361EE" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={[styles.modalFooter, {backgroundColor: isDark ? colors.card : 'white', borderTopColor: isDark ? colors.border : '#E2E8F0'}]}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.secondaryButton, {backgroundColor: isDark ? colors.surface : '#F1F5F9', borderColor: isDark ? colors.border : '#E2E8F0'}]} 
              onPress={() => setShowSpecificFilters(false)}
            >
              <Text style={[styles.secondaryButtonText, {color: isDark ? colors.textSecondary : '#64748B'}]}>{translations[language].search.cancel}</Text>
            </TouchableOpacity>
          </View>
        </ModalPresentation>
      )}

      {showDateFilters && (
        <ModalPresentation
          showModal={showDateFilters}
          setShowModal={setShowDateFilters}
        >
          <View style={[styles.modalHeader, {backgroundColor: isDark ? colors.card : 'white', borderBottomColor: isDark ? colors.border : '#E2E8F0'}]}>
            <View style={[styles.modalHeaderBar, {backgroundColor: isDark ? colors.border : '#E2E8F0'}]} />
            <Text style={[styles.modalH2, {color: colors.text}]}>{translations[language].search.searchByDate}</Text>
          </View>
          
          <ScrollView style={[styles.modalScrollView, {backgroundColor: isDark ? colors.card : 'white'}]} showsVerticalScrollIndicator={false}>
            {searchByDateGroup?.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.modalItem,
                  activeDate?.action === item.action && styles.modalItemActive,
                  {borderBottomColor: isDark ? colors.border : '#E2E8F0', backgroundColor: activeDate?.action === item.action ? (isDark ? 'rgba(67, 97, 238, 0.15)' : 'rgba(67, 97, 238, 0.05)') : 'transparent'}
                ]}
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
                  activeDate?.action === item.action && styles.modalItemTextActive,
                  {color: activeDate?.action === item.action ? '#4361EE' : colors.text}
                ]}>
                  {item.name}
                </Text>
                {activeDate?.action === item.action && (
                  <MaterialIcons name="check-circle" size={22} color="#4361EE" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={[styles.modalFooter, {backgroundColor: isDark ? colors.card : 'white', borderTopColor: isDark ? colors.border : '#E2E8F0'}]}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.secondaryButton, {backgroundColor: isDark ? colors.surface : '#F1F5F9', borderColor: isDark ? colors.border : '#E2E8F0'}]} 
              onPress={() => setShowDateFilters(false)}
            >
              <Text style={[styles.secondaryButtonText, {color: isDark ? colors.textSecondary : '#64748B'}]}>{translations[language].search.cancel}</Text>
            </TouchableOpacity>
          </View>
        </ModalPresentation>
      )}

      {showCalendar && (
        <ModalPresentation
          showModal={showCalendar}
          setShowModal={setShowCalendar}
        >
          <View style={[styles.calendarContainer, {backgroundColor: isDark ? colors.card : 'white'}]}>
            <View style={[styles.calendarHeader, {borderBottomColor: isDark ? colors.border : '#E2E8F0'}]}>
              <Text style={[styles.calendarTitle, {color: colors.text}]}>{translations[language].search.selectDate || "Select Date"}</Text>
            </View>
            
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#4361EE', selectedTextColor: '#FFFFFF' },
              }}
              theme={{
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                calendarBackground: isDark ? colors.card : '#FFFFFF',
                textSectionTitleColor: '#4361EE',
                selectedDayBackgroundColor: '#4361EE',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#4361EE',
                dayTextColor: isDark ? colors.text : '#2D3748',
                textDisabledColor: isDark ? colors.border : '#CBD5E0',
                dotColor: '#4361EE',
                selectedDotColor: '#FFFFFF',
                arrowColor: '#4361EE',
                monthTextColor: isDark ? colors.text : '#1A202C',
                indicatorColor: '#4361EE',
                textDayFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textMonthFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textDayHeaderFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textDayFontWeight: '400',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
            
            <View style={[styles.calendarActions, {borderTopColor: isDark ? colors.border : '#E2E8F0'}]}>
              <TouchableOpacity 
                style={[styles.calendarButton, styles.secondaryButton, {backgroundColor: isDark ? colors.surface : '#F1F5F9', borderColor: isDark ? colors.border : '#E2E8F0'}]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={[styles.secondaryButtonText, {color: isDark ? colors.textSecondary : '#64748B'}]}>{translations[language].search.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.calendarButton, styles.primaryButton]}
                onPress={() => {
                  setShowCalendar(false);
                  setShowDateFilters(false);
                  setActiveDate({action: "custom", name: selectedDate});
                }}
              >
                <Text style={styles.primaryButtonText}>{translations[language].search.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ModalPresentation>
      )}

      {showFiltersModal && (
        <ModalPresentation
          showModal={showFiltersModal}
          setShowModal={setShowFiltersModal}
          position="bottom"
          backdropOpacity={0.7}
        >
          <View style={[styles.modalHeader, {backgroundColor: isDark ? colors.card : 'white', borderBottomColor: isDark ? colors.border : '#E2E8F0'}]}>
            <View style={[styles.modalHeaderBar, {backgroundColor: isDark ? colors.border : '#E2E8F0'}]} />
            <View style={styles.modalTitleContainer}>
              <Text style={[styles.modalH2, {color: colors.text}]}>{translations[language].search.selectFilter || "Select Filter"}</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowFiltersModal(false)}
              >
                <MaterialIcons name="close" size={24} color={isDark ? colors.textSecondary : "#64748B"} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={[styles.modalScrollView, {backgroundColor: isDark ? colors.card : 'white'}]} showsVerticalScrollIndicator={false}>
            {filterByGroup?.map((filter, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  activeFilter === filter.action && styles.filterOptionActive,
                  {borderBottomColor: isDark ? colors.border : '#F1F5F9', backgroundColor: activeFilter === filter.action ? (isDark ? 'rgba(67, 97, 238, 0.15)' : '#F0F9FF') : 'transparent'}
                ]}
                onPress={() => {
                  setActiveFilter(filter.action);
                  setShowFiltersModal(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilter === filter.action && styles.filterOptionTextActive,
                  {color: activeFilter === filter.action ? '#4361EE' : colors.text}
                ]}>
                  {filter.name}
                </Text>
                {activeFilter === filter.action && (
                  <MaterialIcons name="check-circle" size={22} color="#4361EE" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ModalPresentation>
      )}
    </>
}

const styles = StyleSheet.create({
  searchBox: {
      padding: 12,
      backgroundColor: "white",
      elevation: 3,
      shadowColor: "rgba(0, 0, 0, 0.1)",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.6,
      shadowRadius: 3,
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
      height: 42,
  },
  input: {
      width: "90%",
      fontSize: 15
  },
  actionButtons: {
      flexDirection: "row",
      alignItems: "center",
  },
  iconButton: {
      padding: 6,
      borderRadius: 8,
      marginLeft: 3,
  },
  actionIconButton: {
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
  },
  activeIconButton: {
      backgroundColor: '#4361EE',
  },
  clearButton: {
      backgroundColor: '#E63946',
  },
  filter: {
      marginTop: 12,
      paddingBottom: 5,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  selectBox: {
      backgroundColor: '#F8F9FA',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      flex: 1,
  },
  activeSelectBox: {
      borderColor: '#4361EE',
      backgroundColor: '#EEF2FF',
  },
  selectBoxContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  selectBoxTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  selectBoxText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#1E293B',
  },
  selectBoxTextActive: {
      fontSize: 16,
      fontWeight: '600',
      color: '#4361EE',
  },
  selectBoxIcon: {
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
      borderRadius: 8,
      padding: 2,
  },
  activeFiltersBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      marginBottom: 4,
  },
  activeFilterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginRight: 6,
      marginBottom: 6,
  },
  activeFilterChipText: {
      color: '#4361EE',
      fontWeight: '500',
      fontSize: 13,
      marginRight: 4,
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
      fontWeight: "700",
      textAlign: "center",
      color: '#1E293B',
  },
  modalScrollView: {
      marginVertical: 8,
      maxHeight: 350,
  },
  modalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomColor: "#E2E8F0",
      borderBottomWidth: 1,
  },
  modalItemActive: {
      backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  modalItemText: {
      fontSize: 16,
      color: '#334155',
  },
  modalItemTextActive: {
      color: '#4361EE',
      fontWeight: '600',
  },
  modalFooter: {
      marginTop: 15,
      flexDirection: "row",
      justifyContent: "center",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
      paddingTop: 15,
  },
  modalButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      minWidth: 120,
      alignItems: 'center',
  },
  modalButtonText: {
      fontSize: 16,
      color: '#4361EE',
      fontWeight: '600',
  },
  calendarContainer: {
      backgroundColor: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      padding: 10,
  },
  calendarHeader: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      marginBottom: 10,
  },
  calendarTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1E293B',
      textAlign: 'center',
  },
  calendarActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
      marginTop: 8,
  },
  calendarButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      minWidth: 100,
      alignItems: 'center',
  },
  primaryButton: {
      backgroundColor: '#4361EE',
      shadowColor: 'rgba(67, 97, 238, 0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  primaryButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
  },
  secondaryButton: {
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
      color: '#64748B',
      fontWeight: '600',
      fontSize: 16,
  },
  filterOptions: {
      padding: 10,
  },
  filterOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
  },
  filterOptionActive: {
      backgroundColor: '#F0F9FF',
  },
  filterOptionText: {
      fontSize: 17,
      color: '#334155',
  },
  filterOptionTextActive: {
      color: '#4361EE',
      fontWeight: '600',
  },
  modalHeaderBar: {
      width: 40,
      height: 5,
      backgroundColor: '#E2E8F0',
      borderRadius: 3,
      alignSelf: 'center',
      marginBottom: 15,
  },
  activeFilterLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      flex: 1,
  },
  activeFilterLabel: {
      fontSize: 14,
      color: '#64748B',
      marginRight: 4,
  },
  modalTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      width: '100%',
  },
  modalCloseButton: {
      position: 'absolute',
      right: 10,
      top: 0,
      padding: 8,
  },
  searchResultCount: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(67, 97, 238, 0.08)',
      borderRadius: 8,
      marginLeft: 10,
  },
  searchResultCountText: {
      fontSize: 13,
      fontWeight: '500',
  },
})