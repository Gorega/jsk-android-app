import { View, StyleSheet, ScrollView, Text, Alert, ActivityIndicator, Keyboard, TouchableOpacity, I18nManager } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState, useRef, React, useCallback } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../RootLayout";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import ModalPresentation from "../../components/ModalPresentation";
import { getToken } from "../../utils/secureStore";
import { useFocusEffect } from '@react-navigation/native';
import Field from "../../components/create/Field";

export default function HomeScreen() {
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState({});
    const [formSpinner, setFormSpinner] = useState({})
    const [fieldErrors, setFieldErrors] = useState({});
    const { orderId } = useLocalSearchParams();
    const [senders, setSenders] = useState([]);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const { user } = useAuth()
    const [cities, setCities] = useState([]);
    const [orderTypes, setOrderTypes] = useState([{
        name: translations[language].tabs.orders.create.sections.orderTypes?.delivery,
        value: "delivery"
    }, {
        name: translations[language].tabs.orders.create.sections.orderTypes?.receive,
        value: "receive"
    }, {
        name: translations[language].tabs.orders.create.sections.orderTypes["delivery/receive"],
        value: "delivery/receive"
    }, {
        name: translations[language].tabs.orders.create.sections.orderTypes?.payment,
        value: "payment"
    }]);
    const [paymentTypes, setPaymentTypes] = useState([{
        name: translations[language].tabs.orders.create.sections.paymentType.cash,
        value: "cash"
    }, {
        name: translations[language].tabs.orders.create.sections.paymentType.check,
        value: "check"
    }, {
        name: translations[language].tabs.orders.create.sections.paymentType["cash/check"],
        value: "cash/check"
    }]);
    const [currencyList, setCurrencyList] = useState([{
        name: translations[language].tabs.orders.create.sections.currencyList.ILS,
        value: "ILS"
    }, {
        name: translations[language].tabs.orders.create.sections.currencyList.USD,
        value: "USD"
    }, {
        name: translations[language].tabs.orders.create.sections.currencyList.JOD,
        value: "JOD"
    }]);
    const [itemsContentTypeList, setItemsContentTypeList] = useState([{
        name: translations[language].tabs.orders.create.sections?.itemsContentTypeList?.normal,
        value: "normal"
    }, {
        name: translations[language].tabs.orders.create.sections?.itemsContentTypeList?.large,
        value: "large"
    }, {
        name: translations[language].tabs.orders.create.sections?.itemsContentTypeList?.extra_large,
        value: "extra_large"
    }, {
        name: translations[language].tabs.orders.create.sections?.itemsContentTypeList?.fragile,
        value: "fragile"
    }, {
        name: translations[language].tabs.orders.create.sections?.itemsContentTypeList?.high_value,
        value: "high_value"
    }]);
    const [checks, setChecks] = useState([]);
    const [prickerSearchValue, setPickerSearchValue] = useState("");
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [returnedOrdersMessage, setReturnedOrdersMessage] = useState('');
    const [form, setForm] = useState({})
    const [selectedValue, setSelectedValue] = useState({
        sender: "",
        city: "",
        orderType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.orderTypes?.delivery, value: "delivery" },
        paymentType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.paymentType?.cash, value: "cash" },
        currency: orderId ? "" : { name: translations[language].tabs.orders.create.sections.currencyList?.ILS, value: "ILS" },
        itemsType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.itemsCotnentType?.normal, value: "normal" },
    });
    const scrollViewRef = useRef(null);
    const [showAlert, setShowAlert] = useState({
        visible: false,
        type: 'error',
        title: '',
        message: '',
        onClose: null
    });
    const [codAmounts, setCodAmounts] = useState([{ value: "", currency: "ILS" }]);
    const [activeCurrencyPicker, setActiveCurrencyPicker] = useState(null);
    const [fromBusinessBalance, setFromBusinessBalance] = useState(false);
    const [exceedBusinessBalance, setExceedBusinessBalance] = useState(false);

    const CURRENCY_EXCHANGE_RATES = {
        ILS_TO_USD: 0.27,  // 1 ILS = 0.27 USD
        ILS_TO_JOD: 0.19,  // 1 ILS = 0.19 JOD
        USD_TO_ILS: 3.7,   // 1 USD = 3.7 ILS
        USD_TO_JOD: 0.71,  // 1 USD = 0.71 JOD
        JOD_TO_ILS: 5,     // 1 JOD = 5 ILS
        JOD_TO_USD: 1.41,  // 1 JOD = 1.41 USD
    };

    const convertCurrency = (amount, fromCurrency, toCurrency) => {
        if (fromCurrency === toCurrency) return amount;
        
        const conversionKey = `${fromCurrency}_TO_${toCurrency}`;
        const rate = CURRENCY_EXCHANGE_RATES[conversionKey];
        
        if (!rate) {
            return null;
        }
        
        return amount * rate;
    };

    const calculateNetValue = (codValue, codCurrency, deliveryFeeValue, deliveryFeeCurrency, 
                              commissionValue, commissionCurrency, discountValue, discountCurrency,
                              targetCurrency) => {
        // Convert all values to the target currency if they're different
        const codInTargetCurrency = codCurrency === targetCurrency ? 
            codValue : convertCurrency(codValue, codCurrency, targetCurrency);
            
        const deliveryFeeInTargetCurrency = deliveryFeeCurrency === targetCurrency ?
            deliveryFeeValue : convertCurrency(deliveryFeeValue, deliveryFeeCurrency, targetCurrency);
            
        const commissionInTargetCurrency = commissionCurrency === targetCurrency ?
            commissionValue : convertCurrency(commissionValue, commissionCurrency, targetCurrency);
            
        const discountInTargetCurrency = discountCurrency === targetCurrency ?
            discountValue : convertCurrency(discountValue, discountCurrency, targetCurrency);
        
        // Calculate net value: COD Value - Discount + (Commission + Delivery Fee)
        const netValue = codInTargetCurrency - discountInTargetCurrency + 
                         (commissionInTargetCurrency + deliveryFeeInTargetCurrency);
                         
        return Math.max(0, netValue); // Don't allow negative net values
    };

    const getUserBalances = async (userId) => {
        try {
            const token = await getToken("userToken");
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/balances`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : ""
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch balances: ${response.status}`);
            }
            
            const data = await response.json();
            return data.data || { ILS: 0, USD: 0, JOD: 0 };
        } catch (error) {
            return { ILS: 0, USD: 0, JOD: 0 };
        }
    };

    const submitBalanceDeduction = async (userId, deductions, orderId) => {
        try {
            // Add validation
            if (!userId) {
                throw new Error('User ID is required for deduction');
            }
            
            // Ensure all deduction values are valid numbers
            const validatedDeductions = {};
            Object.entries(deductions).forEach(([currency, amount]) => {
                const numAmount = parseFloat(amount);
                if (!isNaN(numAmount) && numAmount > 0) {
                    validatedDeductions[currency] = numAmount;
                }
            });
            
            // If no valid deductions, throw error
            if (Object.keys(validatedDeductions).length === 0) {
                throw new Error('No valid deduction amounts found');
            }

            const token = await getToken("userToken");
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}/deduct-balance`, {
                method: 'POST',
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': language,
                    "Cookie": token ? `token=${token}` : ""
                },
                body: JSON.stringify({
                    userId: userId, // Add userId to body as well
                    deductions: validatedDeductions,
                    order_id: orderId,
                    reference_type: 'payment',
                    notes: 'Order payment deduction'
                })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to process deduction');
            }
            
            return responseData;
        } catch (error) {
            throw error;
        }
    };

    const processDeduction = async (orderId, senderId) => {
        try {
            // Show loading spinner
            setShowAlert({
                visible: true,
                type: 'loading',
                title: translations[language].tabs.orders.create.sections.sender.fields.processing_deduction || "Processing Deduction",
                message: translations[language].tabs.orders.create.sections.sender.fields.please_wait || "Please wait..."
            });

            const deductionInfo = form.balanceDeduction;
            let deductions = {};
                        
            // Extract values needed for net value calculations
            const deliveryFeeValue = parseFloat(deliveryFee) || 0;
            const deliveryFeeCurrency = 'ILS'; // Default currency for delivery fee
            
            const commissionValue = 0; // No commission in mobile app
            const commissionCurrency = 'ILS';
            
            const discountValue = 0; // No discount in mobile app
            const discountCurrency = 'ILS';
            
            // Handle various formats of deduction info
            if (deductionInfo?.method === 'manual') {
                if (deductionInfo.currency && !isNaN(parseFloat(deductionInfo.amount))) {
                    deductions[deductionInfo.currency] = parseFloat(deductionInfo.amount);
                }
            } else if (deductionInfo?.method === 'auto') {
                // For auto method, use deductions object directly
                if (deductionInfo.deductions && typeof deductionInfo.deductions === 'object') {
                    deductions = deductionInfo.deductions;
                }
            } else if (codAmounts && codAmounts.length > 0) {
                // Use net value calculation instead of just COD values
                codAmounts.forEach(cod => {
                    const codValue = parseFloat(cod.value || 0);
                    const codCurrency = cod.currency || 'ILS';
                    
                    if (codValue > 0) {
                        // Calculate net value using our helper function
                        const netValue = calculateNetValue(
                            codValue, codCurrency,
                            deliveryFeeValue, deliveryFeeCurrency,
                            commissionValue, commissionCurrency,
                            discountValue, discountCurrency,
                            codCurrency
                        );
                        
                        deductions[codCurrency] = (deductions[codCurrency] || 0) + netValue;
                    }
                });
            }
            
            if (!senderId || !deductions || Object.keys(deductions).length === 0) {
                setShowAlert({
                    visible: false
                });
                throw new Error('Invalid deduction data - missing userId, orderId or deduction amounts');
            }

            const deductionResult = await submitBalanceDeduction(
                senderId, 
                deductions, 
                orderId
            );

            // Close loading spinner
            setShowAlert({
                visible: false
            });

            // Show success message
            Alert.alert(
                translations[language].tabs.orders.create.sections.sender.fields.deduction_success || "Deduction Successful",
                translations[language].tabs.orders.create.sections.sender.fields.deduction_processed || "Deduction has been processed successfully",
                [{ text: "OK" }]
            );

            return deductionResult;
        } catch (error) {
            setShowAlert({
                visible: false
            });
            throw error;
        }
    };

    const sections = [{
        isHeader: true,
        fields: (
            <View>
                <Text style={styles.orderTypeHeaderText}>{translations[language].tabs.orders.create.sections.orderTypes.titlePlaceholder}</Text>
                <View style={styles.orderTypeButtonsContainer}>
                    {orderTypes.map((type, index) => (
                        <Field
                            key={index}
                            field={{
                                type: "orderTypeButton",
                                label: type.name,
                                isSelected: selectedValue.orderType?.value === type.value,
                                icon: type.value === "delivery" ? <MaterialIcons name="local-shipping" size={18} color={selectedValue.orderType?.value === "delivery" ? "#4361EE" : "#64748B"} /> :
                                      type.value === "receive" ? <MaterialIcons name="store" size={18} color={selectedValue.orderType?.value === "receive" ? "#4361EE" : "#64748B"} /> :
                                      type.value === "delivery/receive" ? <MaterialIcons name="sync" size={18} color={selectedValue.orderType?.value === "delivery/receive" ? "#4361EE" : "#64748B"} /> :
                                      <MaterialIcons name="payments" size={18} color={selectedValue.orderType?.value === "payment" ? "#4361EE" : "#64748B"} />,
                                onPress: () => setSelectedValue(prev => ({
                                    ...prev,
                                    orderType: type
                                }))
                            }}
                        />
                    ))}
                </View>
                {["business", "admin", "manager"].includes(user.role) && (
                    <View style={styles.businessBalanceToggleContainer}>
                        {user.role === "business" && 
                         (selectedValue.orderType?.value === "receive" || 
                          selectedValue.orderType?.value === "payment") ? (
                            <Field
                                field={{
                                    type: "message",
                                    label: translations[language]?.tabs?.orders?.create?.sections?.sender?.fields?.auto_deduction_notice,
                                    value: translations[language]?.tabs?.orders?.create?.sections?.sender?.fields?.auto_deduction_message
                                }}
                            />
                        ) : (
                            <Field
                                field={{
                                    type: "toggle",
                                    label: ["admin", "manager"].includes(user.role) ? 
                                        translations[language].tabs.orders.create.sections.sender.fields.sender_deduct : 
                                        translations[language].tabs.orders.create.sections.sender.fields.my_balance_deduct,
                                    name: "from_business_balance",
                                    value: form.fromBusinessBalance || false,
                                    onChange: async (value) => {
                                        try {
                                            // If unchecking the box (value is false), confirm with user before changing state
                                            if (!value) {
                                                // Get sender ID based on user role
                                                const senderId = user.role === "business" ? 
                                                    user.userId : 
                                                    selectedValue.sender.user_id;
                                                
                                                if (!senderId) {
                                                    return;
                                                }

                                                // Only proceed if we're in edit mode and have an order ID
                                                if (!orderId) {
                                                    setFromBusinessBalance(false);
                                                    setForm(prevForm => ({
                                                        ...prevForm,
                                                        fromBusinessBalance: false,
                                                        balanceDeduction: null
                                                    }));
                                                    return;
                                                }
                                                
                                                // Confirm with user before returning balance
                                                Alert.alert(
                                                    translations[language].tabs.orders.create.sections.sender.fields.confirm_balance_return || "Confirm Balance Return",
                                                    translations[language].tabs.orders.create.sections.sender.fields.return_balance_confirmation || "Do you want to return the previously deducted amounts to the sender's balance?",
                                                    [
                                                        {
                                                            text: translations[language].no || "No",
                                                            style: "cancel"
                                                        },
                                                        {
                                                            text: translations[language].yes || "Yes",
                                                            onPress: async () => {
                                                                setFromBusinessBalance(false); // Set state to false only if user confirms
                                                                try {
                                                                    // Show loading spinner
                                                                    setShowAlert({
                                                                        visible: true,
                                                                        type: 'loading',
                                                                        title: translations[language].tabs.orders.create.sections.sender.fields.processing_return || "Processing Return",
                                                                        message: translations[language].tabs.orders.create.sections.sender.fields.please_wait || "Please wait...",
                                                                        onClose: () => setShowAlert({visible: false})
                                                                    });
                                                                            
                                                                    const token = await getToken("userToken");
                                                                    const returnResponse = await fetch(
                                                                        `${process.env.EXPO_PUBLIC_API_URL}/api/users/${senderId}/return-balance`,
                                                                        {
                                                                            method: 'POST',
                                                                            credentials: "include",
                                                                            headers: {
                                                                                "Content-Type": "application/json",
                                                                                "Cookie": token ? `token=${token}` : ""
                                                                            },
                                                                            body: JSON.stringify({
                                                                                order_id: orderId,
                                                                                reference_type: 'transaction'
                                                                            })
                                                                        }
                                                                    );

                                                                    // Close loading spinner
                                                                    setShowAlert({
                                                                        visible: false
                                                                    });
                                                                    
                                                                    // Process the response
                                                                    const responseData = await returnResponse.json();
                                                                    
                                                                    if (!returnResponse.ok) {
                                                                        throw new Error(responseData.message || `Failed to return balance: ${returnResponse.status}`);
                                                                    }
                                                                    
                                                                    // Success message
                                                                    Alert.alert(
                                                                        translations[language].tabs.orders.create.sections.sender.fields.return_success || "Return Successful",
                                                                        translations[language].tabs.orders.create.sections.sender.fields.balance_returned || "Balance has been returned successfully",
                                                                        [{ text: "OK" }]
                                                                    );
                                                                    
                                                                    // Update form data
                                                                    setForm(prevForm => ({
                                                                        ...prevForm,
                                                                        fromBusinessBalance: false,
                                                                        balanceDeduction: null
                                                                    }));
                                                                } catch (returnError) {
                                                                    setShowAlert({
                                                                        visible: false
                                                                    });
                                                                    Alert.alert(
                                                                        translations[language].tabs.orders.create.sections.sender.fields.return_error || "Return Error",
                                                                        returnError.message || translations[language].tabs.orders.create.sections.sender.fields.return_failed || "Failed to return balance",
                                                                        [{ text: "OK" }]
                                                                    );
                                                                }
                                                            }
                                                        }
                                                    ]
                                                );
                                                return;
                                            }

                                            // Rest of the existing function for when value is true (toggle is being enabled)
                                            // Get sender ID based on user role
                                            const senderId = user.role === "business" ? user.userId : 
                                                           (selectedValue.sender && selectedValue.sender.user_id ? 
                                                            selectedValue.sender.user_id : null);
                                            
                                            // Validate sender ID
                                            if (!senderId) {
                                                return Alert.alert(
                                                    translations[language].tabs.orders.create.error || "Error",
                                                    translations[language].tabs.orders.create.sections.sender.fields.sender_required || "Sender is required",
                                                    [{ text: "OK" }]
                                                );
                                            }
                                            
                                            // Get COD values from form data
                                            if (!codAmounts || codAmounts.length === 0 || codAmounts.every(cod => !cod.value || parseFloat(cod.value) <= 0)) {
                                                return Alert.alert(
                                                    translations[language].tabs.orders.create.error || "Error",
                                                    translations[language].tabs.orders.create.sections.sender.fields.cod_required || "COD is required",
                                                    [{ text: "OK" }]
                                                );
                                            }
                                            
                                            // Format COD values for display and processing
                                            const formattedCodValues = {};
                                            let totalCodAmount = 0;
                                            
                                            codAmounts.forEach(cod => {
                                                const value = parseFloat(cod.value || 0);
                                                const currency = cod.currency || 'ILS';
                                                
                                                if (value > 0) {
                                                    formattedCodValues[currency] = (formattedCodValues[currency] || 0) + value;
                                                    
                                                    // Convert to ILS for total calculation
                                                    if (currency === 'ILS') {
                                                        totalCodAmount += value;
                                                    } else if (currency === 'USD') {
                                                        totalCodAmount += convertCurrency(value, 'USD', 'ILS');
                                                    } else if (currency === 'JOD') {
                                                        totalCodAmount += convertCurrency(value, 'JOD', 'ILS');
                                                    }
                                                }
                                            });
                                            
                                            // First show the action selection modal
                                            Alert.alert(
                                                translations[language].tabs.orders.create.sections.sender.fields.select_deduction_method || "Select Deduction Method",
                                                translations[language].tabs.orders.create.sections.sender.fields.choose_deduction_method || "Choose how you want to deduct the balance",
                                                [
                                                    {
                                                        text: translations[language].tabs.orders.create.sections.sender.fields.cancel || "Cancel",
                                                        style: "cancel"
                                                    },
                                                    {
                                                        text: translations[language].tabs.orders.create.sections.sender.fields.manual_deduction || "Manual Deduction",
                                                        onPress: () => {
                                                            // Call the function directly, not wrapped in async/await
                                                            handleManualDeduction(senderId, formattedCodValues);
                                                        }
                                                    },
                                                    {
                                                        text: translations[language].tabs.orders.create.sections.sender.fields.auto_deduction || "Auto Deduction",
                                                        onPress: () => {
                                                            // Call the function directly, not wrapped in async/await
                                                            handleAutoDeduction(senderId, formattedCodValues);
                                                        }
                                                    }
                                                ]
                                            );
                                        } catch (error) {
                                            // Make sure to close any potential loading spinners on error
                                            setShowAlert({
                                                visible: false
                                            });
                                            setFromBusinessBalance(false);
                                            setForm(prevForm => ({
                                                ...prevForm,
                                                fromBusinessBalance: false,
                                                balanceDeduction: null
                                            }));
                                            Alert.alert(
                                                translations[language].tabs.orders.create.error || "Error",
                                                error.message || translations[language].tabs.orders.create.errorMsg || "An unexpected error occurred",
                                                [{ text: "OK" }]
                                            );
                                        }
                                    }
                                }}
                            />
                        )}
                    </View>
                )}
            </View>
        )
    }, {
        label: translations[language].tabs.orders.create.sections?.referenceId?.title,
        icon: <AntDesign name="qrcode" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections?.referenceId?.explain,
            type: "input",
            name: "reference_id",
            value: form.referenceId || "",
            onChange: (input) => setForm((form) => ({ ...form, referenceId: input })),
        }]
    },user.role !== "business" ? {
        label: translations[language].tabs.orders.create.sections.sender.title,
        icon: <SimpleLineIcons name="user-follow" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.sender.fields.sender,
            type: "select",
            name: "sender",
            value: selectedValue.sender.name,
            list: senders.data,
            showSearchBar: true
        }]
    } : { visibility: "hidden" },{
        label: translations[language].tabs.orders.create.sections.client.title,
        icon: <Ionicons name="person-outline" size={22} color="#4361EE" />,
        fields: [returnedOrdersMessage ? {
            label: translations[language].tabs.orders.create.sections.client.fields.found,
            type: "message",
            value: returnedOrdersMessage
        } : {
            label: translations[language].tabs.orders.create.sections.client.fields.firstPhone,
            type: "input",
            name: "receiver_mobile",
            value: form.receiverFirstPhone || "",
            onChange: (input) => {
                clearFieldError('receiver_mobile');
                setForm((form) => ({ ...form, receiverFirstPhone: input }));
            },
            enableSearch: true,
            onReceiverSelect: (receiver) => handleReceiverSelect(receiver),
            // Add a "reset" button that clears all receiver-related fields
            resetButton: form.receiverName || form.receiverSecondPhone || form.receiverAddress ? {
                show: true,
                onPress: () => {
                    // Clear all receiver fields
                    setForm(prev => ({
                        ...prev,
                        receiverName: "",
                        receiverFirstPhone: "",
                        receiverSecondPhone: "",
                        receiverAddress: ""
                    }));
                    
                    // Reset city selection if there was one
                    if (selectedValue.city && selectedValue.city.city_id) {
                        setSelectedValue(prev => ({
                            ...prev,
                            city: null
                        }));
                    }
                    
                    // Clear any returned orders message
                    setReturnedOrdersMessage("");
                }
            } : null
        }, { visibility: "hidden" }, {
            name: "receiver_name",
            label: translations[language].tabs.orders.create.sections.client.fields.name,
            type: "input",
            value: form.receiverName || "",
            onChange: (input) => setForm((form) => ({ ...form, receiverName: input })),
        }, {
            label: translations[language].tabs.orders.create.sections.client.fields.secondPhone,
            type: "input",
            name: "receiver_second_mobile",
            value: form.receiverSecondPhone || "",
            onChange: (input) => setForm((form) => ({ ...form, receiverSecondPhone: input }))
        }, {
            label: translations[language].tabs.orders.create.sections.client.fields.city,
            type: "select",
            name: "city",
            value: selectedValue.city ? selectedValue.city.name : form.receiverCity,
            list: cities
                .slice(2) // Skip first two cities
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                .filter(city => 
                    !prickerSearchValue || 
                    city.name.toLowerCase().includes(prickerSearchValue.toLowerCase())
                ),
            showSearchBar: true,
        },{
            label: translations[language].tabs.orders.create.sections.client.fields.address,
            type: "input",
            name: "receiver_address",
            value: form.receiverAddress || "",
            onChange: (input) => setForm((form) => ({ ...form, receiverAddress: input }))
        }]
    }, {
        label: translations[language].tabs.orders.create.sections.cost.title,
        icon: <MaterialIcons name="attach-money" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.paymentType.title,
            type: "select",
            name: "paymentType",
            defaultValue: "cash",
            value: selectedValue.paymentType.name,
            list: paymentTypes
        },
        (selectedValue.paymentType?.value || form.paymentTypeId) === "cash" ||
        (selectedValue.paymentType?.value || form.paymentTypeId) === "cash/check" ||
        (selectedValue.paymentType?.value || form.paymentTypeId) === "check"
        ? [
            // Only show COD amount fields and Add Currency button for cash or cash/check
            ...((selectedValue.paymentType?.value || form.paymentTypeId) === "cash" ||
            (selectedValue.paymentType?.value || form.paymentTypeId) === "cash/check" 
            ? [
                ...codAmounts.map((item, index) => ({
                    label: selectedValue.orderType?.value !== "payment" 
                        ? selectedValue.orderType?.value === "receive" ? 
                        translations[language].tabs.orders.create.sections.cost.fields.packageCost
                        :translations[language].tabs.orders.create.sections.cost.fields.totalPackageCost
                        : `${translations[language].tabs.orders.create.sections.cost.fields.amount}`,
                    type: "currencyInput",
                    name: index === 0 ? "cod_value" : `cod_value_${index}`,
                    value: item.value,
                    currency: item.currency,
                    index: index,
                    error: index === 0 ? fieldErrors.cod_value : null,
                    showCurrencyPicker: (idx) => setActiveCurrencyPicker(idx),
                    availableCurrencies: currencyList
                        .filter(c => !codAmounts.some((item, i) => i !== index && item.currency === c.value))
                        .map(c => ({ name: c.name, value: c.value })),
                    onChange: (input) => {
                        clearFieldError('cod_value');
                        const newAmounts = [...codAmounts];
                        newAmounts[index].value = input;
                        setCodAmounts(newAmounts);
                        
                        if (index === 0) {
                            setForm((form) => ({ ...form, codValue: input }));
                        }
                    },
                    onCurrencyChange: (currency) => {
                        const newAmounts = [...codAmounts];
                        newAmounts[index].currency = currency;
                        setCodAmounts(newAmounts);
                    }
                })),
                codAmounts.length < 3 ? {
                    type: "addCurrencyButton",
                    value: translations[language].tabs.orders.create.sections.cost.fields.addCurrency,
                    onPress: () => {
                        const usedCurrencies = codAmounts.map(item => item.currency);
                        const unused = ["ILS", "USD", "JOD"].find(c => !usedCurrencies.includes(c));
                        
                        if (unused) {
                            setCodAmounts([...codAmounts, { value: "", currency: unused }]);
                        }
                    }
                } : null
            ] : []),
            
            // Show checks input for check or cash/check
            (selectedValue.paymentType?.value === "check" || selectedValue.paymentType?.value === "cash/check") ? {
                type: "checksInput",
                name: "checks",
                label: translations[language].tabs.orders.create.sections.cost.fields.checks || "Checks",
                value: checks,
                onChange: (updatedChecks) => setChecks(updatedChecks)
            } : null
        ].filter(Boolean)
        : { visibility: "hidden" },
        {
            label: translations[language].tabs.orders.create.sections.cost.fields.deliveryFee,
            type: "input",
            name: "delivery_fee",
            value: deliveryFee || form.deliveryFee,
            onChange: (input) => {
                clearFieldError('delivery_fee');
                setDeliveryFee(input);
            }
        }]
    },!["payment"].includes(selectedValue.orderType?.value) ? {
        label: translations[language].tabs.orders.create.sections.details.title,
        icon: <Feather name="box" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.details.fields.product,
            type: "input",
            name: "order_items",
            value: form.orderItems || "",
            onChange: (input) => setForm((form) => ({ ...form, orderItems: input }))
        }, {
            label: translations[language].tabs.orders.create.sections.details.fields.quantity,
            type: "input",
            name: "quantity",
            value: form.numberOfItems || "",
            onChange: (input) => setForm((form) => ({ ...form, numberOfItems: input }))
        }, {
            label: translations[language].tabs.orders.create.sections.details.fields.weight,
            type: "input",
            name: "weight",
            value: form.orderWeight || "",
            onChange: (input) => setForm((form) => ({ ...form, orderWeight: input }))
        },
        (selectedValue.orderType?.value || form.orderTypeId) === "receive" ||
        (selectedValue.orderType?.value || form.orderTypeId) === "delivery/receive" ? {
            label: translations[language].tabs.orders.create.sections.orderTypes.receivedItems,
            type: "input",
            name: "received_items",
            value: form.receivedItems || "",
            onChange: (input) => setForm((form) => ({ ...form, receivedItems: input }))
        } : { visibility: "hidden" },
        (selectedValue.orderType?.value || form.orderTypeId) === "receive" ||
        (selectedValue.orderType?.value || form.orderTypeId) === "delivery/receive" ? {
            label: translations[language].tabs.orders.create.sections.orderTypes.receivedQuantity,
            type: "input",
            name: "received_quantity",
            value: form.receivedQuantity || "",
            onChange: (input) => setForm((form) => ({ ...form, receivedQuantity: input }))
        } : { visibility: "hidden" },
        {
            label: translations[language].tabs.orders.create.sections.itemsCotnentType.title,
            type: "select",
            name: "itemsType",
            list: itemsContentTypeList,
            value: form.itemsType || selectedValue.itemsType.name,
        }]
    } : {
        label: translations[language].tabs.orders.create.sections.details.paymentDetailsTitle,
        icon: <Feather name="box" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.details.fields.description,
            type: "input",
            name: "order_items",
            value: form.orderItems || "",
            onChange: (input) => setForm((form) => ({ ...form, orderItems: input }))
        }]
    }, {
        label: translations[language].tabs.orders.create.sections.notes.title,
        icon: <Feather name="file-text" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.notes.note,
            type: "input",
            value: form.noteContent || "",
            onChange: (input) => setForm((form) => ({ ...form, noteContent: input }))
        }]
    }]

    // Handle selecting a receiver from search results
    const handleReceiverSelect = (receiver) => {        
        // Fill the form with the selected receiver's information
        setForm(prev => ({
            ...prev,
            receiverName: receiver.name || "",
            receiverFirstPhone: receiver.phone || receiver.mobile || "",
            receiverSecondPhone: receiver.phone_2 || receiver.second_mobile || "",
            receiverAddress: receiver.address || ""
        }));

        // Find and set city if exists
        if (receiver.city_id) {
            const city = cities.find(c => c.city_id === receiver.city_id);
            if (city) {
                setSelectedValue(prev => ({
                    ...prev,
                    city: { name: city.name, city_id: city.city_id }
                }));
            }
        }

        // Check for returned orders or additional information
        if (receiver.comment) {
            setReturnedOrdersMessage(receiver.comment);
        } else {
            setReturnedOrdersMessage("");
        }
        
        // Clear any existing field errors
        if (setFieldErrors) {
            setFieldErrors(prev => {
                const updated = {...prev};
                delete updated.receiver_mobile;
                return updated;
            });
        }
    };

    const clearFieldError = (fieldName) => {
        if (fieldErrors[fieldName]) {
            setFieldErrors(prev => {
                const updated = {...prev};
                delete updated[fieldName];
                return updated;
            });
        }
    };

    const handleCreateOrder = async (url, method) => {
        // Clear previous errors
        setFieldErrors({});
        setFormSpinner({ status: true });
        setSuccess(false);
        setError({ status: false, msg: "" });
        Keyboard.dismiss();
        
        // Calculate total COD value from all currency inputs
        const totalCodValue = codAmounts.reduce((sum, item) => {
            const value = parseFloat(item.value) || null;
            return sum + value;
        }, 0);
        
        // Format checks properly - only include checks if payment type supports it
        const formattedChecks = ["check", "cash/check"].includes(selectedValue.paymentType.value) && checks && checks.length > 0
            ? checks.map(check => ({
                number: check.number || '',
                date: check.date || new Date().toISOString().split('T')[0],
                value: parseFloat(check.value || 0),
                currency: check.currency || 'ILS'
            }))
            : [];

        // Format COD values - now supports multiple currencies
        const codValues = codAmounts
            .filter(item => item.value && parseFloat(item.value) > 0)
            .map(item => ({
                value: parseFloat(item.value),
                currency: item.currency || 'ILS'
            }));

        // If there are no COD values and payment type is not check, add a default value
        if (codValues.length === 0 && !["check"].includes(selectedValue.paymentType.value)) {
            codValues.push({ value: null, currency: 'ILS' });
        }
        

        // Ensure commission exists (required field)
        const commission = [{ value: 0, currency: 'ILS' }];

        // Ensure discount exists (required field)
        const discount = [{ value: 0, currency: 'ILS' }];

        function sanitizeInput(input) {
            return input === undefined ? null : input;
        }

        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`, {
                method: method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': language,
                    "Cookie": token ? `token=${token}` : ""
                },
                body: JSON.stringify({
                    reference_id: form.referenceId,
                    delivery_fee: parseFloat(deliveryFee) || parseFloat(form.deliveryFee) || 0,
                    commission: commission[0].value,
                    discount: discount[0].value,
                    sender_id: user.role === "business" ? user.userId : selectedValue.sender.user_id,
                    business_branch_id: selectedValue.sender.branch_id || user.branch_id,
                    title: form.orderItems,
                    quantity: form.numberOfItems,
                    description: form.description,
                    cod_value: totalCodValue,
                    cod_values: codValues,
                    type: selectedValue.itemsType.value,
                    weight: form.orderWeight,
                    item_price: form.codValue,
                    extra_cost: form.extraCost,
                    order_type: selectedValue.orderType.value,
                    received_items: form.receivedItems,
                    received_quantity: form.receivedQuantity,
                    currency: selectedValue.currency.value,
                    payment_type: selectedValue.paymentType.value,
                    receiver_name: form.receiverName,
                    receiver_mobile: form.receiverFirstPhone,
                    receiver_second_mobile: sanitizeInput(form.receiverSecondPhone),
                    receiver_country: sanitizeInput("palestine"),
                    receiver_city: selectedValue.city.city_id || form.senderCityId,
                    receiver_address: form.receiverAddress,
                    from_business_balance: form.fromBusinessBalance || false,
                    exceed_balance_limit: exceedBusinessBalance || false,
                    note: form.noteContent,
                    checks: formattedChecks
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setFormSpinner({ status: false });
                if (data.details && Array.isArray(data.details)) {
                    // Handle validation errors from server (Joi validation)
                    const errors = {};
                    
                    // Check for direct value errors first
                    for (const error of data.details) {
                        // Direct value error case
                        if (error.field === "value") {
                            errors['cod_value'] = error.message;
                            continue;
                        }
                        
                        // Handle nested fields for cod_values
                        if (error.field.includes('cod_values') && error.field.includes('value')) {
                            errors['cod_value'] = error.message;
                            continue;
                        }
                        
                        // For other fields, map as normal
                        const fieldName = mapServerFieldToFormField(error.field);
                        errors[fieldName] = error.message;
                    }
                    
                    setFieldErrors(errors);

                    // Improve scroll to error logic by finding the field in sections
                    if (Object.keys(errors).length > 0) {
                        // Find section containing the first error
                        const firstErrorField = Object.keys(errors)[0];
                        
                        // Find section index containing the error field
                        let sectionWithErrorIndex = -1;
                        let sectionWithError = null;
                        
                        // Search all sections for the field with error
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i];
                            if (!section.fields) continue;
                            
                            // Handle array of fields or single field
                            const fields = Array.isArray(section.fields) ? section.fields : [section.fields];
                            
                            // Flatten nested arrays (for conditional rendering)
                            const flatFields = fields.flat().filter(f => f && typeof f === 'object');
                            
                            // Check if this section contains the error field
                            const hasErrorField = flatFields.some(field => 
                                field.name === firstErrorField || 
                                (field.name === 'cod_value' && firstErrorField === 'cod_value')
                            );
                            
                            if (hasErrorField) {
                                sectionWithErrorIndex = i;
                                sectionWithError = section;
                                break;
                            }
                        }
                        
                        // If found section with error, scroll to it
                        if (sectionWithErrorIndex >= 0 && scrollViewRef.current) {
                            // Calculate position based on section index
                            const approximatePosition = sectionWithErrorIndex * 280;
                            
                            // Scroll with offset
                            scrollViewRef.current.scrollTo({
                                y: Math.max(0, approximatePosition - 60),
                                animated: true
                            });
                        }
                    }

                    // Rest of error handling
                    setError({
                        status: true,
                        msg: translations[language].tabs.orders.create.errorValidationMsg
                    });

                    setShowAlert({
                        visible: true,
                        type: 'error',
                        title: translations[language].tabs.orders.create.error,
                        message: translations[language].tabs.orders.create.errorValidationMsg
                    });
                } else {
                    setError({
                        status: true,
                        msg: data.message || translations[language].tabs.orders.create.errorMsg
                    });

                    setShowAlert({
                        visible: true,
                        type: 'error',
                        title: translations[language].tabs.orders.create.error,
                        message: data.message || translations[language].tabs.orders.create.errorMsg
                    });
                }
                return;
            }

            // Process business balance deduction if enabled
            if (form.fromBusinessBalance && data.data?.order_id) {
                // Add check to prevent duplicate deductions on edit
                const shouldDeduct = method === "POST" || 
                                     (method === "PUT" && !form.originalFromBusinessBalance);
                
                if (shouldDeduct) {
                    try {
                        await processDeduction(data.data.order_id, user.role === "business" ? user.userId : selectedValue.sender.user_id);
                    } catch (error) {
                        Alert.alert(
                            translations[language].tabs.orders.create.sections.sender.fields.deduction_error || "Deduction Error",
                            error.message || translations[language].tabs.orders.create.sections.sender.fields.deduction_failed || "Failed to process deduction",
                            [{ text: "OK" }]
                        );
                    }
                }
            }

            setFormSpinner({ status: false });
            setSuccess(true);

            setShowAlert({
                visible: true,
                type: 'success',
                title: translations[language].tabs.orders.create.success,
                message: translations[language].tabs.orders.create.successMsg,
                onClose: () => router.push("(tabs)/orders")
            });

        } catch (err) {
            setFormSpinner({ status: false });

            setError({
                status: true,
                msg: translations[language].tabs.orders.create.errorMsg
            });

            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error,
                message: translations[language].tabs.orders.create.errorMsg
            });
        }
    };

    // Helper function to map server field names to our form field names if needed
    const mapServerFieldToFormField = (serverField) => {
        // Handle nested fields like "cod_values[0].value"
        if (serverField.includes('cod_values') && serverField.includes('value')) {
            return 'cod_value'; // Map to the first COD value field in the UI
        }
        
        // Handle checks array fields
        if (serverField.includes('checks') && serverField.includes('number')) {
            return 'checks'; // Map to the checks field in the UI
        }
        
        if (serverField.includes('checks') && serverField.includes('value')) {
            return 'checks'; // Map all check value errors to the main checks field
        }
        
        const fieldMapping = {
            'reference_id': 'reference_id',
            'delivery_fee': 'delivery_fee',
            'commission': 'commission',
            'discount': 'discount',
            'sender_id': 'sender',
            'business_branch_id': 'business_branch_id',
            'current_branch_id': 'current_branch',
            'title': 'order_items',
            'quantity': 'number_of_items',
            'description': 'description',
            'cod_value': 'cod_value',
            'cod_values': 'cod_value',
            'type': 'items_type',
            'weight': 'order_weight',
            'item_price': 'item_price',
            'extra_cost': 'extra_cost',
            'order_type': 'order_type',
            'received_items': 'received_items',
            'received_quantity': 'received_quantity',
            'currency': 'currency',
            'payment_type': 'payment_type',
            'receiver_name': 'receiver_name',
            'receiver_mobile': 'receiver_mobile',
            'receiver_second_mobile': 'receiver_second_mobile',
            'receiver_country': 'receiver_country',
            'receiver_city': 'city',
            'receiver_address': 'receiver_address',
            'from_business_balance': 'from_business_balance',
            'note': 'note_content',
            'checks': 'checks',
            // Add any other field mappings as needed
        };
        
        return fieldMapping[serverField] || serverField;
    };

    const fetchOrderData = async () => {
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : ""
                }
            });
            const orderData = await res.json();
            
            // Update selectedValue state with the order data
            setSelectedValue((selectedValue) => ({
                ...selectedValue,
                sender: { 
                    name: orderData.sender, 
                    value: orderData.sender_id,
                    user_id: orderData.sender_id,
                    city_id: orderData.sender_city_id
                },
                city: { 
                    name: orderData.receiver_city, 
                    city_id: orderData.receiver_city_id 
                },
                orderType: { 
                    name: orderData.order_type, 
                    value: orderData.order_type_id 
                },
                paymentType: { 
                    name: orderData.payment_type, 
                    value: orderData.payment_type_id 
                },
                currency: { 
                    name: orderData.cod_values?.[0]?.currency || "ILS", 
                    value: orderData.cod_values?.[0]?.currency || "ILS" 
                },
                itemsType: { 
                    name: orderData.items_type, 
                    value: orderData.items_type 
                }
            }));
            
            // Handle delivery fee - parse from format like "20.00 ILS"
            const deliveryFeeMatch = orderData.delivery_fee?.match(/([0-9.]+)/);
            const extractedDeliveryFee = deliveryFeeMatch ? deliveryFeeMatch[1] : "0";
            setDeliveryFee(extractedDeliveryFee);
            
            // Handle COD values
            if (orderData.cod_values && Array.isArray(orderData.cod_values) && orderData.cod_values.length > 0) {
                setCodAmounts(orderData.cod_values.map(item => ({
                    value: item.value.toString(),
                    currency: item.currency
                })));
            }
            
            // Set form data
            setForm({
                receiverName: orderData.receiver_name,
                receiverFirstPhone: orderData.receiver_mobile,
                receiverSecondPhone: orderData.receiver_second_mobile,
                receiverCity: orderData.receiver_city,
                receiverAddress: orderData.receiver_address,
                sender: orderData.sender,
                senderId: orderData.sender_id,
                senderCityId: orderData.sender_city_id,
                receiverCityId: orderData.receiver_city_id,
                deliveryFee: extractedDeliveryFee,
                paymentTypeId: orderData.payment_type_id,
                orderTypeId: orderData.order_type_id,
                codValue: orderData.cod_values?.[0]?.value?.toString() || "0",
                comission: orderData.commission?.[0]?.value || 0,
                orderItems: orderData.order_items || "",
                numberOfItems: orderData.number_of_items?.toString() || "",
                orderWeight: orderData.order_weight?.toString() || 0,
                receivedItems: orderData.received_items || "",
                receivedQuantity: orderData.received_quantity || 0,
                noteContent: orderData.note_content || "",
                fromBusinessBalance: orderData.from_business_balance ? true : false,
                originalFromBusinessBalance: orderData.from_business_balance ? true : false,
                balanceDeduction: orderData.balance_deduction || null,
                originalBalanceDeduction: orderData.balance_deduction || null,
                referenceId: orderData.reference_id || null
            });
            
            // Set checks
            if (orderData.checks && Array.isArray(orderData.checks) && orderData.checks.length > 0) {
                setChecks(orderData.checks);
            } else {
                setChecks([]);
            }
        } catch (err) {
            
        }
    };

    const fetchSenders = async (pageNumber = 1, isLoadMore = false) => {
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?page=${pageNumber}&language_code=${language}&role_id=2&np=${prickerSearchValue}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : ""
                }
            });
            const newData = await res.json();
            if (isLoadMore) {
                setSenders(prevData => ({
                    ...prevData,
                    data: [...prevData.data, ...newData.data],
                }));
            } else {
                setSenders(newData);
            }
        } catch (err) {
            
        } finally {
            setLoadingMore(false);
        }
    }

    const fetchCities = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/addresses/cities?language_code=${language}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            setCities(data.data);
        } catch (err) {
            // Handle error
        }
    }

    const fetchDeliveryFee = async () => {
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/delivery_fee?senderCityId=${selectedValue.sender.city_id || form.senderCityId || user.city_id}&receiverCityId=${selectedValue.city.city_id || form.receiverCityId}&orderType=${selectedValue?.itemsType?.value || "normal"}&senderId=${selectedValue.sender.user_id || form.senderId || user.userId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : ""
                }
            });
            const data = await res.json();
            setDeliveryFee(data.data)
        } catch (err) {
        }
    }

    const loadMoreData = async () => {
        if (!loadingMore && senders?.data && senders?.data.length > 0) {
            // Check if there's more data to load
            if (senders.metadata && senders.data.length >= senders?.metadata.total_records) {
               
                return;
            }

            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await fetchSenders(nextPage, true);
            } catch (error) {
               
             }
            finally {
                    setLoadingMore(false);
                }
            }
        };
    
    useEffect(() => {
        if (orderId) {
            fetchOrderData();
        }
    }, [orderId]);
    
    useEffect(() => {
        fetchCities();
        setPage(1);
        fetchSenders(1, false);
    }, [prickerSearchValue])
    
    useEffect(() => {
        if(selectedValue?.city){
            fetchDeliveryFee();
        }
    }, [selectedValue]);
    
    useEffect(() => {
        // Check if we have a scanned reference ID from the camera
        const checkScannedData = () => {
            if (global.scannedReferenceId) {
                const scannedValue = global.scannedReferenceId;
                
                // Only update if we have a value and we're scanning for the reference ID field
                if (scannedValue && global.scanTargetField === 'reference_id') {
                    setForm(prevForm => ({
                        ...prevForm,
                        referenceId: scannedValue
                    }));
                    
                    // Clear the global variables after using them
                    global.scannedReferenceId = null;
                    global.scanTargetField = null;
                }
            }
        };
        
        checkScannedData();
    }, []);
    
    useFocusEffect(
        useCallback(() => {
            // Check if we have a scanned reference ID when the screen is focused
            if (global && global.scannedReferenceId && global.scanTargetField === 'reference_id') {
                // Update the form with the scanned value
                setForm(prevForm => ({
                    ...prevForm,
                    referenceId: global.scannedReferenceId
                }));
                
                // Clear the global variables
                global.scannedReferenceId = null;
                global.scanTargetField = null;
            }
        }, [])
    );
    
    
    const CustomAlert = ({ visible, type, title, message, onClose }) => {
        if (!visible) return null;
        
        return (
            <View style={styles.alertOverlay}>
                <View style={[
                    styles.alertContainer, 
                    type === 'error' ? styles.errorAlert : 
                    type === 'success' ? styles.successAlert : 
                    styles.warningAlert
                ]}>
                    <View style={styles.alertHeader}>
                        <Text style={styles.alertTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={22} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.alertMessage}>{message}</Text>
                    {type !== 'loading' ? (
                        <TouchableOpacity 
                            style={[
                                styles.alertButton, 
                                type === 'error' ? styles.errorButton : 
                                type === 'success' ? styles.successButton : 
                                styles.warningButton
                            ]}
                            onPress={onClose}
                        >
                            <Text style={styles.alertButtonText}>
                                {translations[language]?.ok || 'OK'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <ActivityIndicator size="large" color="#4361EE" style={styles.alertLoader} />
                    )}
                </View>
            </View>
        );
    };
    
    const handleManualDeduction = async (senderId, formattedCodValues) => {
        try {
            // Show loading while fetching balances
            setShowAlert({
                visible: true,
                type: 'loading',
                title: translations[language].tabs.orders.create.sections.sender.fields.checking_balance || "Checking Balance",
                message: translations[language].tabs.orders.create.sections.sender.fields.please_wait || "Please wait...",
                onClose: () => setShowAlert({visible: false})
            });
            
            // Fetch user balances
            const balances = await getUserBalances(senderId);
            
            // Close loading spinner
            setShowAlert({
                visible: false
            });
            
            // Get available currencies with COD values
            const availableCurrencies = Object.keys(formattedCodValues);
            
            if (availableCurrencies.length === 0) {
                return Alert.alert(
                    translations[language].tabs.orders.create.error || "Error",
                    translations[language].tabs.orders.create.sections.sender.fields.no_cod_values || "No COD values found",
                    [{ text: "OK" }]
                );
            }
            
            // Create list of currencies to show in picker
            // For React Native, we'll use multiple Alert buttons for a simple implementation
            const currencyAlertButtons = [
                {
                    text: translations[language].cancel || "Cancel",
                    style: "cancel"
                }
            ];
            
            // Add a button for each currency
            availableCurrencies.forEach(currency => {
                currencyAlertButtons.push({
                    text: `${currency} (${translations[language].tabs.orders.create.sections.sender.fields.balance || "Balance"}: ${balances[currency] || 0})`,
                    onPress: () => processCurrencySelection(currency, balances, formattedCodValues)
                });
            });
            
            // Show the currency selection alert
            Alert.alert(
                translations[language].tabs.orders.create.sections.sender.fields.select_deduction_currency || "Select Deduction Currency",
                translations[language].tabs.orders.create.sections.sender.fields.choose_currency || "Choose Currency",
                currencyAlertButtons
            );
        } catch (error) {
            setShowAlert({
                visible: false
            });
            Alert.alert(
                translations[language].tabs.orders.create.error || "Error",
                error.message || translations[language].tabs.orders.create.errorMsg || "An unexpected error occurred",
                [{ text: "OK" }]
            );
        }
    };

    const processCurrencySelection = async (selectedCurrency, balances, formattedCodValues) => {
        try {
            // Extract values needed for net value calculations
            const deliveryFeeValue = parseFloat(deliveryFee) || 0;
            const deliveryFeeCurrency = 'ILS'; // Default for mobile app
            
            // Calculate total amount needed for deduction
            let totalNeeded = 0;
            
            if (formattedCodValues[selectedCurrency]) {
                // If we have a direct match, start with COD value
                totalNeeded = formattedCodValues[selectedCurrency];
                
                // Only add delivery fee for payment or receive order types
                if (selectedValue.orderType?.value === "payment" || selectedValue.orderType?.value === "receive") {
                    // Add proportional delivery fee if in same currency
                    if (deliveryFeeCurrency === selectedCurrency) {
                        totalNeeded += deliveryFeeValue;
                    } else {
                        // Convert delivery fee to selected currency
                        const convertedFee = convertCurrency(deliveryFeeValue, deliveryFeeCurrency, selectedCurrency);
                        if (convertedFee !== null) {
                            totalNeeded += convertedFee;
                        }
                    }
                }
            } else {
                Alert.alert(
                    translations[language].tabs.orders.create.error || "Error",
                    "Currency mismatch error",
                    [{ text: "OK" }]
                );
                return;
            }
            
            // Round to 2 decimal places
            totalNeeded = Math.round(totalNeeded * 100) / 100;
            
            // Check if balance is sufficient
            const availableBalance = balances[selectedCurrency] || 0;
            
            if (availableBalance < totalNeeded) {
                return Alert.alert(
                    translations[language].tabs.orders.create.sections.cost.fields.insufficient_balance || "Insufficient Balance",
                    `${translations[language].tabs.orders.create.sections.sender.fields.available || "Available"}: ${availableBalance} ${selectedCurrency}\n${translations[language].tabs.orders.create.sections.sender.fields.needed || "Needed"}: ${totalNeeded} ${selectedCurrency}`,
                    [{ text: "OK" }]
                );
            }
            
            // Confirm deduction
            Alert.alert(
                translations[language].tabs.orders.create.sections.sender.fields.confirm_deduction || "Confirm Deduction",
                `${translations[language].tabs.orders.create.sections.sender.fields.deduct_amount || "Amount to deduct"}: ${totalNeeded} ${selectedCurrency}\n${translations[language].tabs.orders.create.sections.sender.fields.current_balance || "Current balance"}: ${availableBalance} ${selectedCurrency}\n${translations[language].tabs.orders.create.sections.sender.fields.new_balance || "New balance"}: ${Math.round((availableBalance - totalNeeded) * 100) / 100} ${selectedCurrency}`,
                [
                    {
                        text: translations[language].tabs.orders.create.sections.sender.fields.cancel || "Cancel",
                        style: "cancel"
                    },
                    {
                        text: translations[language].tabs.orders.create.sections.sender.fields.confirm || "Confirm",
                        onPress: () => {
                            // Set flag for form submission
                            setFromBusinessBalance(true);
                            
                            // Store deduction info
                            setForm(prevForm => ({
                                ...prevForm,
                                fromBusinessBalance: true,
                                balanceDeduction: {
                                    method: 'manual',
                                    currency: selectedCurrency,
                                    amount: totalNeeded
                                }
                            }));
                            
                            Alert.alert(
                                translations[language].tabs.orders.create.sections.sender.fields.deduction_ready || "Deduction Ready",
                                translations[language].tabs.orders.create.sections.sender.fields.deduction_on_submit || "Deduction will be applied on submit",
                                [{ text: "OK" }]
                            );
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert(
                translations[language].tabs.orders.create.error || "Error",
                error.message || translations[language].tabs.orders.create.errorMsg || "An unexpected error occurred",
                [{ text: "OK" }]
            );
        }
    };

    const handleAutoDeduction = async (senderId, formattedCodValues) => {
        try {
            // Show loading while fetching balances
            setShowAlert({
                visible: true,
                type: 'loading',
                title: translations[language].tabs.orders.create.sections.sender.fields.checking_balance || "Checking Balance",
                message: translations[language].tabs.orders.create.sections.sender.fields.please_wait || "Please wait...",
                onClose: () => setShowAlert({visible: false})
            });
            
            // Fetch user balances
            const balances = await getUserBalances(senderId);
            
            // Close loading spinner
            setShowAlert({
                visible: false
            });
            
            // Auto-deduct logic
            const deductions = {};
            let insufficientFunds = false;
            let insufficientCurrency = '';
            
            // Extract values needed for net value calculations
            const deliveryFeeValue = parseFloat(deliveryFee) || 0;
            const deliveryFeeCurrency = 'ILS'; // Default for mobile app
            
            // Calculate net value for each currency
            for (const [currency, codAmount] of Object.entries(formattedCodValues)) {
                // Start with COD value
                let netValue = codAmount;
                
                // Only add delivery fee for payment or receive order types
                if (selectedValue.orderType?.value === "payment" || selectedValue.orderType?.value === "receive") {
                    // Add proportional delivery fee
                    if (deliveryFeeCurrency === currency) {
                        // If delivery fee is in same currency, add directly
                        netValue += (deliveryFeeValue / Object.keys(formattedCodValues).length);
                    } else {
                        // If different currency, convert
                        const convertedFee = convertCurrency(
                            (deliveryFeeValue / Object.keys(formattedCodValues).length),
                            deliveryFeeCurrency,
                            currency
                        );
                        if (convertedFee !== null) {
                            netValue += convertedFee;
                        }
                    }
                }
                
                // Round to 2 decimal places
                netValue = Math.round(netValue * 100) / 100;
                
                const availableBalance = balances[currency] || 0;
                
                if (availableBalance < netValue) {
                    insufficientFunds = true;
                    insufficientCurrency = currency;
                    break;
                }
                
                deductions[currency] = netValue;
            }
            
            if (insufficientFunds) {
                return Alert.alert(
                    translations[language].tabs.orders.create.sections.cost.fields.insufficient_balance || "Insufficient Balance",
                    `${translations[language].tabs.orders.create.sections.sender.fields.insufficient_balance_for || "Insufficient balance for"}: ${insufficientCurrency}\n${translations[language].tabs.orders.create.sections.sender.fields.available || "Available"}: ${balances[insufficientCurrency] || 0} ${insufficientCurrency}\n${translations[language].tabs.orders.create.sections.sender.fields.needed || "Needed"}: ${deductions[insufficientCurrency] || formattedCodValues[insufficientCurrency]} ${insufficientCurrency}`,
                    [{ text: "OK" }]
                );
            }
            
            // Confirm automatic deductions
            const deductionDetails = Object.entries(deductions)
                .map(([currency, amount]) => `• ${amount} ${currency}`)
                .join('\n');
            
            Alert.alert(
                translations[language].tabs.orders.create.sections.sender.fields.confirm_auto_deductions || "Confirm Auto Deductions",
                `${translations[language].tabs.orders.create.sections.sender.fields.system_will_deduct || "System will deduct"}:\n\n${deductionDetails}\n\n${translations[language].tabs.orders.create.sections.sender.fields.from_available_balances || "from available balances"}`,
                [
                    {
                        text: translations[language].tabs.orders.create.sections.sender.fields.cancel || "Cancel",
                        style: "cancel"
                    },
                    {
                        text: translations[language].tabs.orders.create.sections.sender.fields.confirm || "Confirm",
                        onPress: () => {
                            // Set flag for form submission
                            setFromBusinessBalance(true);
                            
                            // Store deduction info
                            setForm(prevForm => ({
                                ...prevForm,
                                fromBusinessBalance: true,
                                balanceDeduction: {
                                    method: 'auto',
                                    deductions
                                }
                            }));
                            
                            Alert.alert(
                                translations[language].tabs.orders.create.sections.sender.fields.deductions_ready || "Deductions Ready",
                                `${translations[language].tabs.orders.create.sections.sender.fields.deductions_on_submit || "Deductions will be applied on submit"}:\n\n${deductionDetails}`,
                                [{ text: "OK" }]
                            );
                        }
                    }
                ]
            );
        } catch (error) {
            setShowAlert({
                visible: false
            });
            Alert.alert(
                translations[language].tabs.orders.create.error || "Error",
                error.message || translations[language].tabs.orders.create.errorMsg || "An unexpected error occurred",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <View style={styles.pageContainer}>
            <ScrollView 
                ref={scrollViewRef}
                style={[styles.container]}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.main}>
                    {sections?.map((section, index) => {
                        return <Section
                            key={index}
                            section={section}
                            setSelectedValue={setSelectedValue}
                            loadMoreData={loadMoreData}
                            loadingMore={loadingMore}
                            prickerSearchValue={prickerSearchValue}
                            setPickerSearchValue={setPickerSearchValue}
                            fieldErrors={fieldErrors}
                            setFieldErrors={setFieldErrors}
                            isRTL={isRTL}
                        />
                    })}
                    
                    <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={() => orderId 
                            ? handleCreateOrder(`/api/orders/${orderId}`, "PUT") 
                            : handleCreateOrder('/api/orders', "POST")
                        }
                        disabled={formSpinner.status}
                        activeOpacity={0.8}
                    >
                        {formSpinner.status ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {translations[language].tabs.orders.create.submit}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
    
            {/* Loading Spinner */}
            {formSpinner.status && (
                <View style={styles.overlay}>
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#4361EE" />
                        <Text style={styles.spinnerText}>
                            {translations[language].tabs.orders.create.loading}
                        </Text>
                    </View>
                </View>
            )}
    
            {/* Success Message */}
            {success && (
                <View style={styles.successOverlay}>
                    <View style={styles.successContainer}>
                        <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                        <Text style={styles.successText}>
                            {translations[language].tabs.orders.create.successMsg}
                        </Text>
                    </View>
                </View>
            )}
    
            {/* Custom Alert */}
            {showAlert.visible && (
                <CustomAlert
                    visible={showAlert.visible}
                    type={showAlert.type}
                    title={showAlert.title}
                    message={showAlert.message}
                    onClose={() => {
                        setShowAlert(prev => ({ ...prev, visible: false }));
                        showAlert.onClose && showAlert.onClose();
                    }}
                />
            )}

            {activeCurrencyPicker !== null && (
                <ModalPresentation
                    showModal={activeCurrencyPicker !== null}
                    setShowModal={() => setActiveCurrencyPicker(null)}
                >
                    <View style={styles.currencyPickerContainer}>
                        <Text style={styles.currencyPickerTitle}>
                            {translations[language].tabs.orders.create.sections.currencyList.title}
                        </Text>
                        <View style={styles.currencyList}>
                            {currencyList
                                .filter(c => 
                                    // Show only currencies not used in other inputs
                                    !codAmounts.some((item, i) => 
                                        i !== activeCurrencyPicker && item.currency === c.value
                                    )
                                )
                                .map((currency, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.currencyOption,
                                            codAmounts[activeCurrencyPicker]?.currency === currency.value && 
                                                styles.selectedCurrencyOption
                                        ]}
                                        onPress={() => {
                                            const newAmounts = [...codAmounts];
                                            newAmounts[activeCurrencyPicker].currency = currency.value;
                                            setCodAmounts(newAmounts);
                                            setActiveCurrencyPicker(null);
                                        }}
                                    >
                                        <Text style={[
                                            styles.currencyOptionText,
                                            codAmounts[activeCurrencyPicker]?.currency === currency.value && 
                                                styles.selectedCurrencyOptionText
                                        ]}>
                                            {currency.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            }
                        </View>
                        <TouchableOpacity
                            style={styles.cancelCurrencyButton}
                            onPress={() => setActiveCurrencyPicker(null)}
                        >
                            <Text style={styles.cancelCurrencyText}>
                                {translations[language]?.cancel || 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}
        </View>
    );
}
    
const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#4361EE',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
    },
    main: {
        padding: 16,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 30,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    spinnerContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        alignItems: 'center',
    },
    spinnerText: {
        marginTop: 12,
        color: '#4361EE',
        fontSize: 14,
        fontWeight: '500',
    },
    successOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500,
    },
    successContainer: {
        backgroundColor: '#ECFDF5',
        padding: 28,
        borderRadius: 16,
        width: '85%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },
    successText: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
    alertOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    alertContainer: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    alertMessage: {
        fontSize: 15,
        color: '#4B5563',
        marginBottom: 24,
        lineHeight: 22,
    },
    alertButton: {
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    errorAlert: {
        borderLeftWidth: 6,
        borderLeftColor: '#EF4444',
    },
    successAlert: {
        borderLeftWidth: 6,
        borderLeftColor: '#10B981',
    },
    warningAlert: {
        borderLeftWidth: 6,
        borderLeftColor: '#F59E0B',
    },
    errorButton: {
        backgroundColor: '#EF4444',
    },
    successButton: {
        backgroundColor: '#10B981',
    },
    warningButton: {
        backgroundColor: '#F59E0B',
    },
    alertButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#4361EE',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: '#4361EE',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    currencyPickerContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    currencyPickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    currencyList: {
        marginVertical: 8,
    },
    currencyOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginVertical: 4,
        backgroundColor: 'rgba(203, 213, 225, 0.2)',
    },
    selectedCurrencyOption: {
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
    },
    currencyOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#64748B',
        textAlign: 'center',
    },
    selectedCurrencyOptionText: {
        color: '#4361EE',
    },
    cancelCurrencyButton: {
        marginTop: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelCurrencyText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '500',
    },
    messageContainer: {
        borderWidth: 2, // Increased from 1
        borderRadius: 10,
        marginVertical: 16, // Increased from 12
        padding: 0,
        borderColor: 'rgba(245, 158, 11, 0.5)', // More visible border
        backgroundColor: 'rgba(254, 243, 199, 0.7)', // More visible background
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
        fontSize: 16, // Increased from 15
        fontWeight: '700', // Increased from 600
        color: '#92400E',
        marginBottom: 6, // Increased from 4
    },
    messageText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
        fontWeight: '500', // Added for better visibility
    },
    alertLoader: {
        marginTop: 16,
    },
    orderTypeHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        paddingHorizontal: 16,
        paddingTop:10,
        color: '#4361EE',
        textAlign: 'center',
    },
    orderTypeButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 12,
        overflow: 'hidden',
    },
    businessBalanceToggleContainer: {
        borderRadius: 12,
        padding:8,
    },
});