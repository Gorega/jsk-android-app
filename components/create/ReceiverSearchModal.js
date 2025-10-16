import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Platform, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import ModalPresentation from "../ModalPresentation";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function ReceiverSearchModal({ 
    showModal, 
    setShowModal, 
    onReceiverSelect,
    onAddNewReceiver 
}) {
    const { language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const isRTL = language === 'ar' || language === 'he';
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const searchReceivers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            // const token = await getToken("userToken");
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/receivers?exact_phone=${encodeURIComponent(query)}&language_code=${language}&exact=true`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                        // "Cookie": token ? `token=${token}` : ""
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch receivers');
            }

            const data = await response.json();
            setSearchResults(data.data || []);
        } catch (err) {
            setError(translations[language].tabs.orders.create.sections.client.fields.search_error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Validate phone number
    const isValidPhoneNumber = (phone) => {
        // Remove any non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');
        // Check if it's exactly 10 digits
        return cleanPhone.length === 10;
    };

    // Format phone number for display (optional)
    const formatPhoneNumber = (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone;
    };

    // Handle phone number input
    const handlePhoneInput = (text) => {
        // Only allow digits
        const cleanText = text.replace(/\D/g, '');
        setSearchQuery(cleanText);
        
        // Clear any existing error
        setError(null);
        
        if (cleanText.length >= 3) {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
            const timeout = setTimeout(() => {
                searchReceivers(cleanText);
            }, 300);
            setDebounceTimeout(timeout);
        } else {
            setSearchResults([]);
        }
    };

    const handleReceiverSelect = (receiver) => {
        onReceiverSelect(receiver);
        setShowModal(false);
        setSearchQuery("");
    };

    const handleAddNew = () => {
        if (!isValidPhoneNumber(searchQuery)) {
            setError(translations[language].tabs.orders.create.sections.client.fields.invalid_phone || "Please enter a valid 10-digit phone number");
            return;
        }
        
        const formattedPhone = formatPhoneNumber(searchQuery);
        onAddNewReceiver(formattedPhone);
        setShowModal(false);
        setSearchQuery("");
    };

    return (
        <ModalPresentation
            showModal={showModal}
            setShowModal={(value) => {
                setShowModal(value);
                if (value === false) {
                    setSearchQuery("");
                    setError(null);
                    Keyboard.dismiss();
                }
            }}
            position="bottom"
        >
            <View style={[styles.container, { backgroundColor: colors.card }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {translations[language].tabs.orders.create.sections.client.fields.search_receiver || "Search Receiver"}
                    </Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            setShowModal(false);
                            setSearchQuery("");
                            setError(null);
                        }}
                    >
                        <Ionicons name="close" size={24} color={isDark ? colors.textSecondary : "#64748B"} />
                    </TouchableOpacity>
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                    <View style={[
                        styles.searchInputContainer,
                        error && styles.searchInputError,
                        { backgroundColor: isDark ? colors.surface : '#F8FAFC', borderColor: error ? '#EF4444' : isDark ? colors.border : '#E2E8F0' }
                    ]}>
                        <Feather name="search" size={20} color={isDark ? colors.textSecondary : "#64748B"} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput,{
                                ...Platform.select({
                                    ios: {
                                        textAlign:isRTL ? "right" : ""
                                    }
                                }),
                                color: colors.text
                            }]}
                            placeholder={translations[language].tabs.orders.create.sections.client.fields.search_placeholder || "Enter phone number..."}
                            value={searchQuery}
                            onChangeText={handlePhoneInput}
                            keyboardType="phone-pad"
                            maxLength={20}
                            autoFocus
                            placeholderTextColor={isDark ? colors.textSecondary : "#94A3B8"}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={() => {
                                    setSearchQuery("");
                                    setError(null);
                                }}
                            >
                                <Ionicons name="close-circle" size={20} color={isDark ? colors.textSecondary : "#94A3B8"} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>

                {/* Results */}
                <View style={styles.contentContainer}>
                    {/* Fixed Add New Button */}
                    {searchQuery.length >= 3 && (
                        <View style={[styles.bottomButtonContainer, { borderTopColor: isDark ? colors.border : '#E2E8F0' }]}>
                            <TouchableOpacity
                                style={[
                                    styles.addNewButton,
                                    !isValidPhoneNumber(searchQuery) && styles.addNewButtonDisabled,
                                    { backgroundColor: isDark ? (isValidPhoneNumber(searchQuery) ? 'rgba(67, 97, 238, 0.2)' : colors.surface) : (isValidPhoneNumber(searchQuery) ? '#EEF2FF' : '#F1F5F9') }
                                ]}
                                onPress={handleAddNew}
                                disabled={!isValidPhoneNumber(searchQuery)}
                            >
                                <MaterialIcons 
                                    name="add-circle-outline" 
                                    size={24} 
                                    color={isValidPhoneNumber(searchQuery) ? "#4361EE" : (isDark ? colors.textSecondary : "#94A3B8")} 
                                />
                                <Text style={[
                                    styles.addNewText,
                                    !isValidPhoneNumber(searchQuery) && styles.addNewTextDisabled,
                                    { color: isValidPhoneNumber(searchQuery) ? "#4361EE" : (isDark ? colors.textSecondary : "#94A3B8") }
                                ]}>
                                    {isValidPhoneNumber(searchQuery) 
                                        ? (translations[language].tabs.orders.create.sections.client.fields.add_new_receiver)
                                        : (translations[language].tabs.orders.create.sections.client.fields.enter_valid_phone)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <ScrollView style={styles.resultsContainer}>
                        {isLoading ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color="#4361EE" />
                            </View>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((receiver, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.receiverItem, { borderBottomColor: isDark ? colors.border : '#E2E8F0' }]}
                                    onPress={() => handleReceiverSelect(receiver)}
                                >
                                    <View style={[styles.receiverIcon, { backgroundColor: isDark ? 'rgba(67, 97, 238, 0.2)' : '#EEF2FF' }]}>
                                        <MaterialIcons name="person" size={24} color="#4361EE" />
                                    </View>
                                    <View style={styles.receiverInfo}>
                                        <Text style={[styles.receiverName,
                                            {
                                                textAlign: isRTL ? "left" : "left"
                                            },
                                            {
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                                color: colors.text
                                            }
                                        ]}>{receiver.name || translations[language].tabs.orders.create.sections.client.fields.unnamed}</Text>
                                        <Text style={[styles.receiverPhone,{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    },
                                                }),
                                                textAlign: isRTL ? "left" : "left",
                                                color: colors.success
                                            }]}>{receiver.phone || receiver.mobile}</Text>
                                        <Text style={[styles.receiverAddress,{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                                color: isDark ? colors.text : '#64748B'
                                            }]}>
                                            <MaterialIcons name="location-on" size={14} color={isDark ? colors.textSecondary : "#64748B"} />
                                             {receiver.city} {receiver.address && " , " + receiver.address}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : searchQuery.length >= 3 ? (
                            <View style={styles.noResultsContainer}>
                                <Text style={[styles.noResultsText, { color: isDark ? colors.textSecondary : '#64748B' }]}>
                                    {translations[language].tabs.orders.create.sections.client.fields.no_results}
                                </Text>
                            </View>
                        ) : searchQuery.length > 0 ? (
                            <View style={styles.centerContainer}>
                                <Text style={[styles.hintText, { color: isDark ? colors.textSecondary : '#64748B' }]}>
                                    {translations[language].tabs.orders.create.sections.client.fields.enter_more}
                                </Text>
                            </View>
                        ) : null}
                    </ScrollView>
                    
                </View>
            </View>
        </ModalPresentation>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: '100%',
        maxHeight: '100%',
        width: '100%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        marginBottom: 20,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    clearButton: {
        padding: 4,
    },
    contentContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    resultsContainer: {
        flex: 1,
    },
    centerContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginTop: 8,
        marginLeft: 4,
    },
    hintText: {
        fontSize: 16,
        textAlign: 'center',
    },
    noResultsContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noResultsText: {
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    bottomButtonContainer: {
        paddingTop: 12,
        paddingBottom: 4,
        borderTopWidth: 1,
    },
    addNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    addNewButtonDisabled: {
    },
    addNewText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    addNewTextDisabled: {
    },
    receiverItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        gap: 10
    },
    receiverIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    receiverName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    receiverPhone: {
        fontSize: 14,
        color: '#4361EE',
        marginBottom: 4,
    },
    receiverAddress: {
        fontSize: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInputError: {
        borderColor: '#EF4444',
    },
}); 