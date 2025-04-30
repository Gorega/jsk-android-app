import { View, StyleSheet, ScrollView, Text, Alert, ActivityIndicator, Keyboard, TouchableOpacity, I18nManager } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState, useRef } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../_layout";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../../components/ModalPresentation";
import { getToken } from "../../utils/secureStore";

// Helper functions for RTL
const getTextAlign = (isRTL) => isRTL ? 'right' : 'left';
const getFlexDirection = (isRTL) => isRTL ? 'row-reverse' : 'row';
const getMargin = (isRTL, size = 15) => isRTL ? { marginRight: 0, marginLeft: size } : { marginLeft: 0, marginRight: size };

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
        name: translations[language].tabs.orders.create.sections.itemsContentTypeList.normal,
        value: "normal"
    }, {
        name: translations[language].tabs.orders.create.sections.itemsContentTypeList.large,
        value: "large"
    }, {
        name: translations[language].tabs.orders.create.sections.itemsContentTypeList.extra_large,
        value: "extra_large"
    }, {
        name: translations[language].tabs.orders.create.sections.itemsContentTypeList.fragile,
        value: "fragile"
    }, {
        name: translations[language].tabs.orders.create.sections.itemsContentTypeList.high_value,
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

    const sections = [user.role !== "business" ? {
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
    } : { visibility: "hidden" }, {
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
            onBlur: () => handleCheckPhone(form.receiverFirstPhone),
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
        }, {
            label: translations[language].tabs.orders.create.sections.client.fields.area,
            type: "input",
            name: "receiver_area",
            value: form.receiverArea || "",
            onChange: (input) => setForm((form) => ({ ...form, receiverArea: input }))
        }, {
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
                    label: index === 0 
                        ? translations[language].tabs.orders.create.sections.cost.fields.packageCost
                        : `${translations[language].tabs.orders.create.sections.cost.fields.packageCost}`,
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
        }, ["business", "admin", "manager"].includes(user.role) ? {
            label: ["admin", "manager"].includes(user.role) ? translations[language].tabs.orders.create.sections.sender.fields.sender_deduct : translations[language].tabs.orders.create.sections.sender.fields.my_balance_deduct,
            type: "toggle",
            name: "from_business_balance",
            value: form.fromBusinessBalance || false,
            onChange: async (value) => {
                if (value) {
                    try {
                        const balance = user.total_amount;
                        const totalCost = parseFloat(form.codValue) + parseFloat(deliveryFee);

                        if (balance < totalCost) {
                            Alert.alert(
                                translations[language].tabs.orders.create.sections.cost.fields.insufficient_balance,
                                `${translations[language].tabs.orders.create.sections.cost.fields.balance} (${balance}) ${translations[language].tabs.orders.create.sections.cost.fields.insufficient_balance_alert}`
                            );
                            return;
                        }

                        if (!form.receiverFirstPhone || !deliveryFee || !form.codValue) {
                            Alert.alert(
                                translations[language].tabs.orders.create.sections.cost.fields.missing_fields,
                                translations[language].tabs.orders.create.sections.cost.fields.fields_required
                            );
                            return;
                        }

                        setForm((form) => ({ ...form, fromBusinessBalance: value }));
                    } catch (error) {
                        Alert.alert(
                            "Error",
                            "Failed to verify balance. Please try again."
                        );
                    }
                } else {
                    setForm((form) => ({ ...form, fromBusinessBalance: value }));
                }
            }
        } : { visibility: "hidden" }]
    }, {
        label: translations[language].tabs.orders.create.sections.details.title,
        icon: <Feather name="box" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.orderTypes.title,
            type: "select",
            name: "orderType",
            value: selectedValue.orderType.name,
            list: orderTypes
        }, (selectedValue.orderType?.value || form.orderTypeId) === "receive" ||
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
            label: translations[language].tabs.orders.create.sections.details.fields.product,
            type: "input",
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
        }, {
            label: translations[language].tabs.orders.create.sections.itemsCotnentType.title,
            type: "select",
            name: "itemsType",
            list: itemsContentTypeList,
            value: form.itemsType || selectedValue.itemsType.name,
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

    const handleCheckPhone = async (phone) => {
        if (!phone) return;

        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/receivers/check-phone/${encodeURIComponent(phone)}?language_code=${language}`
            );

            // First check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Unexpected response: ${text.substring(0, 100)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Phone check failed');
            }

            if (data.exists) {
                // Auto-fill logic
                setForm(prev => ({
                    ...prev,
                    receiverName: data.receiver.name,
                    receiverSecondPhone: data.receiver.phone_2 || "",
                    receiverArea: data.receiver.area,
                    receiverAddress: data.receiver.address,
                }));

                // Find and set city
                const city = cities.find(c => c.city_id === data.receiver.city_id);
                if (city) {
                    setSelectedValue(prev => ({
                        ...prev,
                        city: { name: city.name, city_id: city.city_id }
                    }));
                }

                // Show warning if returned orders
                setReturnedOrdersMessage(
                    data.comment
                );
            }
        } catch (error) {
            Alert.alert(
                'Error',
                error.message || 'Failed to check phone number'
            );
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
                    current_branch_id: null,
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
                    receiver_area: form.receiverArea,
                    receiver_address: form.receiverAddress,
                    from_business_balance: form.fromBusinessBalance || false,
                    exceed_balance_limit: false, // Default value for exceed_balance_limit
                    note: form.noteContent,
                    checks: formattedChecks
                })
            });

            const data = await res.json();
            console.log(data)         

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
                try {
                    Alert.alert(
                        translations[language].tabs.orders.create.sections.sender.fields.balance_deduction_success || "Balance Deduction Success",
                        translations[language].tabs.orders.create.sections.sender.fields.balance_deduction_processed || "Balance has been deducted successfully",
                        [{ text: "OK" }]
                    );
                } catch (error) {
                    Alert.alert(
                        translations[language].tabs.orders.create.sections.sender.fields.balance_deduction_error || "Balance Deduction Error",
                        error.message || translations[language].tabs.orders.create.sections.sender.fields.balance_deduction_failed || "Failed to process balance deduction",
                        [{ text: "OK" }]
                    );
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
            'receiver_area': 'receiver_area',
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
                receiverArea: orderData.receiver_area,
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
                referenceId: orderData.reference_id || null
            });
            
            // Set checks
            if (orderData.checks && Array.isArray(orderData.checks) && orderData.checks.length > 0) {
                setChecks(orderData.checks);
            } else {
                setChecks([]);
            }
        } catch (err) {
            console.error('Error fetching order data:', err);
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
            console.error('Error fetching senders:', err);
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
            console.error('Error fetching cities:', err);
        }
    }

    const fetchDeliveryFee = async () => {
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/delivery_fee?senderCityId=${selectedValue.sender.city_id || form.senderCityId || user.city_id}&receiverCityId=${selectedValue.city.city_id || form.receiverCityId}&orderType=${"normal"}&senderId=${selectedValue.sender.user_id || form.senderId || user.userId}`, {
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
            console.error('Error fetching delivery fee:', err);
        }
    }

    const loadMoreData = async () => {
        if (!loadingMore && senders?.data && senders?.data.length > 0) {
            // Check if there's more data to load
            if (senders.metadata && senders.data.length >= senders?.metadata.total_records) {
                console.log("No more data to load");
                return;
            }

            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await fetchSenders(nextPage, true);
            } catch (error) {
                console.error('Error loading more data:', error)            }
            finally {
                    setLoadingMore(false);
                }
            }
        };
    
    useEffect(() => {
        if (orderId) {
            fetchOrderData();
        }
    }, [orderId, language]);
    
    useEffect(() => {
        fetchCities();
        setPage(1);
        fetchSenders(1, false);
    }, [prickerSearchValue, language])
    
    useEffect(() => {
        fetchDeliveryFee();
    }, [selectedValue]);
    
    const CustomAlert = ({ type, title, message, onClose }) => {
        const isRTL = language === 'ar' || language === 'he';
        
        return (
            <View style={styles.alertOverlay}>
                <View style={[
                    styles.alertContainer, 
                    type === 'error' ? styles.errorAlert : 
                    type === 'success' ? styles.successAlert : 
                    styles.warningAlert
                ]}>
                    <View style={[
                        styles.alertHeader, 
                        { flexDirection: isRTL ? 'row-reverse' : 'row' }
                    ]}>
                        <Text style={[
                            styles.alertTitle, 
                            { textAlign: isRTL ? 'right' : 'left' }
                        ]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={22} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[
                        styles.alertMessage, 
                        { textAlign: isRTL ? 'right' : 'left' }
                    ]}>{message}</Text>
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
                </View>
            </View>
        );
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
});