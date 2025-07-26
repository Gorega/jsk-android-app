import { StyleSheet, Modal, View, Text, TouchableOpacity, TextInput, Platform, Dimensions, ActivityIndicator, KeyboardAvoidingView, SafeAreaView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import FlatListData from "../FlatListData";
import { useState, useMemo } from 'react';

export default function PickerModal({list, showPickerModal, setShowModal, setSelectedValue, field, loading, loadMoreData, loadingMore, prickerSearchValue: externalSearchValue, setPickerSearchValue: setExternalSearchValue, setFieldErrors, searchLoading, allowClear = false}) {
    const { language } = useLanguage();
    const { colorScheme, isDark } = useTheme();
    const colors = Colors[colorScheme];
    const { name } = field;
    const [modalHeight, setModalHeight] = useState(Dimensions.get('window').height * 0.7);
    const isRTL = language === 'ar' || language === 'he';
    
    // Local search state when external search state is not provided
    const [internalSearchValue, setInternalSearchValue] = useState("");
    
    // Use external search state if provided, otherwise use internal state
    const searchValue = externalSearchValue !== undefined ? externalSearchValue : internalSearchValue;
    const setSearchValue = setExternalSearchValue || setInternalSearchValue;

    // Filter list based on search value
    const filteredList = useMemo(() => {
        if (!searchValue || !list?.length) return list;
        
        return list.filter(item => {
            const searchText = searchValue.toLowerCase();
            const itemLabel = (item.label || item.name || '').toLowerCase();
            return itemLabel.includes(searchText);
        });
    }, [list, searchValue]);

    // Function to handle modal close with filter clearing
    const handleCloseModal = () => {
        setSearchValue('');
        setShowModal(false);
    };

    // Function to clear the selection
    const handleClearSelection = () => {
        if (typeof setSelectedValue === 'function') {
            // Use the same consistent approach as item selection
            setSelectedValue((prevValue) => {
                // Create a new object with the cleared value
                const newValue = {...prevValue};
                newValue[name] = null;
                return newValue;
            });
        }
        setSearchValue('');
        setShowModal(false);
    };

    return (
        <Modal
            animationType="slide"
            visible={showPickerModal}
            onRequestClose={handleCloseModal}
            transparent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={[styles.contentWrapper, { 
                        height: modalHeight,
                        backgroundColor: colors.card,
                        shadowColor: colors.cardShadow
                    }]}>
                        <View style={[styles.header, {
                            borderBottomColor: colors.border
                        }]}>
                            <Text style={[styles.headerTitle, { color: colors.text },{
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "right" : ""
                                    }
                                }),
                                color: colors.text
                            }]}>
                                {translations[language].picker.choose} {field.label}
                            </Text>
                            <TouchableOpacity
                                style={[styles.closeButton]}
                                onPress={handleCloseModal}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {field.showSearchBar && (
                            <View style={[styles.searchContainer, {
                                borderBottomColor: colors.border
                            }]}>
                                <View style={[
                                    styles.searchInputContainer,
                                    { backgroundColor: colors.inputBg }
                                ]}>
                                    <Ionicons 
                                        name="search" 
                                        size={20} 
                                        color={colors.textSecondary} 
                                    />
                                    <TextInput
                                        style={[
                                            styles.searchInput,
                                            { color: colors.inputText },
                                            {
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "right" : ""
                                                    }
                                                }),
                                            }
                                        ]}
                                        placeholder={translations[language].picker.searchPlaceholder}
                                        placeholderTextColor={colors.textTertiary}
                                        value={searchValue}
                                        onChangeText={(input) => setSearchValue(input)}
                                        autoFocus={true}
                                    />
                                    {searchLoading && (
                                        <ActivityIndicator 
                                            size="small" 
                                            color={colors.primary}
                                            style={styles.searchLoadingIndicator} 
                                        />
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.listContainer}>
                            {loading ? <ActivityIndicator size="small" color={colors.primary} />
                             :
                             <FlatListData
                                list={filteredList || []}
                                loadMoreData={loadMoreData || null}
                                loadingMore={loadingMore || false}
                                children={(item) => (
                                    <TouchableOpacity 
                                        style={[
                                            styles.itemContainer,
                                            { borderBottomColor: colors.border }
                                        ]}
                                        onPress={() => {
                                            // Always use the object spread approach for consistency
                                            if (typeof setSelectedValue === 'function') {
                                                setSelectedValue((prevValue) => {
                                                    // Create a new object with the updated value
                                                    const newValue = {...prevValue};
                                                    newValue[name] = item;
                                                    return newValue;
                                                });
                                            }
                                            
                                            // Clear any error for this field
                                            const fieldNameMap = {
                                                'sender': 'sender',
                                                'city': 'city',
                                                'paymentType': 'payment_type',
                                                'orderType': 'order_type',
                                                'itemsType': 'items_type'
                                            };
                                            
                                            if (setFieldErrors) {
                                                const serverFieldName = fieldNameMap[name] || name;
                                                setFieldErrors(prev => {
                                                    const updated = {...prev};
                                                    if (updated[serverFieldName]) {
                                                        delete updated[serverFieldName];
                                                    }
                                                    return updated;
                                                });
                                            }
                                            
                                            // Clear search and close modal
                                            setSearchValue('');
                                            setShowModal(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.itemContent}>
                                            <Text 
                                                style={[
                                                    styles.itemText,
                                                    { color: colors.text }
                                                ]}
                                            >
                                                {item.label || `${item.name} ${item.phone ? "/ " + item.phone : ""}`}
                                            </Text>
                                        </View>
                                        <View style={styles.checkmarkContainer}>
                                            <Ionicons 
                                                name={isRTL ? "chevron-back" : "chevron-forward"} 
                                                size={18} 
                                                color={colors.primary}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            /> }
                        </View>

                        <View style={[styles.footer, {
                            borderTopColor: colors.border
                        }]}>
                            {allowClear && (
                                <TouchableOpacity 
                                    style={[styles.clearButton, {
                                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                                    }]}
                                    onPress={handleClearSelection}
                                >
                                    <Text style={[styles.clearButtonText, {
                                        color: colors.error
                                    }]}>
                                        {translations[language]?.picker?.clear}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                                style={[styles.cancelButton, {
                                    backgroundColor: colors.buttonSecondary
                                }]}
                                onPress={handleCloseModal}
                            >
                                <Text style={[styles.cancelButtonText, {
                                    color: isDark ? colors.text : colors.textSecondary
                                }]}>
                                    {translations[language].picker.cancel}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    safeArea: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    contentWrapper: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        maxHeight: '90%',
        overflow: 'hidden',
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4.65,
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        position: 'relative'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        padding: 4,
        left: 16
    },
    searchContainer: {
        padding: 16,
        borderBottomWidth: 1,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    listContainer: {
        flex: 1
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    itemContent: {
    },
    itemText: {
        fontSize: 16,
    },
    checkmarkContainer: {
        paddingLeft: 8
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        borderTopWidth: 1,
        gap: 12
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center',
    },
    clearButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        minWidth: 120,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    searchLoadingIndicator: {
        position: 'absolute',
        right: 12,
    },
});