import { View, StyleSheet, ScrollView, Text, Alert, ActivityIndicator, Keyboard, TouchableOpacity, Platform, StatusBar, Animated, Dimensions, Modal } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Section from "../../components/create/Section";
import { useEffect, useState, useRef, React, useCallback } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FontAwesome,FontAwesome5,Octicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../RootLayout";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import ModalPresentation from "../../components/ModalPresentation";
import { useFocusEffect } from '@react-navigation/native';
import Field from "../../components/create/Field";
import ReceiverSearchModal from "../../components/create/ReceiverSearchModal";
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import * as SecureStore from 'expo-secure-store';
import eventEmitter, { EVENTS } from '../../utils/eventEmitter';

export default function HomeScreen() {
    const { language } = useLanguage();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState({});
    const [formSpinner, setFormSpinner] = useState({})
    const [fieldErrors, setFieldErrors] = useState({});
    const { orderId, isDuplicate } = useLocalSearchParams();
    const [senders, setSenders] = useState([]);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const { user } = useAuth()
    const [cities, setCities] = useState([]);
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    // Onboarding system
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;
    const { width, height } = Dimensions.get('window');
    
    // Onboarding setup
    
    // Swipe gesture handling
    const panResponder = useRef(
      Platform.OS === 'web' 
        ? {} 
        : require('react-native').PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
              if (gestureState.dx < -50) {
                // Swiped left - next step
                if (currentStep < onboardingSteps.length - 1) {
                  goToNextStep();
                }
              } else if (gestureState.dx > 50) {
                // Swiped right - previous step
                if (currentStep > 0) {
                  goToPrevStep();
                }
              }
            },
          })
    ).current;
    const [orderTypes, setOrderTypes] = useState([{
        name: translations[language].tabs.orders.create.sections.orderTypes.delivery,
        value: "delivery"
    }, {
        name: translations[language].tabs.orders.create.sections.orderTypes.receive,
        value: "receive"
    }, {
        name: translations[language].tabs.orders.create.sections.orderTypes["delivery/receive"],
        value: "delivery/receive"
    }, {
        name: translations[language].tabs.orders.create.sections.orderTypes.payment,
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
        city: null,
        orderType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.orderTypes.delivery, value: "delivery" },
        paymentType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.paymentType.cash, value: "cash" },
        currency: orderId ? "" : { name: translations[language].tabs.orders.create.sections.currencyList.ILS, value: "ILS" },
        itemsType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.itemsCotnentType.normal, value: "normal" },
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
    const [withMoneyReceive, setWithMoneyReceive] = useState(false);
    const [exceedBusinessBalance, setExceedBusinessBalance] = useState(false);
    const [showReceiverModal, setShowReceiverModal] = useState(false);
    const [shouldUpdateDeliveryFee, setShouldUpdateDeliveryFee] = useState(true);

    const handleSelectedValueChange = (fieldName, value) => {
        // Enable delivery fee updates for sender and city changes
        if (fieldName === 'sender' || fieldName === 'city') {
            setShouldUpdateDeliveryFee(true);
        }
        
        setSelectedValue(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const sections = [{
        isHeader: true,
        fields: (
            <View>
                <View style={styles.orderTypeButtonsContainer}>
                    {orderTypes.map((type, index) => (
                        <Field
                            key={index}
                            field={{
                                type: "orderTypeButton",
                                label: type.name,
                                isSelected: selectedValue.orderType?.value === type.value,
                                icon: type.value === "delivery" ? <MaterialIcons name="local-shipping" size={18} /> :
                                      type.value === "receive" ? <MaterialIcons name="store" size={18} /> :
                                      type.value === "delivery/receive" ? <MaterialIcons name="sync" size={18} /> :
                                      <MaterialIcons name="payments" size={18} />,
                                onPress: () => {
                                    // Reset toggle states when switching order types
                                    setFromBusinessBalance(false);
                                    setWithMoneyReceive(false);
                                    setForm(prevForm => ({
                                        ...prevForm,
                                        fromBusinessBalance: false,
                                        withMoneyReceive: false,
                                        balanceDeduction: null
                                    }));
                                    
                                    setSelectedValue(prev => ({
                                        ...prev,
                                        orderType: type
                                    }));
                                
                                    // Show alert for business users when selecting receive or payment order types
                                    if (user.role === "business" && (type.value === "receive" || type.value === "payment")) {
                                        Alert.alert(
                                            translations[language].tabs.orders.create.sections.sender.fields.auto_deduction_notice,
                                            type.value === "receive" ? translations[language].tabs.orders.create.sections.sender.fields.auto_deduction_message : translations[language].tabs.orders.create.sections.sender.fields.auto_deduction_message_payment,
                                            [{ 
                                                text: translations[language].ok || "OK",
                                                style: "default"
                                            }],
                                            { 
                                                cancelable: false,
                                                icon: type.value === "receive" ? <MaterialIcons name="store" size={24} color="#4361EE" /> : 
                                                      <MaterialIcons name="payments" size={24} color="#4361EE" />
                                            }
                                        );
                                    }
                                }
                            }}
                        />
                    ))}
                </View>
                
                {/* Always show with_money_receive toggle when order type is "receive" */}
                {selectedValue.orderType?.value === "receive" && (
                    <View style={styles.businessBalanceToggleContainer}>
                        <Field
                            field={{
                                type: "toggle",
                                label: translations[language].tabs.orders.create.sections.sender.fields.with_money_receive,
                                name: "with_money_receive",
                                value: form.withMoneyReceive || false,
                                onChange: (value) => {
                                    setWithMoneyReceive(value);
                                    setForm(prevForm => ({
                                        ...prevForm,
                                        withMoneyReceive: value
                                    }));
                                    
                                    // For business users, auto-set from_business_balance based on with_money_receive
                                    if (user.role === "business" && !value) {
                                        setFromBusinessBalance(true);
                                        setForm(prevForm => ({
                                            ...prevForm,
                                            fromBusinessBalance: true
                                        }));
                                    }
                                }
                            }}
                        />
                    </View>
                )}
            </View>
        )
    }, !isDuplicate && {
        label: translations[language].tabs.orders.create.sections?.referenceId?.title,
        icon: <AntDesign name="qrcode" size={22} color= '#8B5CF6' />,
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
            showSearchBar: true,
            onSelect: () => {
                // Enable delivery fee update when sender changes
                setShouldUpdateDeliveryFee(true);
            }
        }]
    } : { visibility: "hidden" },{
        label: translations[language].tabs.orders.create.sections.client.title,
        icon: <Ionicons name="person-outline" size={22} color= '#EC4899' />,
        fields: [returnedOrdersMessage ? {
            label: translations[language].tabs.orders.create.sections.client.fields.found,
            type: "message",
            value: returnedOrdersMessage
        } : {
            label: translations[language].tabs.orders.create.sections.client.fields.firstPhone,
            type: "input",
            name: "receiver_mobile",
            value: form.receiverFirstPhone || "",
            onPress: () => {
                Keyboard.dismiss();
                setShowReceiverModal(true);
            },
            onChange: null,  // Explicitly set to null for the phone field only
            pointerEvents: "auto",
            resetButton: form.receiverName || form.receiverSecondPhone || form.receiverAddress ? {
                show: true,
                onPress: () => {
                    setForm(prev => ({
                        ...prev,
                        receiverName: "",
                        receiverFirstPhone: "",
                        receiverSecondPhone: "",
                        receiverAddress: ""
                    }));
                    if (selectedValue.city && selectedValue.city.city_id) {
                        setSelectedValue(prev => ({
                            ...prev,
                            city: null
                        }));
                    }
                    setReturnedOrdersMessage("");
                }
            } : null
        }, {
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
            onChange: (input) => setForm((form) => ({ ...form, receiverSecondPhone: input })),
        }, {
            label: translations[language].tabs.orders.create.sections.client.fields.city,
            type: "select",
            name: "city",
            value: selectedValue.city ? selectedValue.city.name : form.receiverCity,
            list: cities
                .slice(2)
                .sort((a, b) => a.name.localeCompare(b.name))
                .filter(city => 
                    !prickerSearchValue || 
                    city.name.toLowerCase().includes(prickerSearchValue.toLowerCase())
                ),
            showSearchBar: true,
            onSelect: (city) => {
                
                // Update the selectedValue.city with the selected city
                setSelectedValue(prev => {
                    const newValue = {
                        ...prev,
                        city: city
                    };
                    
                    // Force delivery fee calculation immediately, but only if not in edit mode
                    // or if in edit mode and the city has changed from the original
                    setTimeout(() => {
                        if (!orderId || (orderId && city.city_id !== form.receiverCityId)) {
                            fetchDeliveryFee();
                        } else {
                        }
                    }, 0);
                    
                    return newValue;
                });
            }
        },{
            label: translations[language].tabs.orders.create.sections.client.fields.address,
            type: "input",
            name: "receiver_address",
            value: form.receiverAddress || "",
            onChange: (input) => setForm((form) => ({ ...form, receiverAddress: input })),
        }]
    }, {
        label: translations[language].tabs.orders.create.sections.cost.title,
        icon: <FontAwesome name="money" size={24} color='#10B981' />,
        fields: [
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
                        name: "value",
                        value: item.value,
                        currency: item.currency,
                        index: index,
                        error: index === 0 ? fieldErrors.cod_value : null,
                    }))
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
                value: deliveryFee !== undefined ? deliveryFee : form.deliveryFee,
                readOnly: !["admin", "manager", "entery"].includes(user.role),
                editable: ["admin", "manager", "entery"].includes(user.role),
                onChange: (input) => {
                    // When manually changing delivery fee, prevent auto-updates
                    setShouldUpdateDeliveryFee(false);
                    setDeliveryFee(input);
                    setForm(prevForm => ({
                        ...prevForm,
                        deliveryFee: input
                    }));
                },
                keyboardType: "numeric"
            },
            {
                label: translations[language].tabs.orders.create.sections.cost.fields.netValue || "Net Value",
                type: "input",
                name: "net_value",
                value: (() => {
                    // Define currency exchange rates
                    const CURRENCY_EXCHANGE_RATES = {
                        ILS_TO_USD: 0.27,  // 1 ILS = 0.27 USD
                        ILS_TO_JOD: 0.19,  // 1 ILS = 0.19 JOD
                        USD_TO_ILS: 3.7,   // 1 USD = 3.7 ILS
                        USD_TO_JOD: 0.71,  // 1 USD = 0.71 JOD
                        JOD_TO_ILS: 5,     // 1 JOD = 5 ILS
                        JOD_TO_USD: 1.41,  // 1 JOD = 1.41 USD
                    };
                    
                    // Group COD values by currency
                    const codByCurrency = {
                        ILS: 0,
                        JOD: 0,
                        USD: 0
                    };
                    
                    codAmounts.forEach(cod => {
                        const value = parseFloat(cod.value || 0);
                        const currency = cod.currency || 'ILS';
                        
                        if (!isNaN(value)) {
                            codByCurrency[currency] = (codByCurrency[currency] || 0) + value;
                        }
                    });
                    
                    // Get delivery fee, commission, and discount
                    const deliveryFeeValue = parseFloat(deliveryFee || form.delivery_fee || 0);
                    const deliveryFeeCurrency = 'ILS'; // Default currency for delivery fee
                    const commissionValue = parseFloat(form.commission || 0);
                    const commissionCurrency = 'ILS'; // Default currency for commission
                    const discountValue = parseFloat(form.discount || 0);
                    const discountCurrency = 'ILS'; // Default currency for discount
                    
                    // Calculate ILS fees
                    const ilsFees = 
                        (deliveryFeeCurrency === 'ILS' ? deliveryFeeValue : 0) +
                        (commissionCurrency === 'ILS' ? commissionValue : 0) -
                        (discountCurrency === 'ILS' ? discountValue : 0);
                    
                    // Calculate JOD fees
                    const jodFees = 
                        (deliveryFeeCurrency === 'JOD' ? deliveryFeeValue : 0) +
                        (commissionCurrency === 'JOD' ? commissionValue : 0) -
                        (discountCurrency === 'JOD' ? discountValue : 0);
                    
                    // Calculate USD fees
                    const usdFees = 
                        (deliveryFeeCurrency === 'USD' ? deliveryFeeValue : 0) +
                        (commissionCurrency === 'USD' ? commissionValue : 0) -
                        (discountCurrency === 'USD' ? discountValue : 0);
                    
                    // Check if this is a payment order or receive without money receive
                    const isPaymentOrReceiveWithoutMoney = 
                        (selectedValue.orderType?.value === "payment" || 
                        (selectedValue.orderType?.value === "receive" && !form.withMoneyReceive));
                    
                    // Calculate ILS net value
                    let ilsNetValue = 0;
                    
                    // Check if COD value is negative
                    const isIlsCodNegative = codByCurrency.ILS < 0;
                    
                    // Direct calculation based on COD and fees, preserving negative values
                    if (isPaymentOrReceiveWithoutMoney) {
                        // For payment or receive without money receive, make COD negative if it's not already
                        const ilsCodValue = isIlsCodNegative ? codByCurrency.ILS : -codByCurrency.ILS;
                        ilsNetValue = ilsCodValue - ilsFees; // Subtract fees (not add) to preserve sign
                    } else {
                        // For normal delivery, simply subtract fees from COD
                        ilsNetValue = codByCurrency.ILS - ilsFees;
                        
                        // Only apply deficit coverage logic if we have a negative value and other currencies
                        if (ilsNetValue < 0 && !isIlsCodNegative) { // Skip deficit coverage if COD was intentionally negative
                            const ilsDeficit = Math.abs(ilsNetValue);
                            const jodCoverage = codByCurrency.JOD * CURRENCY_EXCHANGE_RATES.JOD_TO_ILS;
                            const usdCoverage = codByCurrency.USD * CURRENCY_EXCHANGE_RATES.USD_TO_ILS;
                            
                            // If JOD can fully cover the deficit
                            if (jodCoverage >= ilsDeficit) {
                                ilsNetValue = 0; // JOD covers it completely
                            }
                            // If USD can fully cover the deficit
                            else if (usdCoverage >= ilsDeficit) {
                                ilsNetValue = 0; // USD covers it completely
                            }
                            // If JOD and USD together can cover the deficit
                            else if (jodCoverage + usdCoverage >= ilsDeficit) {
                                ilsNetValue = 0; // Combined coverage
                            }
                            // Otherwise, keep the negative value
                        }
                    }
                    
                    // Calculate JOD net value
                    let jodNetValue = 0;
                    
                    // Check if COD value is negative
                    const isJodCodNegative = codByCurrency.JOD < 0;
                    
                    // Direct calculation for JOD, preserving negative values
                    if (isPaymentOrReceiveWithoutMoney) {
                        // For payment or receive without money receive, make it negative if it's not already
                        const jodCodValue = isJodCodNegative ? codByCurrency.JOD : -codByCurrency.JOD;
                        jodNetValue = jodCodValue - jodFees; // Subtract fees (not add) to preserve sign
                    } else {
                        // Start with JOD COD minus JOD fees
                        jodNetValue = codByCurrency.JOD - jodFees;
                        
                        // Handle ILS deficit coverage if needed
                        if (ilsNetValue < 0 && jodNetValue > 0 && !isIlsCodNegative && !isJodCodNegative) {
                            // Calculate how much of the ILS deficit this JOD can cover
                            const ilsDeficitToJod = Math.min(
                                Math.abs(ilsNetValue) / CURRENCY_EXCHANGE_RATES.JOD_TO_ILS,
                                jodNetValue
                            );
                            
                            // Deduct the coverage amount from JOD net value
                            jodNetValue -= ilsDeficitToJod;
                        }
                    }
                    
                    // Calculate USD net value
                    let usdNetValue = 0;
                    
                    // Check if COD value is negative
                    const isUsdCodNegative = codByCurrency.USD < 0;
                    
                    // Direct calculation for USD, preserving negative values
                    if (isPaymentOrReceiveWithoutMoney) {
                        // For payment or receive without money receive, make it negative if it's not already
                        const usdCodValue = isUsdCodNegative ? codByCurrency.USD : -codByCurrency.USD;
                        usdNetValue = usdCodValue - usdFees; // Subtract fees (not add) to preserve sign
                    } else {
                        // Start with USD COD minus USD fees
                        usdNetValue = codByCurrency.USD - usdFees;
                        
                        // Handle remaining ILS deficit after JOD coverage
                        if (ilsNetValue < 0 && usdNetValue > 0 && !isIlsCodNegative && !isUsdCodNegative) {
                            // Calculate how much of the ILS deficit this USD can cover
                            const ilsDeficitToUsd = Math.min(
                                Math.abs(ilsNetValue) / CURRENCY_EXCHANGE_RATES.USD_TO_ILS,
                                usdNetValue
                            );
                            
                            // Deduct the coverage amount from USD net value
                            usdNetValue -= ilsDeficitToUsd;
                        }
                    }
                    
                    // Format the result with pipe separators
                    const netValues = [];
                    
                    // Always include ILS
                    netValues.push(`ILS: ${ilsNetValue.toFixed(2)}`);
                    
                    // Include JOD if it has a non-zero value
                    if (codByCurrency.JOD !== 0 || jodFees !== 0) {
                        netValues.push(`JOD: ${jodNetValue.toFixed(2)}`);
                    }
                    
                    // Include USD if it has a non-zero value
                    if (codByCurrency.USD !== 0 || usdFees !== 0) {
                        netValues.push(`USD: ${usdNetValue.toFixed(2)}`);
                    }
                    
                    return netValues.join(' | ');
                })(),
                readOnly: true,
                editable: false,
                style: { fontWeight: 'bold', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.05)' }
            }
        ].filter(Boolean)
    },!["payment"].includes(selectedValue.orderType?.value) ? {
        label: translations[language].tabs.orders.create.sections.details.title,
        icon: <Feather name="box" size={22} color='#EF4444' />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.details.fields.product,
            type: "input",
            name: "order_items",
            value: form.orderItems || "",
            onChange: (input) => setForm((form) => ({ ...form, orderItems: input }))
        }, {
            label: translations[language].tabs.orders.create.sections.details.fields.quantity,
            type: "input",
            name: "number_of_items",
            value: form.numberOfItems || "",
            onChange: (input) => setForm((form) => ({ ...form, numberOfItems: input }))
        }, {
            label: translations[language].tabs.orders.create.sections.details.fields.weight,
            type: "input",
            name: "order_weight",
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
        icon: <Feather name="file-text" size={22} color='#6366F1' />,
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
                // Use our custom handler to ensure delivery fee updates
                handleSelectedValueChange('city', { name: city.name, city_id: city.city_id });
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

    const handleDuplicateOrder = async (orderId) => {
        setFormSpinner({status: true});
        setError({status: false, msg: ""});
        setSuccess(false);
        setFieldErrors({});
        
        try {
            // Get current branch info for the duplicate request
            const currentBranchId = user.branch_id || user.current_branch_id;
            
            // Prepare receiver info from form data
            const receiverInfo = {
                name: form.receiverName || "",
                phone: form.receiverFirstPhone || "",
                phone_2: form.receiverSecondPhone || "",
                address: form.receiverAddress || "",
                city_id: selectedValue.city?.city_id || form.senderCityId || ""
            };
            
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': language
                },
                credentials: "include",
                body: JSON.stringify({
                    order_id: orderId,
                    receiver_info: receiverInfo,
                    current_branch_id: currentBranchId
                })
            });
            
            const data = await response.json();            
            if (response.ok && data.success) {
                setSuccess(true);
                setFormSpinner({status: false});
                
                // Show success message
                setShowAlert({
                    visible: true,
                    type: 'success',
                    title: translations[language].tabs.orders.create.success || "Success",
                    message: `تم اعادة ارسال الطرد بنجاح. رقم الطرد الجديد: ${data.data.new_order_id}`,
                    onClose: () => router.push("/(tabs)")
                });
            } else {
                throw new Error(data.message || translations[language].tabs.orders.create.error || "Error");
            }
            
        } catch (err) {
            setFormSpinner({status: false});
            console.error('Duplicate order error:', err);
            
            // Show error message in alert instead of just setting error state
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: err.message || translations[language].tabs.orders.create.error || "An unexpected error occurred",
                onClose: () => {}
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
            const value = parseFloat(item.value) || 0;
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
            .filter(item => item.value)
            .map(item => ({
                value: parseFloat(item.value),
                currency: item.currency || 'ILS'
            }));

        // If there are no COD values and payment type is not check, add a default value
        if (codValues.length === 0 && !["check"].includes(selectedValue.paymentType.value)) {
            codValues.push({ value: 0, currency: 'ILS' });
        }

        // Ensure commission exists (required field)
        const commission = [{ value: 0, currency: 'ILS' }];

        // Ensure discount exists (required field)
        const discount = [{ value: 0, currency: 'ILS' }];

        function sanitizeInput(input) {
            return input === undefined ? null : input;
        }

        try {
            // Check if this is a duplicate order submission
            if (isDuplicate === 'true') {
                return await handleDuplicateOrder(orderId);
            }
            
            // Create the request body based on the method
            const requestBody = {
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
                with_money_receive: form.withMoneyReceive || false,
                exceed_balance_limit: exceedBusinessBalance || false,
                note: form.noteContent,
                checks: formattedChecks
            };
            
            // Only add current_branch_id for POST requests
            if (method === "POST" && !["business"].includes(user.role)) {
                requestBody.current_branch_id = user.branch_id;
            }

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`, {
                method: method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': language,
                },
                body: JSON.stringify(requestBody)
            });

            const data = await res.json();

            if (!res.ok) {
                throw {
                    status: res.status,
                    ...data
                };
            }

            // // Process business balance deduction if enabled
            // if (form.fromBusinessBalance && data.data?.order_id) {
            //     // Add check to prevent duplicate deductions on edit
            //     const shouldDeduct = method === "POST" || 
            //                         (method === "PUT" && !form.originalFromBusinessBalance);
                
            //     if (shouldDeduct) {
            //         try {
            //             await processDeduction(data.data.order_id, user.role === "business" ? user.userId : selectedValue.sender.user_id);
            //         } catch (error) {
            //             Alert.alert(
            //                 translations[language].tabs.orders.create.sections.sender.fields.deduction_error || "Deduction Error",
            //                 error.message || translations[language].tabs.orders.create.sections.sender.fields.deduction_failed || "Failed to process deduction",
            //                 [{ text: "OK" }]
            //             );
            //         }
            //     }
            // }

            setFormSpinner({ status: false });
            setSuccess(true);

            setShowAlert({
                visible: true,
                type: 'success',
                title: translations[language].tabs.orders.create.success,
                message: translations[language].tabs.orders.create.successMsg,
                onClose: () => router.push("/(tabs)")
            });

        } catch (err) {
            setFormSpinner({ status: false });
            
            if (err.type === 'VALIDATION_ERROR' && err.details) {
                // Handle validation errors
                const errors = {};
                
                err.details.forEach(error => {
                    // Map server field names to form field names
                    const fieldName = mapServerFieldToFormField(error.field);
                    errors[fieldName] = error.message;
                });
                
                setFieldErrors(errors);

                // Set general error message
                setError({
                    status: true,
                    msg: translations[language].tabs.orders.create.errorValidationMsg
                });
                
                // Add this code to show alert for validation errors
                setShowAlert({
                    visible: true,
                    type: 'error',
                    title: translations[language].tabs.orders.create.error || "Validation Error",
                    message: translations[language].tabs.orders.create.errorValidationMsg || "Please check the form for errors"
                });
                
                // Find section with first error and scroll to it
                if (Object.keys(errors).length > 0 && scrollViewRef.current) {
                    const firstErrorField = Object.keys(errors)[0];
                    
                    // Find section index containing the error field
                    let sectionWithErrorIndex = -1;
                    
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
                            break;
                        }
                    }
                    
                    // If found section with error, scroll to it
                    if (sectionWithErrorIndex >= 0) {
                        // Calculate position based on section index
                        const approximatePosition = sectionWithErrorIndex * 280;
                        
                        // Scroll with offset
                        scrollViewRef.current.scrollTo({
                            y: Math.max(0, approximatePosition - 60),
                            animated: true
                        });
                    }
                }
            } else if (err.type === 'INSUFFICIENT_BALANCE') {
                // Handle insufficient balance error specifically
                    setError({
                        status: true,
                    msg: err.details || err.message || translations[language].tabs.orders.create.insufficientBalanceMsg
                    });

                // Show alert for insufficient balance
                    setShowAlert({
                        visible: true,
                        type: 'error',
                    title: translations[language].tabs.orders.create.insufficientBalance || "Insufficient Balance",
                    message: err.details || err.message || translations[language].tabs.orders.create.balanceTooLow
                });
                
                // Reset business balance checkbox since the operation failed
                setFromBusinessBalance(false);
                setForm(prev => ({
                    ...prev,
                    fromBusinessBalance: false,
                    balanceDeduction: null
                }));
                
            } else if (err.type === 'FORBIDDEN_STATUS') {
                // Handle forbidden status error
                setError({
                    status: true,
                    msg: err.details || err.message || translations[language].tabs.orders.create.forbiddenStatus
                });

                setShowAlert({
                    visible: true,
                    type: 'error',
                    title: translations[language].tabs.orders.create.error,
                    message: err.details || err.message || translations[language].tabs.orders.create.forbiddenStatus
                });
            } else {
                // Handle any other error types
                setError({
                    status: true,
                    msg: err.type === "FORBIDDEN" ? err.message : 
                        (err.message || translations[language].tabs.orders.create.errorMsg)
                });
                
                setShowAlert({
                    visible: true,
                    type: 'error',
                    title: translations[language].tabs.orders.create.error,
                    message: err.message || translations[language].tabs.orders.create.errorMsg
                });
            }
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
            
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
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
            let extractedDeliveryFee;
            if (typeof orderData.delivery_fee === 'string') {
                const deliveryFeeMatch = orderData.delivery_fee.match(/([0-9.]+)/);
                extractedDeliveryFee = deliveryFeeMatch ? deliveryFeeMatch[1] : "0";
            } else if (typeof orderData.delivery_fee === 'number') {
                extractedDeliveryFee = orderData.delivery_fee.toString();
            } else {
                extractedDeliveryFee = "0";
            }
            
            // Set delivery fee from the order data
            setDeliveryFee(extractedDeliveryFee);
            
            // Handle COD values
            if (orderData.cod_values && Array.isArray(orderData.cod_values) && orderData.cod_values.length > 0) {
                setCodAmounts(orderData.cod_values.map(item => ({
                    value: item.value.toString(),
                    currency: item.currency
                })));
            }
            
            // Set form data - store original values for comparison
            setForm({
                receiverName: orderData.receiver_name,
                receiverFirstPhone: orderData.receiver_mobile,
                receiverSecondPhone: orderData.receiver_second_mobile,
                receiverCity: orderData.receiver_city,
                receiverCityId: orderData.receiver_city_id, // Store original city ID for comparison
                receiverAddress: orderData.receiver_address,
                sender: orderData.sender,
                senderId: orderData.sender_id,
                senderCityId: orderData.sender_city_id,
                deliveryFee: extractedDeliveryFee,
                originalDeliveryFee: extractedDeliveryFee, // Store original delivery fee
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
                withMoneyReceive: orderData.with_money_receive ? true : false,
                originalFromBusinessBalance: orderData.from_business_balance ? true : false,
                balanceDeduction: orderData.balance_deduction || null,
                originalBalanceDeduction: orderData.balance_deduction || null,
                referenceId: orderData.reference_id || null,
                itemsType: orderData.items_type // Store original items type for comparison
            });
            
            // Set checks
            if (orderData.checks && Array.isArray(orderData.checks) && orderData.checks.length > 0) {
                setChecks(orderData.checks);
            } else {
                setChecks([]);
            }
                        
        } catch (err) {
            console.error("Error fetching order data:", err);
        }
    };

    const fetchSenders = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?language_code=${language}&role_id=2&active_users=1&np=${prickerSearchValue}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                }
            });
            const data = await res.json();
            // Make sure we're setting the data in the expected format
            setSenders({
                data: data.data || [],
                metadata: data.metadata || {}
            });
        } catch (err) {
            // Error handling
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
        
        // If we're in edit mode and the original data is loaded, don't recalculate
        if (orderId && form.deliveryFee && 
            selectedValue.city?.city_id === form.receiverCityId &&
            selectedValue.itemsType?.value === form.itemsType) {
            return;
        }
        
        try {
            // For business users, use their ID directly if sender is not set
            const senderId = user.role === "business" ? user.userId : (selectedValue.sender?.user_id || form.senderId);
            const senderCityId = user.role === "business" ? user.city_id : (selectedValue.sender?.city_id || form.senderCityId);
            
            // Only attempt to fetch if we have both sender city and receiver city
            if (!senderCityId || !selectedValue.city?.city_id) {
                return;
            }
            
            
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/delivery_fee?senderCityId=${senderCityId}&receiverCityId=${selectedValue.city.city_id}&orderType=${selectedValue?.itemsType?.value || "normal"}&senderId=${senderId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                }
            });
            const data = await res.json();
            
            
            if (data.data) {
                setDeliveryFee(data.data.toString());
                // Also update the form state to ensure consistency
                setForm(prevForm => ({
                    ...prevForm,
                    deliveryFee: data.data.toString()
                }));
            }
        } catch (err) {
            console.error("Error fetching delivery fee:", err);
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
    
    // Update the useEffect hooks for delivery fee
    useEffect(() => {
        if (orderId) {
            fetchOrderData();
        }
    }, [orderId]);
    
    useEffect(() => {
        fetchCities();
    }, []);
    
    // This effect handles delivery fee updates when sender or city changes
    useEffect(() => {
        
        // Only fetch if we have both sender and city
        if (selectedValue.sender && selectedValue.city) {
            fetchDeliveryFee();
        }
    }, [selectedValue.sender, selectedValue.city]);

    // This effect handles delivery fee updates when item type changes (only for new orders)
    useEffect(() => {
        if (!orderId && shouldUpdateDeliveryFee && selectedValue.itemsType && selectedValue.sender && selectedValue.city) {
            fetchDeliveryFee();
        }
    }, [selectedValue.itemsType, orderId, shouldUpdateDeliveryFee]);

    // This effect handles delivery fee updates when order type changes (only for new orders)
    useEffect(() => {
        
        // Only update delivery fee if:
        // 1. Not in edit mode (no orderId), or
        // 2. In edit mode but order type has changed from original
        if (selectedValue.orderType && selectedValue.sender && selectedValue.city) {
            if (!orderId || (orderId && selectedValue.orderType.value !== form.orderTypeId)) {
                fetchDeliveryFee();
            }
        }
    }, [selectedValue.orderType]);
    
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
    
    // Add event listener for scanned reference ID from the camera
    useEffect(() => {
        // Create event listener for REFERENCE_SCANNED event
        const handleReferenceScanned = (scannedValue) => {
            if (scannedValue) {
                // Update the form with the scanned reference ID
                setForm(prevForm => ({
                    ...prevForm,
                    referenceId: scannedValue
                }));
            }
        };
        
        // Add the event listener
        const unsubscribe = eventEmitter.on(EVENTS.REFERENCE_SCANNED, handleReferenceScanned);
        
        // Clean up the event listener when component unmounts
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
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
                    { backgroundColor: colors.card },
                    type === 'error' ? styles.errorAlert : 
                    type === 'success' ? styles.successAlert : 
                    styles.warningAlert,
                ]}>
                    <View style={[styles.alertHeader]}>
                        <Text style={[styles.alertTitle, { color: colors.text }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>{message}</Text>
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
                            <Text style={[styles.alertButtonText, { color: colors.text }]}>
                                {translations[language]?.ok || 'OK'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <ActivityIndicator size="large" color={colors.primary} />
                    )}
                </View>
            </View>
        );
    };

    // Add this useEffect to handle auto-setting from_business_balance for business users
    useEffect(() => {
        if (user.role === "business") {
            if (selectedValue.orderType?.value === "payment" || 
                (selectedValue.orderType?.value === "receive" && !form.withMoneyReceive)) {
                setFromBusinessBalance(true);
                setForm(prevForm => ({
                    ...prevForm,
                    fromBusinessBalance: true
                }));
            }
        }
    }, [selectedValue.orderType, form.withMoneyReceive]);

    useEffect(() => {
        if (user.role !== "business") {
            fetchSenders();
        }
    }, [prickerSearchValue, user.role, language]);
    
    // Initialize sender for business users
    useEffect(() => {
        if (user.role === "business" && !orderId) {
            // Set the business user as the sender
            setSelectedValue(prev => ({
                ...prev,
                sender: {
                    name: user.name || user.username,
                    value: user.userId,
                    user_id: user.userId,
                    city_id: user.city_id
                }
            }));
        }
    }, [user.role, user.userId, orderId]);

    // Add a separate effect for item type changes
    useEffect(() => {
        
        // Only update delivery fee if:
        // 1. Not in edit mode (no orderId), or
        // 2. In edit mode but item type has changed from original
        if (selectedValue.itemsType && selectedValue.sender && selectedValue.city) {
            if (!orderId || (orderId && selectedValue.itemsType.value !== form.itemsType)) {
                fetchDeliveryFee();
            }
        }
    }, [selectedValue.itemsType]);

    // Add a separate effect for order type changes
    useEffect(() => {
        if (!orderId && selectedValue.orderType && selectedValue.sender && selectedValue.city) {
            // Only update delivery fee based on order type for new orders
            setShouldUpdateDeliveryFee(true);
            fetchDeliveryFee();
        }
    }, [selectedValue.orderType]);

    // Set status bar style based on theme
    useEffect(() => {
        StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
        if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor('transparent');
            StatusBar.setTranslucent(true);
        }
    }, [isDark]);
    
    // Check if user has seen onboarding
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            try {
                // // Check if test mode is enabled
                // const testModeEnabled = await SecureStore.getItemAsync(`create_onboarding_test_mode`);
                // if (testModeEnabled === 'enabled') {
                //     // Always show onboarding in test mode
                //     setShowOnboarding(true);
                //     animateOnboarding(true);
                //     return;
                // }
                
                const hasSeenOnboarding = await SecureStore.getItemAsync(`create_onboarding_${user.userId}`);
                if (!hasSeenOnboarding && user?.userId && !orderId) {
                    // Show onboarding for new users creating orders
                    setShowOnboarding(true);
                    animateOnboarding(true);
                }
            } catch (error) {
            }
        };
        
        checkOnboardingStatus();
    }, [user]);
    
    // Animation functions
    const animateOnboarding = (show) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: show ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: show ? 0 : 100,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };
    
    const goToNextStep = () => {
        if (currentStep < onboardingSteps.length - 1) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setCurrentStep(currentStep + 1);
                slideAnim.setValue(100);
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }
    };
    
    const goToPrevStep = () => {
        if (currentStep > 0) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 100,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setCurrentStep(currentStep - 1);
                slideAnim.setValue(-100);
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }
    };
    
    const completeOnboarding = async () => {
        try {
            await SecureStore.setItemAsync(`create_onboarding_${user.userId}`, 'completed');
            animateOnboarding(false);
            setTimeout(() => setShowOnboarding(false), 300);
        } catch (error) {
            setShowOnboarding(false);
        }
    };
    
    // Onboarding steps content with icons matching section icons
    const onboardingSteps = [
        {
            key: 'welcome',
            title: translations[language]?.createOnboarding?.welcome?.title,
            message: translations[language]?.createOnboarding?.welcome?.message,
            icon: <SimpleLineIcons name="control-start" size={24} color="#ffffff" />,
            color: '#4361EE'
        },
        {
            key: 'orderTypes',
            title: translations[language]?.createOnboarding?.orderTypes?.title,
            message: translations[language]?.createOnboarding?.orderTypes?.message,
            icon: <Feather name="package" size={24} color="#ffffff" />,
            color: '#3B82F6',
            highlightType: 'header'
        },
        {
            key: 'reference',
            title: translations[language]?.createOnboarding?.reference?.title,
            message: translations[language]?.createOnboarding?.reference?.message,
            icon: <AntDesign name="qrcode" size={24} color="#ffffff" />,
            color: '#8B5CF6'
        },
        {
            key: 'client',
            title: translations[language]?.createOnboarding?.client?.title,
            message: translations[language]?.createOnboarding?.client?.message,
            icon:<AntDesign name="user" size={24} color="#ffffff"/>,
            color: '#EC4899'
        },
        {
            key: 'cost',
            title: translations[language]?.createOnboarding?.cost?.title ,
            message: translations[language]?.createOnboarding?.cost?.message,
            icon: <FontAwesome name="money" size={24} color="#ffffff" />,
            color: '#10B981'
        },
        {
            key: 'details',
            title: translations[language]?.createOnboarding?.details?.title ,
            message: translations[language]?.createOnboarding?.details?.message,
            icon:<Octicons name="package" size={24} color="#ffffff" />,
            color: '#EF4444'
        },
        {
            key: 'notes',
            title: translations[language]?.createOnboarding?.notes?.title,
            message: translations[language]?.createOnboarding?.notes?.message,
            icon: <FontAwesome5 name="sticky-note" size={24} color="#ffffff" />,
            color: '#6366F1'
        },
        {
            key: 'ready',
            title: translations[language]?.createOnboarding?.ready?.title ,
            message: translations[language]?.createOnboarding?.ready?.message,
            icon: <MaterialIcons name="done" size={24} color="#ffffff" />,
            color: '#059669'
        }
    ];


    return (
        <SafeAreaView 
            style={[styles.safeArea, { backgroundColor: colors.background }]}
            edges={['right', 'left']}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent={true}
            />
            
            <View style={[styles.pageContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.orderTypeHeaderText, { color: colors.text }]}>{translations[language].tabs.orders.create.sections.orderTypes.titlePlaceholder}</Text>
                    <View style={[styles.orderTypeButtonsContainer, { backgroundColor: colors.card }]}>
                        {orderTypes.map((type, index) => (
                            <Field
                                key={index}
                                field={{
                                    type: "orderTypeButton",
                                    label: type.name,
                                    isSelected: selectedValue.orderType?.value === type.value,
                                    icon: type.value === "delivery" ? <MaterialIcons name="local-shipping" size={18} color={colors.text} /> :
                                          type.value === "receive" ? <MaterialIcons name="store" size={18} color={colors.text} /> :
                                          type.value === "delivery/receive" ? <MaterialIcons name="sync" size={18} color={colors.text} /> :
                                          <MaterialIcons name="payments" size={18} color={colors.text} />,
                                    onPress: () => {
                                        // Reset toggle states when switching order types
                                        setFromBusinessBalance(false);
                                        setWithMoneyReceive(false);
                                        setForm(prevForm => ({
                                            ...prevForm,
                                            fromBusinessBalance: false,
                                            withMoneyReceive: false,
                                            balanceDeduction: null
                                        }));
                                        
                                        setSelectedValue(prev => ({
                                            ...prev,
                                            orderType: type
                                        }));
                                    
                                        // Show alert for business users when selecting receive or payment order types
                                        if (user.role === "business" && (type.value === "receive" || type.value === "payment")) {
                                            Alert.alert(
                                                translations[language].tabs.orders.create.sections.sender.fields.auto_deduction_notice,
                                                type.value === "receive" ? translations[language].tabs.orders.create.sections.sender.fields.auto_deduction_message : translations[language].tabs.orders.create.sections.sender.fields.auto_deduction_message_payment,

                                                [{ 
                                                    text: translations[language].ok || "OK",
                                                    style: "default"
                                                }],
                                                { 
                                                    cancelable: false,
                                                    icon: type.value === "receive" ? <MaterialIcons name="store" size={24} color="#4361EE" /> : 
                                                          <MaterialIcons name="payments" size={24} color="#4361EE" />
                                                }
                                            );
                                        }
                                    }
                                }}
                            />
                        ))}
                    </View>
                    
                    {/* Add with_money_receive toggle directly in the header
                    {selectedValue.orderType?.value === "receive" && (
                        <View style={styles.businessBalanceToggleContainer}>
                            <Field
                                field={{
                                    type: "toggle",
                                    label: translations[language].tabs.orders.create.sections.sender.fields.with_money_receive,
                                    name: "with_money_receive",
                                    value: form.withMoneyReceive || false,
                                    onChange: (value) => {
                                        setWithMoneyReceive(value);
                                        setForm(prevForm => ({
                                            ...prevForm,
                                            withMoneyReceive: value
                                        }));
                                        
                                        // For business users, auto-set from_business_balance based on with_money_receive
                                        if (user.role === "business" && !value) {
                                            setFromBusinessBalance(true);
                                            setForm(prevForm => ({
                                                ...prevForm,
                                                fromBusinessBalance: true
                                            }));
                                        }
                                    }
                                }}
                            />
                        </View>
                    )} */}
                </View>
                <ScrollView 
                    ref={scrollViewRef}
                    style={[styles.container]}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                >
                    <View style={styles.main}>
                    {sections.slice(1).map((section, index) => (
                        <Section
                            key={index}
                            section={section}
                            setSelectedValue={setSelectedValue}
                            loadMoreData={loadMoreData}
                            loadingMore={loadingMore}
                            prickerSearchValue={prickerSearchValue}
                            setPickerSearchValue={setPickerSearchValue}
                            fieldErrors={fieldErrors}
                            setFieldErrors={setFieldErrors}
                        />
                    ))}
                    </View>
                </ScrollView>
                <SafeAreaView edges={['']}>
                    <TouchableOpacity 
                        style={[styles.submitButton, {
                            marginHorizontal: 40,
                            marginVertical: Platform.OS === 'ios' ? 20 : 0,
                        }]}
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
                            <Text style={[styles.submitButtonText]}>
                                {isDuplicate === 'true' 
                                    ? (translations[language].tabs.orders.order.resend || "Re send")
                                    : translations[language].tabs.orders.create.submit
                                }
                            </Text>
                        )}
                    </TouchableOpacity>
                </SafeAreaView>
            
                {/* Loading Spinner */}
                {formSpinner.status && (
                    <View style={styles.overlay}>
                        <View style={styles.spinnerContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.spinnerText, { color: colors.text }]}>
                                {translations[language].tabs.orders.create.loading}
                            </Text>
                        </View>
                    </View>
                )}
            
                {/* Success Message */}
                {success && (
                    <View style={styles.successOverlay}>
                        <View style={styles.successContainer}>
                            <Ionicons name="checkmark-circle" size={60} color={colors.primary} />
                            <Text style={[styles.successText, { color: colors.text }]}>
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
                        <View style={[styles.currencyPickerContainer, { backgroundColor: colors.card }]}>
                            <Text style={[styles.currencyPickerTitle, { color: colors.text }]}>
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
                                                { color: colors.text },
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
                                <Text style={[styles.cancelCurrencyText, { color: colors.text }]}>
                                    {translations[language]?.common.cancel}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ModalPresentation>
                )}
                {/* Receiver Search Modal */}
                <ReceiverSearchModal
                    showModal={showReceiverModal}
                    setShowModal={setShowReceiverModal}
                    onReceiverSelect={(receiver) => {
                        handleReceiverSelect(receiver);
                        setShowReceiverModal(false);
                    }}
                    onAddNewReceiver={(phone) => {
                        // Set the phone number in the form
                        setForm(prev => ({
                            ...prev,
                            receiverFirstPhone: phone
                        }));
                        setShowReceiverModal(false);
                    }}
                />
                
                {/* Onboarding Modal */}
                {showOnboarding && (
                    <Modal
                        transparent={true}
                        visible={showOnboarding}
                        animationType="fade"
                        statusBarTranslucent={true}
                    >
                        <View style={styles.onboardingOverlay}>
                            <View style={[styles.onboardingContainer, { backgroundColor: colors.card }]}>
                                {/* Onboarding Content */}
                                <Animated.View
                                    {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
                                    style={[
                                        styles.onboardingContent,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateY: slideAnim }],
                                        },
                                    ]}
                                >
                                    <View style={[styles.onboardingIconContainer, { backgroundColor: onboardingSteps[currentStep].color }]}>
                                        {onboardingSteps[currentStep].icon}
                                    </View>
                                    
                                    <Text style={[styles.onboardingTitle, { color: colors.text }]}>
                                        {onboardingSteps[currentStep].title}
                                    </Text>
                                    
                                    <Text style={[styles.onboardingMessage, { color: colors.textSecondary }]}>
                                        {onboardingSteps[currentStep].message}
                                    </Text>
                                    
                                    {/* Progress Indicators */}
                                    <View style={styles.progressIndicators}>
                                        {onboardingSteps.map((_, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.progressDot,
                                                    {
                                                        backgroundColor: index === currentStep ? onboardingSteps[currentStep].color : colors.border,
                                                        width: index === currentStep ? 20 : 8,
                                                    }
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    
                                    {/* Navigation Buttons */}
                                    <View style={styles.onboardingNavigation}>
                                        {currentStep > 0 ? (
                                            <TouchableOpacity
                                                style={[styles.onboardingButton, styles.onboardingBackButton, { borderColor: colors.border }]}
                                                onPress={goToPrevStep}
                                            >
                                                <Text style={[styles.onboardingButtonText, { color: colors.text }]}>
                                                    {translations[language]?.createOnboarding?.back || 'Back'}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={{ flex: 1 }} />
                                        )}
                                        
                                        <TouchableOpacity
                                            style={[
                                                styles.onboardingButton, 
                                                styles.onboardingNextButton,
                                                { backgroundColor: onboardingSteps[currentStep].color }
                                            ]}
                                            onPress={currentStep < onboardingSteps.length - 1 ? goToNextStep : completeOnboarding}
                                        >
                                            <Text style={styles.onboardingNextButtonText}>
                                                {currentStep < onboardingSteps.length - 1 ? 
                                                    (translations[language]?.createOnboarding?.next || 'Next') : 
                                                    (translations[language]?.createOnboarding?.finish || 'Get Started')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    
                                    {/* Skip Button */}
                                    {currentStep < onboardingSteps.length - 1 && (
                                        <TouchableOpacity
                                            style={styles.skipButton}
                                            onPress={completeOnboarding}
                                        >
                                            <Text style={[styles.skipButtonText, { color: colors.textTertiary }]}>
                                                {translations[language]?.createOnboarding?.skip || 'Skip Tutorial'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </Animated.View>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </SafeAreaView>
    );
}
    
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    testButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    testButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    testButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    // Onboarding styles
    onboardingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onboardingContainer: {
        width: '90%',
        maxWidth: 500,
        borderRadius: 24,
        overflow: 'hidden',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    onboardingContent: {
        width: '100%',
    },
    onboardingIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },
    onboardingHighlight: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#4361EE',
        borderRadius: 8,
        zIndex: 999,
    },
    onboardingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    onboardingMessage: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    progressIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        gap: 6,
    },
    progressDot: {
        height: 8,
        width: 8,
        borderRadius: 4,
        marginHorizontal: 2,
    },
    onboardingNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    onboardingButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    onboardingBackButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    onboardingNextButton: {
        flex: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    onboardingButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    onboardingNextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 14,
    },
    pageContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        paddingTop: 10,
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 1000,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
    },
    main: {
        padding: 12,
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
        width: '80%',
        marginHorizontal: 40,
        shadowColor: '#4361EE',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        marginVertical: 4,
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
        gap:10,
    },
    messageTextContainer: {
        flex: 1,
    },
    messageTitle: {
        fontSize: 16, // Increased from 15
        fontWeight: '700', // Increased from 600
        color: '#92400E',
    },
    messageText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
        fontWeight: '500', // Added for better visibility
    },
    orderTypeHeaderText: {
        fontSize: 12, // Reduced from 13
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center'
    },
    orderTypeButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    businessBalanceToggleContainer: {
        borderRadius: 8,
    },
    togglesRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    toggleItem: {
        flex: 1,
        paddingHorizontal: 4,
    },
});