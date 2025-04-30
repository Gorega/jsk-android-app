import { StyleSheet, Modal, View, Text, Pressable, TouchableOpacity, TextInput, Platform, Dimensions, KeyboardAvoidingView, SafeAreaView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FlatListData from "../FlatListData";
import { useState, useEffect } from 'react';

export default function PickerModal({list, showPickerModal, setShowPickerModal, setSelectedValue, field, loadMoreData, loadingMore, prickerSearchValue, setPickerSearchValue, setFieldErrors}) {
    const { language } = useLanguage();
    const { name } = field;
    const isRTL = ["he", "ar"].includes(language);
    const [modalHeight, setModalHeight] = useState(Dimensions.get('window').height * 0.7);

    // Adjust modal height on orientation change
    useEffect(() => {
        const updateDimensions = () => {
            setModalHeight(Dimensions.get('window').height * 0.7);
        };

        const dimensionsListener = Dimensions.addEventListener('change', updateDimensions);

        return () => {
            dimensionsListener.remove();
        };
    }, []);

    return (
        <Modal
            animationType="slide"
            visible={showPickerModal}
            onRequestClose={() => setShowPickerModal(false)}
            transparent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={[styles.contentWrapper, { height: modalHeight }]}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {translations[language].picker.choose} {field.label}
                            </Text>
                            <TouchableOpacity
                                style={[styles.closeButton, isRTL ? { left: 16 } : { right: 16 }]}
                                onPress={() => setShowPickerModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {field.showSearchBar && (
                            <View style={styles.searchContainer}>
                                <View style={[
                                    styles.searchInputContainer,
                                    { flexDirection: isRTL ? "row-reverse" : "row" }
                                ]}>
                                    <Ionicons 
                                        name="search" 
                                        size={20} 
                                        color="#6B7280" 
                                        style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                                    />
                                    <TextInput
                                        style={[
                                            styles.searchInput,
                                            { textAlign: isRTL ? "right" : "left" }
                                        ]}
                                        placeholder={translations[language].picker.searchPlaceholder}
                                        placeholderTextColor="#9CA3AF"
                                        value={prickerSearchValue}
                                        onChangeText={(input) => setPickerSearchValue(input)}
                                    />
                                </View>
                            </View>
                        )}

                        <View style={styles.listContainer}>
                            <FlatListData
                                list={list || []}
                                loadMoreData={loadMoreData || null}
                                loadingMore={loadingMore || false}
                                children={(item) => (
                                    <TouchableOpacity 
                                        style={[
                                            styles.itemContainer,
                                            { flexDirection: isRTL ? "row-reverse" : "row" }
                                        ]}
                                        onPress={() => {
                                            setSelectedValue((selectedValue) => ({...selectedValue, [name]: item}));
                                            
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
                                            
                                            setShowPickerModal(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.itemContent}>
                                            <Text 
                                                style={[
                                                    styles.itemText,
                                                    { textAlign: isRTL ? "right" : "left" }
                                                ]}
                                            >
                                                {item.label || `${item.name} ${item.phone ? "/ " + item.phone : ""}`}
                                            </Text>
                                        </View>
                                        <View style={styles.checkmarkContainer}>
                                            <Ionicons 
                                                name="chevron-forward" 
                                                size={18} 
                                                color="#4F46E5"
                                                style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => setShowPickerModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>
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
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        maxHeight: '90%',
        overflow: 'hidden',
        shadowColor: "#000",
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
        borderBottomColor: '#F3F4F6',
        position: 'relative'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        padding: 4
    },
    searchContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#374151'
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
        borderBottomColor: '#F3F4F6'
    },
    itemContent: {
        flex: 1
    },
    itemText: {
        fontSize: 16,
        color: '#374151'
    },
    checkmarkContainer: {
        paddingLeft: 8
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#F3F4F6'
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4B5563'
    }
});