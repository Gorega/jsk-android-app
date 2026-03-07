import { View, StyleSheet, ScrollView, Text, Alert, ActivityIndicator, Keyboard, TouchableOpacity, Platform, StatusBar, Animated, Dimensions, Modal, KeyboardAvoidingView } from "react-native";
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
    
    // Function to convert Arabic/Persian numerals to English
    const convertToEnglishNumerals = (input) => {
        if (!input) return input;
        const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
        const persianNumerals = '۰۱۲۳۴۵۶۷۸۹';
        const englishNumerals = '0123456789';
        
        return input.replace(/[٠-٩۰-۹]/g, (char) => {
            const arabicIndex = arabicNumerals.indexOf(char);
            const persianIndex = persianNumerals.indexOf(char);
            
            if (arabicIndex !== -1) {
                return englishNumerals[arabicIndex];
            } else if (persianIndex !== -1) {
                return englishNumerals[persianIndex];
            }
            return char;
        });
    };
    const [error, setError] = useState({});
    const [formSpinner, setFormSpinner] = useState({})
    const [fieldErrors, setFieldErrors] = useState({});
    const { orderId, isDuplicate, mode } = useLocalSearchParams();
    const isBulkMode = mode === "bulk";
    const [bulkText, setBulkText] = useState("");
    const [bulkResult, setBulkResult] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkCreateLoading, setBulkCreateLoading] = useState(false);
    const [bulkJobId, setBulkJobId] = useState(null);
    const [senders, setSenders] = useState({
        data: [],
        metadata: {},
        loading: false,
        error: null,
        hasMore: false,
        currentPage: 1,
        searchTerm: ''
    });
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const { user } = useAuth()
    const [cities, setCities] = useState([]);
    
    // Enhanced cities state management for pagination and search
    const [citiesState, setCitiesState] = useState({
        data: [],
        loading: false,
        error: null,
        hasMore: true,
        page: 1,
        totalRecords: 0,
        searchTerm: '',
        searchLoading: false
    });
    
    // Debounced search term for cities
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    // Direct search for senders - no debouncing needed
    
    // Cache for cities data to avoid unnecessary API calls
    const [citiesCache, setCitiesCache] = useState(new Map());
    
    // Debounce effect for search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(citiesState.searchTerm);
        }, 300);
        
        return () => clearTimeout(timer);
    }, [citiesState.searchTerm]);

    // Direct search - no debouncing needed since we handle it directly in setPickerSearchValue
    
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
    const normalizePackageItems = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    };
    const [selectedValue, setSelectedValue] = useState({
        sender: "",
        city: null,
        orderType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.orderTypes.delivery, value: "delivery" },
        paymentType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.paymentType.cash, value: "cash" },
        currency: orderId ? "" : { name: translations[language].tabs.orders.create.sections.currencyList.ILS, value: "ILS" },
        itemsType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.itemsCotnentType.normal, value: "normal" },
    });
    const handleAddPackageItem = () => {
        setForm(prev => ({
            ...prev,
            packageItems: [...(Array.isArray(prev.packageItems) ? prev.packageItems : []), ""]
        }));
    };
    const handleRemovePackageItem = (index) => {
        setForm(prev => {
            const next = Array.isArray(prev.packageItems) ? [...prev.packageItems] : [];
            next.splice(index, 1);
            return { ...prev, packageItems: next };
        });
    };
    const handlePackageItemChange = (index, value) => {
        setForm(prev => {
            const next = Array.isArray(prev.packageItems) ? [...prev.packageItems] : [];
            next[index] = convertToEnglishNumerals(value);
            return { ...prev, packageItems: next };
        });
    };
    const handlePackageItemScan = (index) => {
        if (!global) global = {};
        global.scanTargetField = `package_item_${index}`;
        router.push("/(camera)/scanReference");
    };
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
    const bulkTitle = translations[language]?.tabs?.createMultiple?.title;
    const bulkDescription = translations[language]?.tabs?.createMultiple?.description;
    const bulkAnalyzeLabel = translations[language]?.tabs?.createMultiple?.analyze;
    const bulkSubmitLabel = translations[language]?.tabs?.createMultiple?.submit;
    const bulkSummaryLabel = translations[language]?.tabs?.createMultiple?.summary;
    const bulkLoadingLabel = translations[language]?.tabs?.createMultiple?.loading;
    const bulkCreatingLabel = translations[language]?.tabs?.createMultiple?.creating;
    const senderLabel = translations[language].tabs.orders.create.sections.sender.title;

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

    const bulkItems = Array.isArray(bulkResult?.items) ? bulkResult.items : [];
    const bulkSummaryData = bulkResult ? {
        total: bulkResult.total || 0,
        valid: bulkResult.valid || 0,
        invalid: bulkResult.invalid || 0,
        items: bulkItems
    } : null;

    const normalizePhoneNumber = (phone) => {
        if (!phone) return "";
        let digits = convertToEnglishNumerals(phone.toString()).replace(/\D/g, '');
        if (digits.startsWith('00')) {
            digits = digits.substring(2);
        }
        if (digits.startsWith('970') || digits.startsWith('972')) {
            digits = digits.substring(3);
        }
        if (digits.length === 9) {
            return '0' + digits;
        }
        if (digits.length === 10) {
            return digits.startsWith('0') ? digits : '0' + digits.substring(1);
        }
        if (digits.length > 10) {
            const last10 = digits.slice(-10);
            if (last10.startsWith('0')) return last10;
            const last9 = digits.slice(-9);
            return '0' + last9;
        }
        return digits;
    };

    const recomputeBulkItemStatus = (item) => {
        const missing = [];
        if (!item.receiver_name) missing.push('name');
        const normalizedPhone = normalizePhoneNumber(item.receiver_mobile || '');
        if (!normalizedPhone || normalizedPhone.length !== 10) missing.push('phone');
        if (!item.receiver_address || item.receiver_address === '-') missing.push('address');
        if (!item.receiver_city_id) missing.push('city');
        return {
            ...item,
            receiver_mobile: normalizedPhone || item.receiver_mobile,
            status: missing.length === 0 ? 'ok' : 'invalid',
            missing_fields: missing,
            missing_messages: null
        };
    };

    const updateBulkItem = (rowOrIndex, fieldKey, value) => {
        setBulkResult(prev => {
            if (!prev || !Array.isArray(prev.items)) return prev;
            const updatedItems = prev.items.map((item, index) => {
                const matchKey = item.row ?? index + 1;
                if (matchKey !== rowOrIndex) return item;
                const next = { ...item };
                const trimmed = typeof value === 'string' ? value.trim() : value;
                if (fieldKey === 'receiver_name') next.receiver_name = trimmed;
                if (fieldKey === 'receiver_mobile') next.receiver_mobile = trimmed;
                if (fieldKey === 'receiver_second_mobile') next.receiver_second_mobile = trimmed;
                if (fieldKey === 'receiver_address') next.receiver_address = trimmed;
                if (fieldKey === 'receiver_city') {
                    if (trimmed && /^\d+$/.test(trimmed)) {
                        next.receiver_city_id = Number(trimmed);
                    }
                    next.receiver_city_raw = trimmed;
                    next.receiver_city_name = trimmed;
                    next.receiver_city_line = trimmed;
                }
                if (fieldKey === 'cod_value') {
                    const match = `${trimmed || ''}`.match(/([\d.]+)\s*([a-zA-Z₪$]+)?/);
                    if (match) {
                        next.cod_value = Number(match[1]);
                        if (match[2]) {
                            const currency = match[2].toUpperCase();
                            next.cod_currency = currency === '₪' ? 'ILS' : currency;
                        }
                    }
                }
                if (fieldKey === 'order_type') next.order_type = trimmed;
                if (fieldKey === 'notes') {
                    const parts = typeof trimmed === 'string'
                        ? trimmed.split('|').map(p => p.trim()).filter(Boolean)
                        : [];
                    next.notes = parts;
                }
                if (fieldKey === 'received_items') next.received_items = trimmed;
                if (fieldKey === 'received_quantity') {
                    next.received_quantity = Number.isFinite(Number(trimmed)) ? Number(trimmed) : trimmed;
                }
                if (fieldKey === 'raw') next.raw = trimmed;
                return recomputeBulkItemStatus(next);
            });
            const validCount = updatedItems.filter(item => item.status === 'ok').length;
            return {
                ...prev,
                items: updatedItems,
                valid: validCount,
                invalid: updatedItems.length - validCount,
                total: updatedItems.length
            };
        });
    };

    const sections = [{
        isHeader: true,
        fields: (
            <View />
        )
    }, isBulkMode ? {
        label: bulkTitle,
        icon: <MaterialIcons name="playlist-add" size={22} color="#F59E0B" />,
        fields: [
            {
                label: bulkTitle,
                type: "input",
                name: "bulk_text",
                value: bulkText,
                onChange: (input) => setBulkText(input),
                placeholder: bulkDescription,
                inputStyle: { minHeight: 140, textAlignVertical: "top" },
                multiline: true,
                blurOnSubmit: false
            },
            {
                type: "button",
                value: bulkLoading ? bulkLoadingLabel : bulkAnalyzeLabel,
                onPress: bulkLoading ? null : () => {
                    Keyboard.dismiss();
                    handleAnalyzeBulkText();
                },
                style: { backgroundColor: colors.primary }
            },
            bulkSummaryData ? {
                type: "bulkSummary",
                label: bulkSummaryLabel,
                value: bulkSummaryData,
                onBulkItemUpdate: updateBulkItem
            } : null
        ]
    } : null, !isBulkMode && !isDuplicate && {
        label: translations[language].tabs.orders.create.sections?.referenceId?.title,
        icon: <AntDesign name="qrcode" size={22} color= '#8B5CF6' />,
        fields: [{
            label: translations[language].tabs.orders.create.sections?.referenceId?.explain,
            type: "input",
            name: "qr_id",
            value: form.qrId,
            onChange: (input) => setForm((form) => ({ ...form, qrId: input })),
            showScanButton: true
        }]
    },user.role !== "business" ? {
        label: translations[language].tabs.orders.create.sections.sender.title,
        icon: <SimpleLineIcons name="user-follow" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.sender.fields.sender,
            type: "select",
            name: "sender",
            value: selectedValue.sender.name,
            showSearchBar: true,
            apiConfig: {
                endpoint: `${process.env.EXPO_PUBLIC_API_URL}/api/users`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                    // 'Authorization': `Bearer ${user.token}`,
                },
                credentials: 'include',
                params: {
                    language_code: language,
                    role_id: '2',
                    active_users: '1',
                    limit: '20'
                },
                searchParam: 'np', // The parameter name for search
                dataPath: 'data', // Path to the data array in response
                totalPagesPath: 'metadata.total_pages', // Path to total pages
                currentPagePath: 'metadata.page' // Path to current page
            },
            keyExtractor: (item, index) => `sender-${item.user_id || 'unknown'}-${index}`,
            onSelect: () => {
                // Enable delivery fee update when sender changes
                setShouldUpdateDeliveryFee(true);
            }
        }]
    } : { visibility: "hidden" },isBulkMode ? { visibility: "hidden" } : {
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
            onChange: (input) => setForm((form) => ({ ...form, receiverSecondPhone: convertToEnglishNumerals(input) })),
        }, {
            label: translations[language].tabs.orders.create.sections.client.fields.city,
            type: "select",
            name: "city",
            value: selectedValue.city ? selectedValue.city.name : form.receiverCity,
            list: citiesState.data.length > 0 ? citiesState.data : cities.slice(2),
            showSearchBar: true,
            loading: citiesState.loading,
            searchLoading: citiesState.searchLoading,
            loadMoreData: loadMoreCities,
            loadingMore: citiesState.loading && citiesState.page > 1,
            prickerSearchValue: citiesState.searchTerm,
            setPickerSearchValue: (searchTerm) => {
                setCitiesState(prev => ({ ...prev, searchTerm }));
            },
            onSearchClear: () => {
                resetCitiesSearch();
            },
            error: citiesState.error,
            onRetry: () => {
                setCitiesState(prev => ({ ...prev, error: null }));
                fetchCities(1, citiesState.searchTerm, false);
            },
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
            (selectedValue.paymentType?.value || form.paymentTypeId) === "check" ||
            (orderId && !selectedValue.paymentType?.value && !form.paymentTypeId)
            ? [
                // Only show COD amount fields and Add Currency button for cash or cash/check
                ...((selectedValue.paymentType?.value || form.paymentTypeId) === "cash" ||
                (selectedValue.paymentType?.value || form.paymentTypeId) === "cash/check" ||
                (orderId && !selectedValue.paymentType?.value && !form.paymentTypeId)
                ? [
                    ...codAmounts.map((item, index) => ({
                        label: selectedValue.orderType?.value !== "payment" 
                            ? selectedValue.orderType?.value === "receive" ? 
                            translations[language].tabs.orders.create.sections.cost.fields.packageCost
                            :translations[language].tabs.orders.create.sections.cost.fields.totalPackageCost
                            : `${translations[language].tabs.orders.create.sections.cost.fields.amount}`,
                        type: "currencyInput",
                        name: "cod_value",
                        value: item.value,
                        currency: item.currency,
                        index: index,
                        error: index === 0 ? fieldErrors.cod_value : null,
                        onChange: (value) => {
                            const newAmounts = [...codAmounts];
                            let processedValue = convertToEnglishNumerals(value);
                            
                            // For payment type orders, ensure the value has a minus sign
                            if (selectedValue.orderType?.value === "payment") {
                                // Remove any existing minus signs first to avoid double negatives
                                processedValue = processedValue.replace(/^-+/, '');
                                // Add minus sign if the value is not empty and not zero
                                if (processedValue && processedValue !== '0' && processedValue !== '0.00') {
                                    processedValue = '-' + processedValue;
                                }
                            }
                            
                            newAmounts[index].value = processedValue;
                            setCodAmounts(newAmounts);
                        }
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
                    const convertedInput = convertToEnglishNumerals(input);
                    setShouldUpdateDeliveryFee(false);
                    setDeliveryFee(convertedInput);
                    setForm(prevForm => ({
                        ...prevForm,
                        deliveryFee: convertedInput
                    }));
                },
                keyboardType: "numeric"
            },
            {
            label: translations[language].tabs.orders.create.sections.cost.fields.netValue || "Net Value",
            type: "input",
            name: "net_value",
            value: (() => {
                // Get COD values (only ILS matters now)
                let ilsCodTotal = 0;
                codAmounts.forEach(cod => {
                    const value = parseFloat(cod.value || 0);
                    const currency = cod.currency || "ILS";
                    if (currency === "ILS" && !isNaN(value)) {
                        ilsCodTotal += value;
                    }
                });

                // Get delivery fee, commission, and discount (all in ILS only)
                const deliveryFeeValue = parseFloat(deliveryFee || form.delivery_fee || 0);
                const commissionValue = parseFloat(form.commission || 0);
                const discountValue = parseFloat(form.discount || 0);

                // Calculate ILS fees
                const ilsFees = deliveryFeeValue + commissionValue - discountValue;

                // Final net value in ILS
                const ilsNetValue = ilsCodTotal - ilsFees;

                // Return only ILS result
                return `ILS: ${ilsNetValue.toFixed(2)}`;
            })(),
            readOnly: true,
            editable: false,
            style: { fontWeight: "bold", color: "#2e7d32", backgroundColor: "rgba(46, 125, 50, 0.05)" }
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
            label: translations[language].tabs.orders.create.sections.details.fields.packageItems,
            type: "packageItems",
            name: "package_items",
            value: Array.isArray(form.packageItems) ? form.packageItems : [],
            addLabel: translations[language]?.tabs?.orders?.create?.sections?.details?.fields?.addPackageItem,
            emptyLabel: translations[language]?.tabs?.orders?.create?.sections?.details?.fields?.emptyPackageItems,
            placeholder: translations[language]?.tabs?.orders?.create?.sections?.details?.fields?.packageQrPlaceholder,
            onAdd: handleAddPackageItem,
            onRemove: handleRemovePackageItem,
            onChange: handlePackageItemChange,
            onScan: handlePackageItemScan
        }, {
            label: translations[language].tabs.orders.create.sections.details.fields.weight,
            type: "input",
            name: "order_weight",
            value: form.orderWeight || "",
            onChange: (input) => setForm((form) => ({ ...form, orderWeight: convertToEnglishNumerals(input) }))
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
            onChange: (input) => setForm((form) => ({ ...form, receivedQuantity: convertToEnglishNumerals(input) }))
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
    const renderSections = (isBulkMode
        ? sections.filter(section => section && section.label && (section.label === bulkTitle || section.label === senderLabel))
        : sections.slice(1)
    ).filter(Boolean);

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
            .filter(item => item.value !== '' && item.value !== null && item.value !== undefined)
            .map(item => ({
                value: parseFloat(item.value) || 0,
                currency: item.currency || 'ILS'
            }));

        // Require COD value: must be provided and greater than 0
        const isPaymentOrder = selectedValue.orderType?.value === 'payment';
        if (codValues.length === 0 || (!isPaymentOrder && totalCodValue < 0)) {
            const requiredMsg = translations[language].tabs.orders.validation.required;
            setFieldErrors(prev => ({ ...prev, cod_value: requiredMsg }));
            setFormSpinner({ status: false });
            setError({ status: true, msg: translations[language].tabs.orders.create.errorValidationMsg });
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || 'Validation Error',
                message: translations[language].tabs.orders.create.errorValidationMsg || 'Please check the form for errors'
            });
            return;
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
            
            const rawPackageItems = Array.isArray(form.packageItems) ? form.packageItems : [];
            const normalizedPackageItems = rawPackageItems
                .map(item => (item === null || item === undefined ? "" : String(item).trim()))
                .filter(item => item.length > 0);
            const packageQuantity = normalizedPackageItems.length + 1;

            // Create the request body based on the method
            const requestBody = {
                qr_id: form.qrId,
                delivery_fee: parseFloat(deliveryFee) || parseFloat(form.deliveryFee) || 0,
                commission: commission[0].value,
                discount: discount[0].value,
                sender_id: user.role === "business" ? user.userId : selectedValue.sender.user_id,
                business_branch_id: selectedValue.sender.branch_id || user.branch_id,
                title: form.orderItems,
                quantity: packageQuantity,
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
                checks: formattedChecks,
                follow_up_qr_ids: normalizedPackageItems
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
                    let fieldKey = error.field;
                    const msg = error.message || '';
                    // Disambiguate nested fields when backend returns only the key name
                    if (fieldKey === 'value') {
                        if (msg.includes('cod_values')) {
                            fieldKey = 'cod_value';
                        } else if (msg.includes('checks')) {
                            fieldKey = 'checks';
                        }
                    }
                    const fieldName = mapServerFieldToFormField(fieldKey);
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

    const buildFormattedChecks = () => {
        if (!["check", "cash/check"].includes(selectedValue.paymentType.value) || !checks || checks.length === 0) {
            return [];
        }
        return checks.map(check => ({
            number: check.number || '',
            date: check.date || new Date().toISOString().split('T')[0],
            value: parseFloat(check.value || 0),
            currency: check.currency || 'ILS'
        }));
    };

    const handleAnalyzeBulkText = async () => {
        if (!bulkText || !bulkText.trim()) {
            const requiredMsg = translations[language].tabs.orders.validation.required;
            setFieldErrors(prev => ({ ...prev, bulk_text: requiredMsg }));
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: translations[language].tabs.orders.create.errorValidationMsg || "Please check the form for errors"
            });
            return;
        }
        setFieldErrors(prev => ({ ...prev, bulk_text: null }));
        setBulkLoading(true);
        setBulkResult(null);
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/bulk-parse`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': language,
                },
                body: JSON.stringify({
                    text: bulkText,
                    default_currency: selectedValue.currency?.value || "ILS"
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || translations[language].tabs.orders.create.error || "Error");
            }
            setBulkResult(data.data);
        } catch (err) {
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: err.message || translations[language].tabs.orders.create.error || "An unexpected error occurred"
            });
        } finally {
            setBulkLoading(false);
        }
    };

    const handleCreateBulkOrders = async () => {
        if (!bulkText || !bulkText.trim()) {
            const requiredMsg = translations[language].tabs.orders.validation.required;
            setFieldErrors(prev => ({ ...prev, bulk_text: requiredMsg }));
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: translations[language].tabs.orders.create.errorValidationMsg || "Please check the form for errors"
            });
            return;
        }
        setFieldErrors(prev => ({ ...prev, bulk_text: null }));
        if (user.role !== "business" && !selectedValue.sender?.user_id) {
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: translations[language].tabs.orders.create.sections?.sender?.fields?.sender || "Sender"
            });
            return;
        }
        if (["check", "cash/check"].includes(selectedValue.paymentType.value) && buildFormattedChecks().length === 0) {
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: translations[language].tabs.orders.create.sections?.paymentType?.checkRequired || "Checks are required"
            });
            return;
        }
        const items = Array.isArray(bulkResult?.items) ? bulkResult.items : [];
        if (items.length === 0) {
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: translations[language].tabs.orders.create.errorValidationMsg || "Please check the form for errors"
            });
            return;
        }
        setBulkCreateLoading(true);
        setBulkJobId(null);
        const validItems = items.filter(item => item.status === 'ok');
        const invalidItems = items.filter(item => item.status !== 'ok');
        try {
            const createSingle = async (item) => {
                const needsReceivedInfo = item.order_type === "receive" || item.order_type === "delivery/receive";
                const receivedItemsValue = needsReceivedInfo
                    ? (item.received_items || form.receivedItems || "-")
                    : form.receivedItems;
                const receivedQuantityValue = needsReceivedInfo
                    ? (Number.isFinite(Number(item.received_quantity)) ? Number(item.received_quantity) : (Number.isFinite(Number(form.receivedQuantity)) ? Number(form.receivedQuantity) : 1))
                    : form.receivedQuantity;
                const noteSegments = [
                    form.noteContent,
                    ...(Array.isArray(item.notes) ? item.notes : []),
                    ...(Array.isArray(item.cod_notes) ? item.cod_notes : [])
                ]
                    .map(part => typeof part === 'string' ? part.trim() : part)
                    .filter(Boolean);
                const noteText = noteSegments.length > 0 ? Array.from(new Set(noteSegments)).join(' | ') : '';
                const requestBody = {
                    sender_id: user.role === "business" ? user.userId : selectedValue.sender.user_id,
                    business_branch_id: selectedValue.sender?.branch_id || user.branch_id,
                    order_type: item.order_type || "delivery",
                    payment_type: selectedValue.paymentType.value,
                    delivery_fee: parseFloat(deliveryFee) || parseFloat(form.deliveryFee) || 0,
                    commission: 0,
                    discount: 0,
                    cod_values: [{
                        value: Number.isFinite(Number(item.cod_value)) ? Number(item.cod_value) : 0,
                        currency: item.cod_currency || selectedValue.currency.value
                    }],
                    type: selectedValue.itemsType.value,
                    weight: form.orderWeight,
                    received_items: receivedItemsValue,
                    received_quantity: receivedQuantityValue,
                    from_business_balance: form.fromBusinessBalance || false,
                    with_money_receive: form.withMoneyReceive || false,
                    exceed_balance_limit: exceedBusinessBalance || false,
                    note: noteText,
                    checks: buildFormattedChecks(),
                    receiver_name: item.receiver_name,
                    receiver_mobile: item.receiver_mobile,
                    receiver_city: item.receiver_city_id,
                    receiver_address: item.receiver_address || "",
                    receiver_country: "palestine"
                };
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        'Accept-Language': language,
                    },
                    body: JSON.stringify(requestBody)
                });
                const data = await res.json();
                if (!res.ok) {
                    return { row: item.row, status: 'failed', reason: data.message || data.details || 'error' };
                }
                return { row: item.row, status: 'success', order_id: data?.data?.order_id || null };
            };

            const results = [];
            const batchSize = 4;
            for (let i = 0; i < validItems.length; i += batchSize) {
                const batch = validItems.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(item => createSingle(item)));
                results.push(...batchResults);
            }
            invalidItems.forEach(item => {
                results.push({ row: item.row, status: 'failed', reason: item.missing_fields });
            });
            const successCount = results.filter(r => r.status === 'success').length;
            const failedCount = results.filter(r => r.status !== 'success').length;
            setShowAlert({
                visible: true,
                type: 'success',
                title: translations[language].tabs.orders.create.success,
                message: `${successCount} ${language === "ar" ? "تم إنشاؤها" : language === "he" ? "נוצרו" : "created"}${failedCount ? `, ${failedCount} ${language === "ar" ? "فشلت" : language === "he" ? "נכשלו" : "failed"}` : ""}`,
                onClose: () => router.push("/(tabs)")
            });
        } catch (err) {
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || "Error",
                message: err.message || translations[language].tabs.orders.create.error || "An unexpected error occurred"
            });
        } finally {
            setBulkCreateLoading(false);
        }
    };

    useEffect(() => {
        if (!bulkJobId) return;
        let isActive = true;
        const pollStatus = async () => {
            try {
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/bulk-create/status/${bulkJobId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        'Accept-Language': language,
                    }
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || translations[language].tabs.orders.create.error || "Error");
                }
                if (!isActive) return;
                const status = data?.data?.status;
                if (status === 'done') {
                    setBulkCreateLoading(false);
                    setBulkJobId(null);
                    const successCount = data?.data?.success || 0;
                    const failedCount = data?.data?.failed || 0;
                    const message = `${successCount} ${language === "ar" ? "تم إنشاؤها" : language === "he" ? "נוצרו" : "created"}${failedCount ? `, ${failedCount} ${language === "ar" ? "فشلت" : language === "he" ? "נכשלו" : "failed"}` : ""}`;
                    setShowAlert({
                        visible: true,
                        type: 'success',
                        title: translations[language].tabs.orders.create.success,
                        message,
                        onClose: () => router.push("/(tabs)")
                    });
                }
            } catch (err) {
                if (!isActive) return;
                setBulkCreateLoading(false);
                setBulkJobId(null);
                setShowAlert({
                    visible: true,
                    type: 'error',
                    title: translations[language].tabs.orders.create.error || "Error",
                    message: err.message || translations[language].tabs.orders.create.error || "An unexpected error occurred"
                });
            }
        };
        pollStatus();
        const intervalId = setInterval(pollStatus, 2500);
        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [bulkJobId, language]);

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
            'qr_id': 'qr_id',
            'delivery_fee': 'delivery_fee',
            'commission': 'commission',
            'discount': 'discount',
            'sender_id': 'sender',
            'business_branch_id': 'business_branch_id',
            'current_branch_id': 'current_branch',
            'title': 'order_items',
            'quantity': 'package_items',
            'follow_up_qr_ids': 'package_items',
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
            const parsedPackageItems = normalizePackageItems(orderData.package_items)
                .slice()
                .sort((a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0))
                .map(item => item?.qr_id || "");
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
                packageItems: parsedPackageItems,
                orderWeight: orderData.order_weight?.toString() || 0,
                receivedItems: orderData.received_items || "",
                receivedQuantity: orderData.received_quantity || 0,
                noteContent: orderData.note_content || "",
                fromBusinessBalance: orderData.from_business_balance ? true : false,
                withMoneyReceive: orderData.with_money_receive ? true : false,
                originalFromBusinessBalance: orderData.from_business_balance ? true : false,
                balanceDeduction: orderData.balance_deduction || null,
                originalBalanceDeduction: orderData.balance_deduction || null,
                qrId: orderData.qr_id,
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

    const fetchSenders = async (page = 1, searchTerm = '', loadMore = false) => {

        // Enhanced duplicate call prevention
        if (senders.loading || (loadMore && loadingMore)) {
            return;
        }

        // Prevent duplicate calls for the same page and search term
        if (!loadMore && page === senders.currentPage && searchTerm === senders.searchTerm && senders.data?.length > 0) {
            return;
        }

        try {
            // Set loading state
            if (!loadMore) {
                setSenders(prev => ({
                    ...prev,
                    loading: true,
                    error: null
                }));
            } else {
                setLoadingMore(true);
            }

            // Build query parameters
            const params = new URLSearchParams({
                language_code: language,
                role_id: '2', // Business users
                active_users: '1',
                active_status: '1',
                page: page.toString(),
                limit: '20',
            });
            
            if (searchTerm && searchTerm.trim()) {
                params.append('np', searchTerm.trim());
            }

            const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/users?${params}`;

            const headers = {
                'Accept': 'application/json',
                "Content-Type": "application/json",
            };

            if (user?.token) {
                headers.Authorization = `Bearer ${user.token}`;
            }

            const res = await fetch(apiUrl, {
                method: "GET",
                credentials: "include",
                headers
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const responseText = await res.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error(`Invalid JSON response from server. Expected JSON but got: ${responseText.substring(0, 100)}...`);
            }

            // Determine pagination info
            const hasNextPage = data.pagination ? data.pagination.has_next_page : 
                               (data.metadata ? data.metadata.page < data.metadata.total_pages : false);
            const currentPageFromResponse = data.pagination ? data.pagination.current_page : 
                                          (data.metadata ? data.metadata.page : page);

            // Update senders state
            setSenders(prev => {
                const newData = loadMore ? [...(prev.data || []), ...(data.data || [])] : (data.data || []);

                return {
                    data: newData,
                    metadata: data.metadata || {},
                    loading: false,
                    error: null,
                    hasMore: hasNextPage,
                    currentPage: currentPageFromResponse,
                    searchTerm: searchTerm || ''
                };
            });

        } catch (err) {
            console.error("❌ Error fetching senders:", err);
            setSenders(prev => ({
                ...prev,
                loading: false,
                error: err.message || 'Failed to fetch senders'
            }));
        } finally {
            if (loadMore) {
                setLoadingMore(false);
            }
        }
    }

    // Enhanced fetchCities with pagination and search
    const fetchCities = async (page = 1, searchTerm = '', loadMore = false) => {
        try {
            // Create cache key
            const cacheKey = `${searchTerm || 'all'}_page_${page}`;
            
            // Check cache first
            if (citiesCache.has(cacheKey)) {
                const cachedData = citiesCache.get(cacheKey);
                setCitiesState(prev => ({
                    ...prev,
                    data: loadMore ? [...prev.data, ...cachedData.data] : cachedData.data,
                    loading: false,
                    searchLoading: false,
                    hasMore: cachedData.hasMore,
                    page: cachedData.page,
                    totalRecords: cachedData.totalRecords,
                    error: null
                }));
                
                // Also update legacy cities state for backward compatibility
                if (!loadMore) {
                    setCities(cachedData.data);
                } else {
                    setCities(prev => [...prev, ...cachedData.data]);
                }
                return;
            }
            
            // Set loading state
            setCitiesState(prev => ({
                ...prev,
                loading: !loadMore,
                searchLoading: !!searchTerm,
                error: null
            }));

            // Build query parameters
            const params = new URLSearchParams({
                language_code: language,
                page: page.toString(),
                limit: '20',
                all: 'false' // Use pagination instead of loading all
            });

            // Add search parameter if provided
            if (searchTerm.trim()) {
                params.append('name', searchTerm.trim());
            }

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/addresses/cities?${params}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            
            // Cache the fetched data
            const cacheData = {
                data: data.data,
                hasMore: data.pagination ? data.pagination.has_next_page : false,
                page: data.pagination ? data.pagination.current_page : 1,
                totalRecords: data.metadata ? data.metadata.total_records : data.data.length
            };
            
            setCitiesCache(prev => {
                const newCache = new Map(prev);
                newCache.set(cacheKey, cacheData);
                
                // Limit cache size to prevent memory issues (keep last 50 entries)
                if (newCache.size > 50) {
                    const firstKey = newCache.keys().next().value;
                    newCache.delete(firstKey);
                }
                
                return newCache;
            });
            
            // Update cities state with pagination support
            setCitiesState(prev => ({
                ...prev,
                data: loadMore ? [...prev.data, ...data.data] : data.data,
                loading: false,
                searchLoading: false,
                hasMore: data.pagination ? data.pagination.has_next_page : false,
                page: data.pagination ? data.pagination.current_page : 1,
                totalRecords: data.metadata ? data.metadata.total_records : data.data.length,
                error: null
            }));

            // Also update the legacy cities state for backward compatibility
            if (!loadMore) {
                setCities(data.data);
            } else {
                setCities(prev => [...prev, ...data.data]);
            }

        } catch (err) {
            console.error('Error fetching cities:', err);
            setCitiesState(prev => ({
                ...prev,
                loading: false,
                searchLoading: false,
                error: err.message || 'Failed to load cities'
            }));
        }
    };

    // Function to load more cities (for infinite scroll)
    const loadMoreCities = async () => {
        if (citiesState.loading || !citiesState.hasMore) return;
        
        await fetchCities(citiesState.page + 1, debouncedSearchTerm, true);
    };

    // Function to search cities
    const searchCities = (searchTerm) => {
        setCitiesState(prev => ({
            ...prev,
            searchTerm,
            page: 1,
            data: [],
            hasMore: true
        }));
    };

    // Function to reset cities search
    const resetCitiesSearch = () => {
        setCitiesState(prev => ({
            ...prev,
            searchTerm: '',
            page: 1,
            data: [],
            hasMore: true
        }));
        setDebouncedSearchTerm('');
        // Reload initial cities
        fetchCities(1, '', false);
    };

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
    
    // Update the useEffect hooks for delivery fee
    useEffect(() => {
        if (orderId) {
            fetchOrderData();
        }
    }, [orderId]);
    
    // Initial cities fetch
    useEffect(() => {
        fetchCities(1, '', false);
    }, [language]);

    // Initial senders fetch
    useEffect(() => {
        if (user.role !== "business") {
            fetchSenders(1, '', false);
        }
    }, [language, user.role]);

    // Effect to handle search when debounced search term changes
    useEffect(() => {
        // Reset and fetch with search term
        fetchCities(1, debouncedSearchTerm, false);
    }, [debouncedSearchTerm]);

    // Direct search approach - no complex useEffect needed
    // Search is triggered directly from setPickerSearchValue
    
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
    
    const applyScannedValue = (scannedValue) => {
        if (!scannedValue) return;
        const target = global?.scanTargetField;
        if (target && target.startsWith('package_item_')) {
            const index = parseInt(target.replace('package_item_', ''), 10);
            if (!Number.isNaN(index)) {
                setForm(prevForm => {
                    const list = Array.isArray(prevForm.packageItems) ? [...prevForm.packageItems] : [];
                    while (list.length <= index) list.push("");
                    list[index] = scannedValue;
                    return { ...prevForm, packageItems: list };
                });
            }
        } else {
            setForm(prevForm => ({
                ...prevForm,
                qrId: scannedValue
            }));
        }
        if (global) {
            global.scannedReferenceId = null;
            global.scanTargetField = null;
        }
    };

    useEffect(() => {
        // Check if we have a scanned reference ID from the camera
        const checkScannedData = () => {
            if (global.scannedReferenceId) {
                const scannedValue = global.scannedReferenceId;
                
                if (scannedValue) {
                    applyScannedValue(scannedValue);
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
                applyScannedValue(scannedValue);
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
    
    // Add keyboard event listeners to handle keyboard appearance
    useEffect(() => {
        // Track currently focused input position
        let currentlyFocusedInput = null;
        
        // Create listeners for keyboard show/hide events
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                // When keyboard appears, scroll to the active input
                if (scrollViewRef.current && currentlyFocusedInput) {
                    // Get keyboard height
                    const keyboardHeight = e.endCoordinates.height;
                    
                    // Add a slight delay to ensure the input is properly focused
                    setTimeout(() => {
                        // Calculate position to scroll to (with extra padding)
                        const scrollToPosition = currentlyFocusedInput - (keyboardHeight / 2);
                        
                        // Scroll to the position
                        scrollViewRef.current.scrollTo({ 
                            y: Math.max(0, scrollToPosition), 
                            animated: true 
                        });
                    }, 150);
                }
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                // Reset the focused input position
                currentlyFocusedInput = null;
            }
        );
        
        // Listen for text input focus events
        const handleTextInputFocus = (e) => {
            if (e.target) {
                // Measure the position of the focused input
                e.target.measure((x, y, width, height, pageX, pageY) => {
                    currentlyFocusedInput = pageY;
                });
            }
        };
        
        // Set up a listener for text input focus events
        if (Platform.OS === 'ios') {
            // For iOS, we can use the notification center
            const textInputFocusListener = Keyboard.addListener('keyboardWillShow', handleTextInputFocus);
            
            return () => {
                keyboardDidShowListener.remove();
                keyboardDidHideListener.remove();
                textInputFocusListener.remove();
            };
        } else {
            // For Android, we just clean up the keyboard listeners
            return () => {
                keyboardDidShowListener.remove();
                keyboardDidHideListener.remove();
            };
        }
    }, []);
    
    useFocusEffect(
        useCallback(() => {
            // Check if we have a scanned reference ID when the screen is focused
            if (global && global.scannedReferenceId) {
                applyScannedValue(global.scannedReferenceId);
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

    // Removed duplicate useEffect - senders fetching is now handled by the consolidated useEffect above
    
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
            
            <KeyboardAvoidingView 
                style={[styles.pageContainer, { backgroundColor: colors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
                enabled
            >
                {!isBulkMode && (
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
                )}
                <ScrollView 
                    ref={scrollViewRef}
                    style={[styles.container]}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={true}
                >
                    <View style={styles.main}>
                    {renderSections.map((section, index) => (
                        <Section
                            key={index}
                            section={section}
                            setSelectedValue={setSelectedValue}
                            prickerSearchValue={prickerSearchValue}
                            setPickerSearchValue={setPickerSearchValue}
                            fieldErrors={fieldErrors}
                            setFieldErrors={setFieldErrors}
                        />
                    ))}
                    
                    {/* Submit Button moved inside ScrollView */}
                    <View style={styles.submitButtonContainer}>
                        <TouchableOpacity 
                            style={[styles.submitButton, {
                                marginHorizontal: 40,
                                marginVertical: Platform.OS === 'ios' ? 20 : 10,
                            }]}
                            onPress={() => isBulkMode 
                                ? handleCreateBulkOrders()
                                : orderId 
                                    ? handleCreateOrder(`/api/orders/${orderId}`, "PUT") 
                                    : handleCreateOrder('/api/orders', "POST")
                            }
                            disabled={isBulkMode ? bulkCreateLoading : formSpinner.status}
                            activeOpacity={0.8}
                        >
                            {(isBulkMode ? bulkCreateLoading : formSpinner.status) ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={[styles.submitButtonText]}>
                                    {isBulkMode 
                                        ? bulkSubmitLabel
                                        : isDuplicate === 'true' 
                                            ? (translations[language].tabs.orders.order.resend || "Re send")
                                            : translations[language].tabs.orders.create.submit
                                        }
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    </View>
                </ScrollView>
            
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
    
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    submitButtonContainer: {
        width: '100%',
        paddingBottom: Platform.OS === 'ios' ? 10 : 0,
        backgroundColor: 'transparent',
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
        paddingBottom: 40,
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
