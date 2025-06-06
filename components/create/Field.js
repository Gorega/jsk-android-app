import { TextInput, View, Pressable, Text, StyleSheet, TouchableOpacity, Switch, FlatList, ActivityIndicator } from "react-native";
import PickerModal from "../pickerModal/PickerModal";
import { useState, useEffect } from "react";
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../ModalPresentation";
import { Calendar } from "react-native-calendars";
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { translations } from '../../utils/languageContext';
import { router } from "expo-router";
import { getToken } from "../../utils/secureStore";

export default function Field({field, error, setSelectedValue, loadMoreData, loadingMore, prickerSearchValue, setPickerSearchValue, setFieldErrors, isRTL}) {
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState(field.currency || "ILS");
    const [isFocused, setIsFocused] = useState(false);
    const { language } = useLanguage();
    const [showPhoneSearchModal, setShowPhoneSearchModal] = useState(false);
    const [phoneSearchValue, setPhoneSearchValue] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const handleDateSelect = (day) => {
        setSelectedDate(day.dateString);
        if(field.onChange) field.onChange(day.dateString);
        setShowCalendar(false);
    };

    useEffect(() => {
        if (field.currency) {
            setSelectedCurrency(field.currency);
        }
    }, [field.currency]);


    const getCurrencySymbol = (currency) => {
        switch(currency) {
            case 'ILS': return '₪';
            case 'USD': return '$';
            case 'JOD': return 'JD';
            default: return '';
        }
    };

    // Handle QR code scanning
    const handleScanQRCode = () => {
        // Store current field name to identify where to return data
        if (!global) global = {};
        global.scanTargetField = field.name;
        
        router.push("/(camera)/scanReference");
    };

    // Search receivers by phone - modified to show only exact matches
    const searchReceiversByPhone = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 3) return;
        
        try {
            setSearchLoading(true);
            const token = await getToken("userToken");
            
            // Use the correct endpoint for receiver search
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/receivers?phone=${encodeURIComponent(searchTerm)}&exact=true&language_code=${language}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        'Accept-Language': language,
                        "Cookie": token ? `token=${token}` : ""
                    },
                    credentials: "include"
                }
            );

            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                setSearchResults([]);
                setSearchLoading(false);
                return;
            }

            if (!response.ok) {
                setSearchResults([]);
                return;
            }
            
            let results = [];
            
            if (data.data && Array.isArray(data.data)) {
                // Filter for exact phone matches
                results = data.data.filter(receiver => 
                    receiver.phone === searchTerm || 
                    receiver.phone_2 === searchTerm
                );
            } else if (data.receivers && Array.isArray(data.receivers)) {
                // Some APIs might return data in a 'receivers' field
                results = data.receivers.filter(receiver => 
                    receiver.phone === searchTerm || 
                    receiver.phone_2 === searchTerm
                );
            }
            
            setSearchResults(results);
        } catch (error) {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle selecting a receiver from search results
    const selectReceiver = (receiver) => {
        if (field.onReceiverSelect) {
            field.onReceiverSelect(receiver);
        }
        setShowPhoneSearchModal(false);
        setPhoneSearchValue('');
    };

    return (
        <View style={[
            field.visibility === "hidden" ? styles.hiddenField : styles.fieldContainer,
            field.containerStyle,
            field.type === "toggle" && [styles.toggleContainer],
            field.type === "currencyInput" && styles.currencyFieldContainer,
            field.type === "orderTypeButton" && styles.orderTypeButtonContainer,
            error && styles.fieldError,
            field.type === "message" && styles.messageContainer,
            isFocused && styles.fieldFocused
        ]}>
            {/* Field Label */}
            {field.type !== "message" && field.type !== "button" && field.type !== "orderTypeButton" && (
                <Text style={[
                    styles.label,
                    { 
                        backgroundColor: "#fff",
                    }
                ]}>
                    {field.label}
                </Text>
            )}

            {/* Input Field */}
            <View style={styles.inputContent}>
                {field.type === "input" && (
                    <>
                        <View style={[
                            styles.inputWrapper,
                            field.name === "reference_id" && styles.scanInputWrapper
                        ]}>
                            {field.name === "receiver_mobile" ? (
                                <TouchableOpacity 
                                    style={styles.receiverInputWrapper}
                                    onPress={field.onPress}
                                    activeOpacity={0.7}
                                >
                                    <TextInput 
                                        style={[styles.input]}
                                        value={field.value || ""}
                                        editable={false}
                                        pointerEvents="none"
                                    />
                                </TouchableOpacity>
                            ) : (
                                <TextInput 
                                    style={[
                                        styles.input,
                                        field.name === "reference_id" && styles.scanInput
                                    ]}
                                    value={field.value || ""}
                                    onFocus={() => {
                                        if (field.onFocus === null) {
                                            return;
                                        }
                                        setIsFocused(true);
                                    }}
                                    onBlur={() => setIsFocused(false)}
                                    onChangeText={(text) => {
                                        if (field.onChange === null) {
                                            return;
                                        }
                                        if (field.onChange) {
                                            field.onChange(text);
                                        }
                                        if (error && field.name) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                [field.name]: null
                                            }));
                                        }
                                    }}
                                    placeholder={field.placeholder || ""}
                                    placeholderTextColor="#94A3B8"
                                    editable={true}
                                />
                            )}
                            
                            {field.name === "reference_id" && (
                                <TouchableOpacity
                                    style={styles.scanButton}
                                    onPress={handleScanQRCode}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="qr-code-scanner" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}

                            {field.rightIcon && (
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={field.onPress}
                                    activeOpacity={0.7}
                                >
                                    {field.rightIcon}
                                </TouchableOpacity>
                            )}
                        </View>
                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </>
                )}

                {field.type === "currencyInput" && (
                    <View style={[
                        styles.currencyInputContainer
                    ]}>
                        <TextInput 
                            style={[
                                styles.currencyInput
                            ]}
                            value={field.value}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onChangeText={(text) => {
                                if (field.onChange) {
                                    field.onChange(text);
                                }
                                if (error && field.name) {
                                    setFieldErrors(prev => ({
                                        ...prev,
                                        [field.name]: null
                                    }));
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor="#94A3B8"
                        />
                        
                        <Pressable 
                            style={styles.currencySelector}
                            onPress={() => {
                                if (field.showCurrencyPicker) {
                                    field.showCurrencyPicker(field.index);
                                }
                            }}
                        >
                            <Text style={styles.currencyText}>
                                {getCurrencySymbol(field.currency)} {field.currency}
                            </Text>
                            {field.showCurrencyPicker && (
                                <Feather 
                                    name="chevron-down" 
                                    size={16} 
                                    color="#64748B" 
                                    style={{marginLeft: 4}}
                                />
                            )}
                        </Pressable>
                    </View>
                )}

                {field.type === "addCurrencyButton" && (
                    <TouchableOpacity
                        style={styles.addCurrencyButton}
                        onPress={field.onPress}
                        activeOpacity={0.7}
                    >
                        <Feather name="plus" size={18} color="#4361EE" />
                        <Text style={styles.addCurrencyButtonText}>
                            {field.value || translations[language].tabs.orders.order.add_currency}
                        </Text>
                    </TouchableOpacity>
                )}

                {field.type === "select" && (
                    <Pressable 
                        style={styles.selectField} 
                        onPress={() => {
                            setIsFocused(true);
                            setShowPickerModal(true);
                        }}
                    >
                        <View style={[
                            styles.selectContent
                        ]}>
                            <Text style={[
                                styles.selectText
                            ]}>
                                {field.value || field.placeholder}
                            </Text>
                            <Feather 
                                name="chevron-down" 
                                size={18} 
                                color="#64748B"
                            />
                        </View>
                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </Pressable>
                )}

                {field.type === "orderTypeButton" && (
                    <TouchableOpacity
                        style={[
                            styles.orderTypeButton,
                            field.isSelected && styles.orderTypeButtonSelected
                        ]}
                        onPress={field.onPress}
                        activeOpacity={0.7}
                    >
                        {field.icon && (
                            <View>
                                {field.icon}
                            </View>
                        )}
                        <Text style={[
                            styles.orderTypeButtonText,
                            field.isSelected && styles.orderTypeButtonTextSelected
                        ]}>
                            {field.label}
                        </Text>
                    </TouchableOpacity>
                )}

                {field.type === "button" && (
                    <TouchableOpacity 
                        style={[
                            styles.button,
                            field.value === "x" ? styles.deleteButton : styles.addButton,
                            field.style
                        ]} 
                        onPress={field.onPress}
                        activeOpacity={0.7}
                    >
                        {field.value === "x" ? (
                            <FontAwesome name="times" size={16} color="#FFFFFF" />
                        ) : (
                            <View style={[
                                styles.buttonContent
                            ]}>
                                <Feather name="plus" size={16} color="#FFFFFF" />
                                <Text style={styles.buttonText}>
                                    {field.value}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {field.type === "message" && (
                    <View style={styles.messageContent}>
                        <View style={styles.messageIconContainer}>
                            <MaterialIcons name="info-outline" size={24} color="#F59E0B" />
                        </View>
                        <View style={styles.messageTextContainer}>
                            <Text style={[
                                styles.messageTitle
                            ]}>
                                {field.label}
                            </Text>
                            <Text style={[
                                styles.messageText
                            ]}>
                                {field.value}
                            </Text>
                        </View>
                    </View>
                )}

                {field.type === "checksInput" && (
                    <View style={styles.checksContainer}>
                        {field.value && field.value.length > 0 ? (
                            field.value.map((check, index) => (
                                <View key={index} style={styles.checkItem}>
                                    <View style={styles.checkHeader}>
                                        <Text style={styles.checkTitle}>{translations[language].tabs.orders.order.orderChecks.check} #{index + 1}</Text>
                                        <TouchableOpacity
                                            style={styles.removeCheckButton}
                                            onPress={() => {
                                                const updatedChecks = [...field.value];
                                                updatedChecks.splice(index, 1);
                                                field.onChange(updatedChecks);
                                            }}
                                        >
                                            <Feather name="x" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <View style={styles.checkField}>
                                        <Text style={styles.checkFieldLabel}>{translations[language].tabs.orders.order.orderChecks.number}</Text>
                                        <TextInput
                                            style={styles.checkInput}
                                            value={check.number}
                                            onChangeText={(text) => {
                                                const updatedChecks = [...field.value];
                                                updatedChecks[index] = { ...check, number: text };
                                                field.onChange(updatedChecks);
                                            }}
                                            placeholder={translations[language].tabs.orders.order.orderChecks.checkNumberPlaceholder}
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                    
                                    <View style={styles.checkRow}>
                                        <View style={[styles.checkField, { flex: 1, marginRight: 8 }]}>
                                            <Text style={styles.checkFieldLabel}>{translations[language].tabs.orders.order.orderChecks.value}</Text>
                                            <TextInput
                                                style={styles.checkInput}
                                                value={check.value ? check.value.toString() : ''}
                                                onChangeText={(text) => {
                                                    const updatedChecks = [...field.value];
                                                    updatedChecks[index] = { ...check, value: text };
                                                    field.onChange(updatedChecks);
                                                }}
                                                keyboardType="numeric"
                                                placeholder="0.00"
                                                placeholderTextColor="#94A3B8"
                                            />
                                        </View>
                                        
                                        <View style={[styles.checkField, { flex: 1 }]}>
                                            <Text style={styles.checkFieldLabel}>{translations[language].tabs.orders.order.orderChecks.currency}</Text>
                                            <View style={styles.checkCurrencySelect}>
                                                <Pressable
                                                    style={styles.currencySelector}
                                                    onPress={() => {
                                                        // Handle currency change
                                                        const currencies = ['ILS', 'USD', 'JOD'];
                                                        const currentIndex = currencies.indexOf(check.currency || 'ILS');
                                                        const nextIndex = (currentIndex + 1) % currencies.length;
                                                        
                                                        const updatedChecks = [...field.value];
                                                        updatedChecks[index] = { 
                                                            ...check, 
                                                            currency: currencies[nextIndex] 
                                                        };
                                                        field.onChange(updatedChecks);
                                                    }}
                                                >
                                                    <Text style={styles.currencyText}>
                                                        {getCurrencySymbol(check.currency || 'ILS')} {check.currency || 'ILS'}
                                                    </Text>
                                                    <Feather 
                                                        name="chevron-down" 
                                                        size={16} 
                                                        color="#64748B" 
                                                        style={{ marginLeft: 4 }}
                                                    />
                                                </Pressable>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noChecksText}>{translations[language].tabs.orders.order.orderChecks.noChecksMessage}</Text>
                        )}
                        
                        <TouchableOpacity
                            style={styles.addCheckButton}
                            onPress={() => {
                                const newCheck = {
                                    number: '',
                                    date: new Date().toISOString().split('T')[0],
                                    value: '',
                                    currency: 'ILS'
                                };
                                field.onChange([...(field.value || []), newCheck]);
                            }}
                        >
                            <Feather name="plus" size={18} color="#FFFFFF" />
                            <Text style={styles.addCheckButtonText}>
                                {translations[language].tabs.orders.order.orderChecks.addCheck}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Picker Modal */}
                {showPickerModal && (
                    <PickerModal
                        list={field.list}
                        showPickerModal={showPickerModal}
                        setShowPickerModal={() => {
                            setShowPickerModal(false);
                            setIsFocused(false);
                        }}
                        setSelectedValue={setSelectedValue}
                        field={field}
                        loadMoreData={loadMoreData}
                        loadingMore={loadingMore}
                        prickerSearchValue={prickerSearchValue}
                        setPickerSearchValue={setPickerSearchValue}
                        setFieldErrors={setFieldErrors}
                    />
                )}

                {/* Phone Search Modal */}
                {showPhoneSearchModal && (
                    <ModalPresentation
                        showModal={showPhoneSearchModal}
                        setShowModal={() => setShowPhoneSearchModal(false)}
                    >
                        <View style={styles.phoneSearchContainer}>
                            <View style={styles.phoneSearchHeader}>
                                <Text style={styles.phoneSearchTitle}>
                                    {translations[language]?.tabs?.orders?.create?.sections?.client?.fields?.searchReceiver}
                                </Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setShowPhoneSearchModal(false)}
                                >
                                    <Feather name="x" size={22} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.phoneSearchInputContainer}>
                                <TextInput
                                    style={styles.phoneSearchInput}
                                    value={phoneSearchValue}
                                    onChangeText={(text) => {
                                        setPhoneSearchValue(text);
                                        if (text.length >= 3) {
                                            searchReceiversByPhone(text);
                                        }
                                    }}
                                    placeholder={translations[language]?.tabs?.orders?.create?.sections?.client?.fields?.enterPhone}
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="phone-pad"
                                    autoFocus={true}
                                />
                                <TouchableOpacity
                                    style={styles.phoneSearchButton}
                                    onPress={() => searchReceiversByPhone(phoneSearchValue)}
                                    disabled={!phoneSearchValue || phoneSearchValue.length < 3}
                                >
                                    <Feather 
                                        name="search" 
                                        size={20} 
                                        color="#FFFFFF" 
                                    />
                                </TouchableOpacity>
                            </View>
                            
                            {/* Debug info */}
                            <Text style={{color: '#64748B', marginBottom: 8}}>
                            {translations[language]?.tabs?.orders?.create?.sections?.client?.fields?.found} {searchResults.length} {translations[language]?.tabs?.orders?.create?.sections?.client?.fields?.receivers}
                            </Text>
                            
                            <View style={{flex: 1, minHeight: 200}}>
                                {searchLoading ? (
                                    <ActivityIndicator size="large" color="#4361EE" style={styles.searchLoader} />
                                ) : (
                                    <>
                                        {searchResults.length > 0 ? (
                                            <FlatList
                                                data={searchResults}
                                                keyExtractor={(item) => (item.receiver_id || item.id || Math.random().toString()).toString()}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={styles.receiverItem}
                                                        onPress={() => selectReceiver(item)}
                                                    >
                                                        <View style={styles.receiverInfo}>
                                                            <Text style={styles.receiverName}>{item.name || 'Unknown'}</Text>
                                                            <Text style={styles.receiverPhone}>{item.phone || item.mobile || 'No phone'}</Text>
                                                            {(item.address || item.city || item.area) && (
                                                                <Text style={styles.receiverAddress}>
                                                                    {[item.city, item.area, item.address].filter(Boolean).join(', ')}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <Feather name="chevron-right" size={20} color="#64748B" />
                                                    </TouchableOpacity>
                                                )}
                                                style={[styles.resultsList, {height: 200}]}
                                                contentContainerStyle={styles.resultsContent}
                                            />
                                        ) : (
                                            phoneSearchValue && phoneSearchValue.length >= 3 && !searchLoading && (
                                                <Text style={styles.noResults}>
                                                    {translations[language]?.tabs?.orders?.create?.sections?.client?.fields?.noReceivers}
                                                </Text>
                                            )
                                        )}
                                    </>
                                )}
                            </View>
                        </View>
                    </ModalPresentation>
                )}

                {field.type === "date" && (
                    <>
                        <Pressable 
                            style={styles.dateField}
                            onPress={() => {
                                setIsFocused(true);
                                setShowCalendar(true);
                            }}
                        >
                            <View style={[
                                styles.dateContent
                            ]}>
                                <Text style={[
                                    styles.dateText
                                ]}>
                                    {selectedDate || field.value || "Select Date"}
                                </Text>
                                <Feather 
                                    name="calendar" 
                                    size={18} 
                                    color="#64748B"
                                />
                            </View>
                        </Pressable>

                        <ModalPresentation
                            showModal={showCalendar}
                            setShowModal={() => {
                                setShowCalendar(false);
                                setIsFocused(false);
                            }}
                        >
                            <View style={styles.calendarContainer}>
                                <Calendar
                                    onDayPress={handleDateSelect}
                                    markedDates={{
                                        [selectedDate]: { 
                                            selected: true, 
                                            selectedColor: '#4361EE' 
                                        },
                                    }}
                                    theme={{
                                        todayTextColor: "#4361EE",
                                        arrowColor: "#4361EE",
                                        textDayFontWeight: '300',
                                        textMonthFontWeight: 'bold',
                                        textDayHeaderFontWeight: '300',
                                    }}
                                />
                                <View style={styles.calendarButtons}>
                                    <TouchableOpacity 
                                        style={styles.calendarButton}
                                        onPress={() => {
                                            setShowCalendar(false);
                                            setIsFocused(false);
                                        }}
                                    >
                                        <Text style={{ color: "#4361EE" }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ModalPresentation>
                    </>
                )}

                {field.type === "toggle" && (
                    <View style={[styles.toggleWrapper]}>
                        <Text style={{display: 'none'}}>{/* Empty text component to prevent warning */}</Text>
                        <Switch
                            value={field.value}
                            onValueChange={(value) => {
                                if (field.onChange) {
                                    field.onChange(value);
                                }
                            }}
                            disabled={field.disabled}
                            trackColor={{ false: "#CBD5E1", true: "#4361EE" }}
                            thumbColor={field.value ? "#fff" : "#f4f3f4"}
                            ios_backgroundColor="#CBD5E1"
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fieldContainer: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 12,
        marginVertical: 10,
        position: 'relative',
        borderColor: 'rgba(203, 213, 225, 0.8)',
        backgroundColor: 'white',
    },
    fieldError: {
        borderColor: '#EF4444',
        borderWidth: 1,
    },
    fieldFocused: {
        borderColor: '#4361EE',
        borderWidth: 1,
    },
    label: {
        position: 'absolute',
        top: -10,
        paddingHorizontal: 5,
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
        zIndex: 1,
    },
    inputContent: {
        paddingTop: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scanInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        fontSize: 15,
        paddingVertical: 4,
        color: '#1F2937',
        flex: 1,
    },
    scanInput: {
        flex: 1,
    },
    scanButton: {
        backgroundColor: '#4361EE',
        borderRadius: 8,
        padding: 8,
        marginLeft: 8,
    },
    searchPhoneButton: {
        backgroundColor: '#4361EE',
        borderRadius: 8,
        padding: 8,
        marginLeft: 8,
    },
    selectField: {
        paddingVertical: 4,
    },
    selectContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: {
        fontSize: 15,
        color: '#1F2937',
        flex: 1,
    },
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        backgroundColor: '#4361EE',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    calendarContainer: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        width: '90%',
        maxWidth: 360,
    },
    calendarButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 16,
        gap: 15,
    },
    calendarButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    dateField: {
        paddingVertical: 4,
    },
    dateContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateText: {
        fontSize: 15,
        color: '#1F2937',
        flex: 1,
    },
    hiddenField: {
        display: "none"
    },
    messageContainer: {
        borderWidth: 1,
        borderRadius: 10,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        backgroundColor: 'rgba(254, 243, 199, 0.5)',
        overflow: 'hidden',
    },
    messageContent: {
        flexDirection: 'row',
        gap: 10,
    },
    messageTextContainer: {
        flex: 1,
    },
    messageTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
    },
    messageText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 5,
    },
    currencyFieldContainer: {
        marginBottom: 12,
    },
    currencyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    currencyInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 4,
        color: '#1F2937',
    },
    currencySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 6,
        backgroundColor: 'rgba(203, 213, 225, 0.2)',
    },
    currencyText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4361EE',
    },
    addCurrencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 4,
    },
    addCurrencyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4361EE',
        marginLeft: 8,
    },
    checksContainer: {
        marginTop: 8
    },
    checkItem: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#F8FAFC',
    },
    checkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    removeCheckButton: {
        padding: 4,
    },
    checkField: {
        marginBottom: 10,
    },
    checkFieldLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 4,
    },
    checkInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    checkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    checkCurrencySelect: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
    },
    addCheckButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4361EE',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addCheckButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    noChecksText: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 14,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    // Order type buttons
    orderTypeButtonContainer: {
        margin: 0,
        padding: 0,
        borderWidth: 0,
        flex: 1,
        minWidth: '23%',
    },
    orderTypeButton: {
        backgroundColor: '#F8FAFC',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        borderRadius: 10,
        gap: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 60,
    },
    orderTypeButtonSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4361EE',
        shadowColor: '#4361EE',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    orderTypeButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center',
    },
    orderTypeButtonTextSelected: {
        color: '#4361EE',
    },
    // Phone search modal styles
    phoneSearchContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        height: '100%',
    },
    phoneSearchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    phoneSearchTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    phoneSearchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    phoneSearchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1F2937',
    },
    phoneSearchButton: {
        backgroundColor: '#4361EE',
        borderRadius: 8,
        padding: 12,
    },
    resultsList: {
        flex: 1,
        height: 300,
    },
    resultsContent: {
        paddingBottom: 16,
    },
    receiverItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    receiverInfo: {
        flex: 1,
    },
    receiverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    receiverPhone: {
        fontSize: 14,
        color: '#4361EE',
        marginBottom: 4,
    },
    receiverAddress: {
        fontSize: 13,
        color: '#64748B',
    },
    noResults: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 16,
        padding: 20,
    },
    inputText: {
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    placeholderText: {
        color: '#94A3B8',
    },
    receiverInputWrapper: {
        flex: 1,
        borderRadius: 8,
    },
    searchButton: {
        backgroundColor: '#4361EE',
        borderRadius: 8,
        padding: 8,
        marginLeft: 8,
    },
    searchLoader: {
        marginTop: 20,
    },
    receiverInput: {
        flex: 1,
    },
});