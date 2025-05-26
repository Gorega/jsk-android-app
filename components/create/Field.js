import { TextInput, View, Pressable, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
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


export default function Field({field, error, setSelectedValue, loadMoreData, loadingMore, prickerSearchValue, setPickerSearchValue, setFieldErrors, isRTL}) {
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState(field.currency || "ILS");
    const { language } = useLanguage();

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

    const handleCurrencySelect = (currency) => {
        setSelectedCurrency(currency);
        if (field.onCurrencyChange) {
            field.onCurrencyChange(currency);
        }
    };

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

    return (
        <View style={[
            field.visibility === "hidden" ? styles.hiddenField : styles.fieldContainer,
            field.containerStyle,
            field.type === "toggle" && [styles.toggleContainer],
            field.type === "currencyInput" && styles.currencyFieldContainer,
            error && styles.fieldError,
            field.type === "message" && styles.messageContainer
        ]}>
            {/* Field Label */}
            {field.type !== "message" && field.type !== "button" && (
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
                            <TextInput 
                                multiline={field.name !== "reference_id"}
                                style={[
                                    styles.input,
                                    field.name === "reference_id" && styles.scanInput
                                ]}
                                placeholder={field.placeholder || ""}
                                value={field.value}
                                onBlur={field.onBlur}
                                defaultValue={field.defaultValue}
                                onChangeText={(text) => {
                                    if (field.onChange) {
                                        field.onChange(text);
                                    }
                                    // Clear error when user starts typing
                                    if (error && field.name) {
                                        setFieldErrors(prev => ({
                                            ...prev,
                                            [field.name]: null
                                        }));
                                    }
                                }}
                                keyboardType={field.keyboardType || "default"}
                                placeholderTextColor="#94A3B8"
                            />
                            
                            {field.name === "reference_id" && (
                                <TouchableOpacity
                                    style={styles.scanButton}
                                    onPress={handleScanQRCode}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons name="qr-code-scanner" size={20} color="#FFFFFF" />
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
                        <Feather name="plus" size={18} color="#FFFFFF" />
                        <Text style={styles.addCurrencyButtonText}>
                            {field.value || translations[language].tabs.orders.order.add_currency}
                        </Text>
                    </TouchableOpacity>
                )}

                {field.type === "select" && (
                    <Pressable 
                        style={styles.selectField} 
                        onPress={() => setShowPickerModal(true)}
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
                        setShowPickerModal={() => setShowPickerModal(false)}
                        setSelectedValue={setSelectedValue}
                        field={field}
                        loadMoreData={loadMoreData}
                        loadingMore={loadingMore}
                        prickerSearchValue={prickerSearchValue}
                        setPickerSearchValue={setPickerSearchValue}
                        setFieldErrors={setFieldErrors}
                    />
                )}

                {field.type === "date" && (
                    <>
                        <Pressable 
                            style={styles.dateField}
                            onPress={() => setShowCalendar(true)}
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
                            setShowModal={setShowCalendar}
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
                                        onPress={() => setShowCalendar(false)}
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
        paddingHorizontal: 16,
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
        marginVertical: 12,
        padding: 0,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        backgroundColor: 'rgba(254, 243, 199, 0.5)',
        overflow: 'hidden',
    },
    messageContent: {
        flexDirection: 'row',
        padding: 16,
    },
    messageIconContainer: {
        marginRight: 12,
    },
    messageTextContainer: {
        flex: 1,
    },
    messageTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 4,
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
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 10,
        borderColor: 'rgba(203, 213, 225, 0.8)',
    },
    toggleLabel: {
        position: 'relative',
        top: 0,
        fontSize: 15,
        color: '#1F2937',
        backgroundColor: 'transparent',
    },
    toggleWrapper: {
        alignItems: 'flex-end',
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
});