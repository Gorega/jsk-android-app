import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { TextInput, TouchableOpacity, View, StyleSheet, Text, ScrollView, SafeAreaView, Platform, Animated, Keyboard } from 'react-native';
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
    
    // Add a ref to track if a modal transition is in progress
    const modalTransitionInProgress = useRef(false);
    
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
      if (onClearFilters) {
        // Use the provided clear all filters function if available
        onClearFilters();
      } else {
        // Default behavior if no custom handler provided
        setActiveSearchBy("");
        setSearchValue("");
        setActiveDate("");
      }
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
    
    // Handle opening the specific filters modal
    const handleOpenSpecificFilters = () => {
      // Prevent opening modal if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      setShowSpecificFilters(true);
    };
    
    // Handle opening the date filters modal
    const handleOpenDateFilters = () => {
      // Prevent opening modal if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      setShowDateFilters(true);
    };
    
    // Handle opening the filters modal
    const handleOpenFiltersModal = () => {
      // Prevent opening modal if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      setShowFiltersModal(true);
    };
    
    // Handle opening the calendar modal
    const handleOpenCalendar = () => {
      // Prevent opening modal if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      modalTransitionInProgress.current = true;
      setShowDateFilters(false);
      
      // Wait for first modal to close before opening the calendar
      setTimeout(() => {
        setShowCalendar(true);
        modalTransitionInProgress.current = false;
      }, Platform.OS === 'ios' ? 500 : 300);
    };
    
    // Handle selecting a search by filter
    const handleSelectSearchBy = (item) => {
      // Prevent action if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      modalTransitionInProgress.current = true;
      setActiveSearchBy(item);
      setShowSpecificFilters(false);
      
      // Reset the transition flag after the modal is closed
      setTimeout(() => {
        modalTransitionInProgress.current = false;
      }, Platform.OS === 'ios' ? 500 : 300);
    };
    
    // Handle selecting a date filter
    const handleSelectDateFilter = (item) => {
      // Prevent action if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      if (item.action === "custom") {
        handleOpenCalendar();
      } else {
        modalTransitionInProgress.current = true;
        setActiveDate(item);
        setShowDateFilters(false);
        
        // Reset the transition flag after the modal is closed
        setTimeout(() => {
          modalTransitionInProgress.current = false;
        }, Platform.OS === 'ios' ? 500 : 300);
      }
    };
    
    // Handle selecting a filter
    const handleSelectFilter = (filter) => {
      // Prevent action if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      modalTransitionInProgress.current = true;
      setActiveFilter(filter.action);
      setShowFiltersModal(false);
      
      // Reset the transition flag after the modal is closed
      setTimeout(() => {
        modalTransitionInProgress.current = false;
      }, Platform.OS === 'ios' ? 500 : 300);
    };
    
    // Handle confirming the selected date
    const handleConfirmDate = () => {
      // Prevent action if transition is in progress
      if (modalTransitionInProgress.current) return;
      
      modalTransitionInProgress.current = true;
      setShowCalendar(false);
      
      // Wait for the calendar modal to close before updating the date
      setTimeout(() => {
        setActiveDate({action: "custom", name: selectedDate});
        modalTransitionInProgress.current = false;
      }, Platform.OS === 'ios' ? 500 : 300);
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
                backgroundColor: isDark ? colors.surface : colors.inputBg,
                borderWidth: isFocused ? 1 : 0,
                borderColor: isFocused ? colors.accent : colors.accent,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                shadowColor: isFocused ? colors.cardShadow : colors.cardShadow,
                shadowOffset: { width: 0, height: isFocused ? 3 : 1 },
                shadowOpacity: isFocused ? 0.4 : 0.2,
                shadowRadius: isFocused ? 6 : 3,
                elevation: isFocused ? 4 : 2,
              }
            ]}
          >
            <EvilIcons name="search" size={24} color={colors.accent} />
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
              placeholderTextColor={colors.accent}
              value={searchValue}
              onChangeText={setSearchValue}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {searchValue ? (
              <TouchableOpacity onPress={() => setSearchValue('')}>
                <Ionicons name="close-circle-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
          </Animated.View>
          
          <View style={styles.actionButtons}>
            {(activeSearchBy || activeDate) && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.clearButton]} 
                onPress={clearAll}
              >
                <MaterialIcons name="clear" size={22} color={colors.textInverse} />
              </TouchableOpacity>
            )}
            
            {showScanButton && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.actionIconButton]}
                onPress={handleScanPress}
              >
                <Ionicons name="scan" size={22} color={colors.accent} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.iconButton, styles.actionIconButton, activeSearchBy && styles.activeIconButton]}
              onPress={handleOpenSpecificFilters}
            >
              <AntDesign name="filter" size={20} color={activeSearchBy ? colors.textInverse : colors.accent} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, styles.actionIconButton, activeDate && styles.activeIconButton]}
              onPress={handleOpenDateFilters}
            >
              <Ionicons name="calendar-number-outline" size={22} color={activeDate ? colors.textInverse : colors.accent} />
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
                  <Ionicons name="close-circle" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>
            )}
            
            {activeDate && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  {activeDate.name || translations[language].search.customDate}
                </Text>
                <TouchableOpacity onPress={() => setActiveDate("")}>
                  <Ionicons name="close-circle" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {filterByGroup.length > 0 && <View style={styles.filter}>
          <TouchableOpacity 
            style={[styles.selectBox, (activeFilter !== null && activeFilter !== undefined) && styles.activeSelectBox, {backgroundColor: isDark ? colors.surface : colors.inputBg, borderColor: isDark ? colors.border : colors.inputBorder}]}
            onPress={handleOpenFiltersModal}
            activeOpacity={0.7}
          >
            <View style={styles.selectBoxContent}>
              <View style={styles.selectBoxTextContainer}>
                <Text style={[
                  styles.selectBoxText,
                  (activeFilter !== null && activeFilter !== undefined) && styles.selectBoxTextActive,
                  {color: isDark ? colors.text : colors.text}
                ]}>
                  {(activeFilter !== null && activeFilter !== undefined)
                    ? filterByGroup?.find(filter => filter.action === activeFilter)?.name 
                    : translations[language].search.all || "All"}
                </Text>
              </View>
              <View style={styles.selectBoxIcon}>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.accent} />
              </View>
            </View>
          </TouchableOpacity>
          
          {(activeSearchBy || activeDate || (activeFilter !== null && activeFilter !== undefined) || searchValue) && searchResultCount !== undefined && (
            <View style={[styles.searchResultCount, {
              backgroundColor: isDark ? `${colors.primary}26` : `${colors.primary}14`
            }]}>
              <Text style={[styles.searchResultCountText, {color: isDark ? colors.primary : colors.primary}]}>
                {searchResultCount} {translations[language]?.search?.results || 'results'}
              </Text>
            </View>
          )}
        </View>}
      </SafeAreaView>

      {showSpecificFilters && (
        <ModalPresentation
          showModal={showSpecificFilters}
          setShowModal={setShowSpecificFilters}
          onDismiss={() => {
            modalTransitionInProgress.current = true;
            setShowSpecificFilters(false);
            setTimeout(() => {
              modalTransitionInProgress.current = false;
            }, Platform.OS === 'ios' ? 500 : 300);
          }}
        >
          <View style={[styles.modalHeader, {backgroundColor: isDark ? colors.card : colors.modalBg, borderBottomColor: isDark ? colors.border : colors.inputBorder}]}>
            <View style={[styles.modalHeaderBar, {backgroundColor: isDark ? colors.border : colors.inputBorder}]} />
            <Text style={[styles.modalH2, {color: colors.text}]}>{translations[language].search.searchBy}</Text>
          </View>
          
          <ScrollView style={[styles.modalScrollView, {backgroundColor: isDark ? colors.card : colors.modalBg}]} showsVerticalScrollIndicator={false}>
            {searchByGroup?.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.modalItem,
                  activeSearchBy?.action === item.action && styles.modalItemActive,
                  {borderBottomColor: isDark ? colors.border : colors.inputBorder, backgroundColor: activeSearchBy?.action === item.action ? (isDark ? `${colors.primary}26` : `${colors.primary}0D`) : 'transparent'}
                ]} 
                onPress={() => handleSelectSearchBy(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  activeSearchBy?.action === item.action && styles.modalItemTextActive,
                  {color: activeSearchBy?.action === item.action ? colors.primary : colors.text}
                ]}>
                  {item.name}
                </Text>
                {activeSearchBy?.action === item.action && (
                  <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={[styles.modalFooter, {backgroundColor: isDark ? colors.card : colors.modalBg, borderTopColor: isDark ? colors.border : colors.inputBorder}]}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.secondaryButton, {backgroundColor: isDark ? colors.surface : colors.buttonSecondary, borderColor: isDark ? colors.border : colors.inputBorder}]} 
              onPress={() => {
                modalTransitionInProgress.current = true;
                setShowSpecificFilters(false);
                setTimeout(() => {
                  modalTransitionInProgress.current = false;
                }, Platform.OS === 'ios' ? 500 : 300);
              }}
            >
              <Text style={[styles.secondaryButtonText, {color: isDark ? colors.textSecondary : colors.textSecondary}]}>{translations[language].search.cancel}</Text>
            </TouchableOpacity>
          </View>
        </ModalPresentation>
      )}

      {showDateFilters && (
        <ModalPresentation
          showModal={showDateFilters}
          setShowModal={setShowDateFilters}
          onDismiss={() => {
            modalTransitionInProgress.current = true;
            setShowDateFilters(false);
            setTimeout(() => {
              modalTransitionInProgress.current = false;
            }, Platform.OS === 'ios' ? 500 : 300);
          }}
        >
          <View style={[styles.modalHeader, {backgroundColor: isDark ? colors.card : colors.modalBg, borderBottomColor: isDark ? colors.border : colors.inputBorder}]}>
            <View style={[styles.modalHeaderBar, {backgroundColor: isDark ? colors.border : colors.inputBorder}]} />
            <Text style={[styles.modalH2, {color: colors.text}]}>{translations[language].search.searchByDate}</Text>
          </View>
          
          <ScrollView style={[styles.modalScrollView, {backgroundColor: isDark ? colors.card : colors.modalBg}]} showsVerticalScrollIndicator={false}>
            {searchByDateGroup?.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.modalItem,
                  activeDate?.action === item.action && styles.modalItemActive,
                  {borderBottomColor: isDark ? colors.border : colors.inputBorder, backgroundColor: activeDate?.action === item.action ? (isDark ? `${colors.primary}26` : `${colors.primary}0D`) : 'transparent'}
                ]}
                onPress={() => handleSelectDateFilter(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  activeDate?.action === item.action && styles.modalItemTextActive,
                  {color: activeDate?.action === item.action ? colors.primary : colors.text}
                ]}>
                  {item.name}
                </Text>
                {activeDate?.action === item.action && (
                  <MaterialIcons name="check-circle" size={22} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={[styles.modalFooter, {backgroundColor: isDark ? colors.card : colors.modalBg, borderTopColor: isDark ? colors.border : colors.inputBorder}]}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.secondaryButton, {backgroundColor: isDark ? colors.surface : colors.buttonSecondary, borderColor: isDark ? colors.border : colors.inputBorder}]} 
              onPress={() => {
                modalTransitionInProgress.current = true;
                setShowDateFilters(false);
                setTimeout(() => {
                  modalTransitionInProgress.current = false;
                }, Platform.OS === 'ios' ? 500 : 300);
              }}
            >
              <Text style={[styles.secondaryButtonText, {color: isDark ? colors.textSecondary : colors.textSecondary}]}>{translations[language].search.cancel}</Text>
            </TouchableOpacity>
          </View>
        </ModalPresentation>
      )}

      {showCalendar && (
        <ModalPresentation
          showModal={showCalendar}
          setShowModal={setShowCalendar}
          onDismiss={() => {
            modalTransitionInProgress.current = true;
            setShowCalendar(false);
            setTimeout(() => {
              modalTransitionInProgress.current = false;
            }, Platform.OS === 'ios' ? 500 : 300);
          }}
        >
          <View style={[styles.calendarContainer, {backgroundColor: isDark ? colors.card : colors.modalBg}]}>
            <View style={[styles.calendarHeader, {borderBottomColor: isDark ? colors.border : colors.inputBorder}]}>
              <Text style={[styles.calendarTitle, {color: colors.text}]}>{translations[language].search.selectDate || "Select Date"}</Text>
            </View>
            
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: colors.accent, selectedTextColor: colors.textInverse },
              }}
              theme={{
                backgroundColor: isDark ? colors.card : colors.modalBg,
                calendarBackground: isDark ? colors.card : colors.modalBg,
                textSectionTitleColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.textInverse,
                todayTextColor: colors.primary,
                dayTextColor: isDark ? colors.text : colors.text,
                textDisabledColor: isDark ? colors.border : colors.textTertiary,
                dotColor: colors.primary,
                selectedDotColor: colors.textInverse,
                arrowColor: colors.primary,
                monthTextColor: isDark ? colors.text : colors.text,
                indicatorColor: colors.primary,
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
            
            <View style={[styles.calendarActions, {borderTopColor: isDark ? colors.border : colors.inputBorder}]}>
              <TouchableOpacity 
                style={[styles.calendarButton, styles.secondaryButton, {backgroundColor: isDark ? colors.surface : colors.buttonSecondary, borderColor: isDark ? colors.border : colors.inputBorder}]}
                onPress={() => {
                  modalTransitionInProgress.current = true;
                  setShowCalendar(false);
                  setTimeout(() => {
                    modalTransitionInProgress.current = false;
                  }, Platform.OS === 'ios' ? 500 : 300);
                }}
              >
                <Text style={[styles.secondaryButtonText, {color: isDark ? colors.textSecondary : colors.textSecondary}]}>{translations[language].search.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.calendarButton, styles.primaryButton]}
                onPress={handleConfirmDate}
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
          onDismiss={() => {
            modalTransitionInProgress.current = true;
            setShowFiltersModal(false);
            setTimeout(() => {
              modalTransitionInProgress.current = false;
            }, Platform.OS === 'ios' ? 500 : 300);
          }}
        >
          <View style={[styles.modalHeader, {backgroundColor: isDark ? colors.card : colors.modalBg, borderBottomColor: isDark ? colors.border : colors.inputBorder}]}>
            <View style={[styles.modalHeaderBar, {backgroundColor: isDark ? colors.border : colors.inputBorder}]} />
            <View style={styles.modalTitleContainer}>
              <Text style={[styles.modalH2, {color: colors.text}]}>{translations[language].search.selectFilter || "Select Filter"}</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  modalTransitionInProgress.current = true;
                  setShowFiltersModal(false);
                  setTimeout(() => {
                    modalTransitionInProgress.current = false;
                  }, Platform.OS === 'ios' ? 500 : 300);
                }}
              >
                <MaterialIcons name="close" size={24} color={isDark ? colors.textSecondary : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={[styles.modalScrollView, {backgroundColor: isDark ? colors.card : colors.modalBg}]} showsVerticalScrollIndicator={false}>
            {filterByGroup?.map((filter, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  activeFilter === filter.action && styles.filterOptionActive,
                  {borderBottomColor: isDark ? colors.border : colors.inputBorder, backgroundColor: activeFilter === filter.action ? (isDark ? `${colors.primary}26` : `${colors.primary}14`) : 'transparent'}
                ]}
                onPress={() => handleSelectFilter(filter)}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilter === filter.action && styles.filterOptionTextActive,
                  {color: activeFilter === filter.action ? colors.primary : colors.text}
                ]}>
                  {filter.name}
                </Text>
                {activeFilter === filter.action && (
                  <MaterialIcons name="check-circle" size={22} color={colors.primary} />
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
      elevation: 3,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.6,
      shadowRadius: 3,
      justifyContent: "flex-end",
      borderBottomWidth: 1,
  },
  search: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
  },
  inputField: {
      flexDirection: "row",
      alignItems: "center",
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
      backgroundColor: 'rgba(245, 153, 148, 0.1)',
  },
  activeIconButton: {
      backgroundColor: '#F59994',
  },
  clearButton: {
      backgroundColor: '#E1251B',
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
      paddingBottom: 10,
      marginBottom: 10,
  },
  modalH2: {
      padding: 10,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
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
      borderBottomWidth: 1,
  },
  modalItemActive: {
  },
  modalItemText: {
      fontSize: 16,
  },
  modalItemTextActive: {
      fontWeight: '600',
  },
  modalFooter: {
      marginTop: 15,
      flexDirection: "row",
      justifyContent: "center",
      borderTopWidth: 1,
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
      fontWeight: '600',
  },
  calendarContainer: {
      borderRadius: 16,
      overflow: 'hidden',
      padding: 10,
  },
  calendarHeader: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      marginBottom: 10,
  },
  calendarTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
  },
  calendarActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderTopWidth: 1,
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
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  primaryButtonText: {
      fontWeight: '600',
      fontSize: 16,
  },
  secondaryButton: {
      borderWidth: 1,
  },
  secondaryButtonText: {
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
  },
  filterOptionActive: {
  },
  filterOptionText: {
      fontSize: 17,
  },
  filterOptionTextActive: {
      fontWeight: '600',
  },
  modalHeaderBar: {
      width: 40,
      height: 5,
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
      borderRadius: 8,
      marginLeft: 10,
  },
  searchResultCountText: {
      fontSize: 13,
      fontWeight: '500',
  },
})