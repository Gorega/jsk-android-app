import { View,StyleSheet, ScrollView,Button,Text, Alert, ActivityIndicator, Keyboard, TouchableOpacity } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState, useRef } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../_layout";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function HomeScreen(){
    const { language } = useLanguage();
    const [success,setSuccess] = useState(false);
    const [error,setError] = useState({});
    const [formSpinner,setFormSpinner] = useState({})
    const [fieldErrors, setFieldErrors] = useState({});
    const { orderId } = useLocalSearchParams();
    const [senders,setSenders] = useState([]);
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const {user} = useAuth()
    const [cities,setCities] = useState([]);
    const [orderTypes,setOrderTypes] = useState([{
        name:translations[language].tabs.orders.create.sections.orderTypes?.delivery,
        value:"delivery"
    },{
        name:translations[language].tabs.orders.create.sections.orderTypes?.receive,
        value:"receive"
    },{
        name:translations[language].tabs.orders.create.sections.orderTypes["delivery/receive"],
        value:"delivery/receive"
    }]);
    const [paymentTypes,setPaymentTypes] = useState([{
        name:translations[language].tabs.orders.create.sections.paymentType.cash,
        value:"cash"
    },{
        name:translations[language].tabs.orders.create.sections.paymentType.check,
        value:"check"
    },{
        name:translations[language].tabs.orders.create.sections.paymentType["cash/check"],
        value:"cash/check"
    }]);
    const [currencyList,setCurrencyList] = useState([{
        name:translations[language].tabs.orders.create.sections.currencyList.ILS,
        value:"ILS"
    },{
        name:translations[language].tabs.orders.create.sections.currencyList.USD,
        value:"USD"
    },{
        name:translations[language].tabs.orders.create.sections.currencyList.JOD,
        value:"JOD"
    }]);
    const [itemsContentTypeList,setItemsContentTypeList] = useState([{
        name:translations[language].tabs.orders.create.sections.itemsContentTypeList.normal,
        value:"normal"
    },{
        name:translations[language].tabs.orders.create.sections.itemsContentTypeList.large,
        value:"large"
    },{
        name:translations[language].tabs.orders.create.sections.itemsContentTypeList.extra_large,
        value:"extra_large"
    },{
        name:translations[language].tabs.orders.create.sections.itemsContentTypeList.fragile,
        value:"fragile"
    },{
        name:translations[language].tabs.orders.create.sections.itemsContentTypeList.high_value,
        value:"high_value"
    }]);
    const [checks, setChecks] = useState([]);
    const [prickerSearchValue,setPickerSearchValue] = useState("");
    const [deliveryFee,setDeliveryFee] = useState(0);
    const [returnedOrdersMessage, setReturnedOrdersMessage] = useState('');
    const [form,setForm] = useState({})
    const [selectedValue,setSelectedValue] = useState({
        sender:"",
        city:"",
        orderType:orderId ? "" : { name: translations[language].tabs.orders.create.sections.orderTypes?.delivery, value: "delivery" },
        paymentType: orderId ? "" : { name: translations[language].tabs.orders.create.sections.paymentType?.cash, value: "cash" },
        currency:orderId ? "" : { name: translations[language].tabs.orders.create.sections.currencyList?.ILS, value: "ILS" },
        itemsType:orderId ? "" : { name: translations[language].tabs.orders.create.sections.itemsCotnentType?.normal, value: "normal" },
    });
    const scrollViewRef = useRef(null);
    const [showAlert, setShowAlert] = useState({
        visible: false,
        type: 'error',
        title: '',
        message: '',
        onClose: null
    });
 
    const sections = [user.role !== "business" ? {
        label:translations[language].tabs.orders.create.sections.sender.title,
        icon:<SimpleLineIcons name="user-follow" size={24} color="#F8C332" />,
        fields:[{
            label:translations[language].tabs.orders.create.sections.sender.fields.sender,
            type:"select",
            name:"sender",
            value:selectedValue.sender.name,
            list:senders.data,
            showSearchBar:true
        }]
    }:{visibility:"hidden"},{
        label:translations[language].tabs.orders.create.sections.client.title,
        icon:<FontAwesome name="user-o" size={24} color="#F8C332" />,
        fields:[returnedOrdersMessage ? {
            label:translations[language].tabs.orders.create.sections.client.fields.found,
            type: "message",
            value: returnedOrdersMessage
        } : {
            label: translations[language].tabs.orders.create.sections.client.fields.firstPhone,
            type: "input",
            name:"receiver_mobile",
            value: form.receiverFirstPhone || "",
            onChange: (input) => setForm((form) => ({ ...form, receiverFirstPhone: input })),
            onBlur: () => handleCheckPhone(form.receiverFirstPhone),
        },{visibility:"hidden"},{
            name:"receiver_name",
            label:translations[language].tabs.orders.create.sections.client.fields.name,
            type:"input",
            value:form.receiverName || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverName:input})),
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.secondPhone,
            type:"input",
            name:"receiver_second_mobile",
            value:form.receiverSecondPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverSecondPhone:input}))
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.city,
            type:"select",
            name:"city",
            value:selectedValue.city ? selectedValue.city.name : form.receiverCity,
            list:cities
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.area,
            type:"input",
            name:"receiver_area",
            value:form.receiverArea || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverArea:input}))
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.address,
            type:"input",
            name:"receiver_address",
            value:form.receiverAddress || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverAddress:input}))
        }]
    },{
        label:translations[language].tabs.orders.create.sections.cost.title,
        icon:<MaterialIcons name="attach-money" size={24} color="#F8C332" />,
        fields:[{
            label:translations[language].tabs.orders.create.sections.paymentType.title,
            type:"select",
            name:"paymentType",
            defaultValue:"cash",
            value:selectedValue.paymentType.name,
            list:paymentTypes
        },
        (selectedValue.paymentType?.value || form.paymentTypeId) === "cash" ||
        (selectedValue.paymentType?.value || form.paymentTypeId) === "cash/check" ? {
          label:translations[language].tabs.orders.create.sections.cost.fields.packageCost,
          type:"input",
          name:"cod_value",
          value:form.codValue || "",
          onChange:(input)=> setForm((form)=> ({...form,codValue:input}))
      } : {visibility:"hidden"},...((selectedValue.paymentType?.value || form.paymentTypeId) === "check" ||
        (selectedValue.paymentType?.value || form.paymentTypeId) === "cash/check" 
          ? [
              {
                value: translations[language].tabs.orders.create.sections.checks.add,
                type: "button",
                onPress: () => {
                  setChecks(prev => [
                    ...prev,
                    { number: "", date: "", value: "", currency: "ILS" }
                  ]);
                }
              },
              ...checks.map((check, index) => [
                {
                  label: `${translations[language].tabs.orders.create.sections.checks.check} #${index + 1} - ${translations[language].tabs.orders.create.sections.checks.number}`,
                  type: "input",
                  value: check.number || "",
                  onChange: (input) => {
                    setChecks(prev =>
                      prev.map((c, i) =>
                        i === index ? { ...c, number: input } : c
                      )
                    );
                  }
                },
                {
                  label: `${translations[language].tabs.orders.create.sections.checks.check} #${index + 1} - ${translations[language].tabs.orders.create.sections.checks.value}`,
                  type: "input",
                  value: check.value || "",
                  onChange: (input) => {
                    setChecks(prev =>
                      prev.map((c, i) =>
                        i === index ? { ...c, value: input } : c
                      )
                    );
                  }
                },
                {
                  label: `${translations[language].tabs.orders.create.sections.checks.check} #${index + 1} - ${translations[language].tabs.orders.create.sections.checks.currency}`,
                  type: "select",
                  name: `checkCurrency_${index}`,
                  value: check.currency,
                  list: currencyList,
                  onSelect: (value) => {
                    setChecks(prev =>
                      prev.map((c, i) =>
                        i === index ? { ...c, currency: value } : c
                      )
                    );
                  }
                },
                {
                  label: `${translations[language].tabs.orders.create.sections.checks.check} #${index + 1} - ${translations[language].tabs.orders.create.sections.checks.date}`,
                  type: "date",
                  value: check.date || "",
                  onChange: (date) => {
                    setChecks(prev =>
                      prev.map((c, i) =>
                        i === index ? { ...c, date } : c
                      )
                    );
                  }
                },
                {
                  value: "x",
                  type: "button",
                  style: { backgroundColor: "red" },
                  onPress: () => {
                    setChecks(prev => prev.filter((_, i) => i !== index));
                  }
                }
              ])
            ]
          : []),
          ,{
            label:translations[language].tabs.orders.create.sections.currencyList.title,
            type:"select",
            name:"currency",
            value:selectedValue.currency.name,
            list:currencyList
        },{
            label:translations[language].tabs.orders.create.sections.cost.fields.deliveryFee,
            type:"input",
            name:"delivery_fee",
            value: deliveryFee || form.deliveryFee,
        },["business","admin","manager"].includes(user.role) ? {
            label:["admin","manager"].includes(user.role) ? translations[language].tabs.orders.create.sections.sender.fields.sender_deduct : translations[language].tabs.orders.create.sections.sender.fields.my_balance_deduct,
            type:"toggle",
            name:"from_business_balance",
            value:form.fromBusinessBalance || false,
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

                if(!form.receiverFirstPhone || !deliveryFee || !form.codValue){
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
    }}: {visibility:"hidden"}]
    },{
        label:translations[language].tabs.orders.create.sections.details.title,
        icon:<Feather name="package" size={24} color="#F8C332" />,
        fields:[{
            label:translations[language].tabs.orders.create.sections.orderTypes.title,
            type:"select",
            name:"orderType",
            value:selectedValue.orderType.name,
            list:orderTypes
        },(selectedValue.orderType?.value || form.orderTypeId) === "receive" ||
        (selectedValue.orderType?.value || form.orderTypeId) === "delivery/receive" ? {
            label:translations[language].tabs.orders.create.sections.orderTypes.receivedItems,
            type:"input",
            name:"received_items",
            value:form.receivedItems || "",
            onChange:(input)=> setForm((form)=> ({...form,receivedItems:input}))
        } : {visibility:"hidden"},
        (selectedValue.orderType?.value || form.orderTypeId) === "receive" ||
        (selectedValue.orderType?.value || form.orderTypeId) === "delivery/receive" ? {
            label:translations[language].tabs.orders.create.sections.orderTypes.receivedQuantity,
            type:"input",
            name:"received_quantity",
            value:form.receivedQuantity || "",
            onChange:(input)=> setForm((form)=> ({...form,receivedQuantity:input}))
        } : {visibility:"hidden"},
        {
            label:translations[language].tabs.orders.create.sections.details.fields.product,
            type:"input",
            value:form.orderItems || "",
            onChange:(input)=> setForm((form)=> ({...form,orderItems:input}))
        },{
            label:translations[language].tabs.orders.create.sections.details.fields.quantity,
            type:"input",
            name:"quantity",
            value:form.numberOfItems || "",
            onChange:(input)=> setForm((form)=> ({...form,numberOfItems:input}))
        },{
            label:translations[language].tabs.orders.create.sections.details.fields.weight,
            type:"input",
            name:"weight",
            value:form.orderWeight || "",
            onChange:(input)=> setForm((form)=> ({...form,orderWeight:input}))
        },{
            label:translations[language].tabs.orders.create.sections.itemsCotnentType.title,
            type:"select",
            name:"itemsType",
            list:itemsContentTypeList,
            value:form.itemsType || selectedValue.itemsType.name,
        }]
    },{
        label:translations[language].tabs.orders.create.sections.notes.title,
        icon:<Feather name="package" size={24} color="#F8C332" />,
        fields:[{
            label:translations[language].tabs.orders.create.sections.notes.note,
            type:"input",
            value:form.noteContent || "",
            onChange:(input)=> setForm((form)=> ({...form,noteContent:input}))
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
                    data.returnedOrdersCount > 0 
                        ? data.comment
                        : ''
                );
            }
        } catch (error) {
            Alert.alert(
                'Error',
                error.message || 'Failed to check phone number'
            );
        }
    };

    const scrollToError = (fieldName) => {
        // Find the section containing the field with error
        const sectionWithError = sections.find(section => 
            section.fields.some(field => field.name === fieldName)
        );

        if (sectionWithError && scrollViewRef.current) {
            // Get the index of the section
            const sectionIndex = sections.indexOf(sectionWithError);
            
            // Calculate approximate position (each section typically takes about 200-300 pixels)
            // Adjust this value based on your actual section heights
            const approximatePosition = sectionIndex * 250;
            
            // Scroll to position with offset to show the section header
            scrollViewRef.current.scrollTo({
                y: Math.max(0, approximatePosition - 50), // 50px offset from top
                animated: true
            });
        }
    };

    const handleCreateOrder = async (url, method) => {
        const formattedChecks = ["check", "cash/check"].includes(selectedValue.paymentType.value) && checks && checks.length > 0
        ? checks.map(check => ({
            number: check.number || '',
            date: check.date || new Date().toISOString().split('T')[0],
            value: parseFloat(check.value || 0),
            currency: check.currency || 'ILS'
        }))
        : [];
        
        function sanitizeInput(input) {
            return input === undefined ? null : input;
        }
        
        setFormSpinner({ status: true });
        setFieldErrors({});
        setSuccess(false);
        setError({ status: false, msg: "" });
        Keyboard.dismiss();

        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`, {
                method: method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': language
                },
                body: JSON.stringify({
                    reference_id: form.referenceId,
                    delivery_fee: deliveryFee ? deliveryFee : form.deliveryFee,
                    sender_id: selectedValue.sender.user_id || user.userId,
                    business_branch_id: selectedValue.sender.branch_id || user.branch_id,
                    current_branch_id: null,
                    title: form.orderItems,
                    quantity: form.numberOfItems,
                    description: form.description,
                    cod_value:["cash", "cash/check"].includes(selectedValue.paymentType.value) ? form.codValue : 0,
                    type: selectedValue.itemsType.value,
                    weight: form.orderWeight,
                    item_price: form.codValue,
                    extra_cost: form.extraCost,
                    discount: form.discount,
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
                    from_business_balance: form.fromBusinessBalance,
                    note: form.noteContent,
                    checks: formattedChecks
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setFormSpinner({ status: false });
                if (data.details) {
                // Handle validation errors
                const errors = {};
                    data.details.forEach(error => {
                    errors[error.field] = error.message;
                });
                setFieldErrors(errors);
                    
                    // Scroll to first error
                    const firstErrorField = data.details[0]?.field;
                    if (firstErrorField) {
                        scrollToError(firstErrorField);
                    }

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
            console.error('Error creating order:', err);
            
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

    const fetchOrderData = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
            const orderData = await res.json();
            setSelectedValue((selectedValue)=> (
                {...selectedValue,
                    sender:{name:orderData.sender,value:orderData.senderId},
                    city:{name:orderData.receiverCity,value:orderData.receiverCityId},
                    orderType:{ name: orderData.orderType, value: orderData.orderTypeId },
                    paymentType: { name: orderData.paymentType, value: orderData.paymentTypeId },
                    currency:{ name: orderData.currency, value: orderData.currency },
                    itemsType:{ name: orderData.itemsType, value: orderData.itemsType }
                }
            ))
            setDeliveryFee(orderData.deliveryFee)
            setForm({
                receiverName:orderData.receiverName,
                receiverFirstPhone:orderData.receiverFirstPhone,
                receiverSecondPhone:orderData.receiverSecondPhone,
                receiverCity:orderData.receiverCity,
                receiverArea:orderData.receiverArea,
                receiverAddress:orderData.receiverAddress,
                sender:orderData.sender,
                senderId:orderData.senderId,
                senderCityId:orderData.senderCityId,
                receiverCityId:orderData.receiverCityId,
                deliveryFee:orderData.deliveryFee,
                paymentTypeId:form.paymentTypeId,
                orderTypeId:form.orderTypeId,
                codValue:orderData.codValue,
                comission:orderData.comission,
                orderItems:orderData.orderItems,
                numberOfItems:orderData.numberOfItems,
                orderWeight:orderData.orderWeight,
                receivedItems: orderData.receivedItems,
                receivedQuantity: orderData.receivedQuantity,
                noteContent:orderData.noteContent
            })
            setChecks(orderData.checks)
        } catch (err) {
        }
    };

    const fetchSenders = async (pageNumber = 1, isLoadMore = false)=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?page=${pageNumber}&language_code=${language}&role_id=2&np=${prickerSearchValue}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
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

        }finally {
            setLoadingMore(false);
        }
    }

    const fetchCities = async ()=>{
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

        }
    }


    const fetchDeliveryFee = async ()=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/delivery_fee?senderCityId=${selectedValue.sender.city_id || form.senderCityId || user.city_id}&receiverCityId=${selectedValue.city.city_id || form.receiverCityId}&orderType=${"normal"}&senderId=${selectedValue.sender.user_id || form.senderId || user.userId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            setDeliveryFee(data.data)
        } catch (err) {

        }
    }

    const loadMoreData = async () => {
        if (!loadingMore && senders?.data.length > 0) {
            // Check if there's more data to load
            if (senders.data.length >= senders?.metadata.total_records) {
                console.log("No more data to load");
                return;
            }
    
            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await fetchSenders(nextPage, true);
            } catch (error) {

            } finally {
                setLoadingMore(false);
            }
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderData();
        }
    }, [orderId,language]);

    useEffect(()=>{
        fetchCities();
        setPage(1);
        fetchSenders(1, false);
    },[prickerSearchValue,language])

    useEffect(() => {
        fetchDeliveryFee();
}, [selectedValue]);

    const CustomAlert = ({ type, title, message, onClose }) => {
        return (
            <View style={[styles.alertOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                <View style={[styles.alertContainer, 
                    type === 'error' ? styles.errorAlert : 
                    type === 'success' ? styles.successAlert : 
                    styles.warningAlert
                ]}>
                    <View style={styles.alertHeader}>
                        <Text style={styles.alertTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.alertMessage}>{message}</Text>
                    <TouchableOpacity 
                        style={[styles.alertButton, 
                            type === 'error' ? styles.errorButton : 
                            type === 'success' ? styles.successButton : 
                            styles.warningButton
                        ]}
                        onPress={onClose}
                    >
                        <Text style={styles.alertButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView 
                ref={scrollViewRef}
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
            <View style={styles.main}>
            {sections?.map((section,index)=>{
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
                    />
            })}
            <Button 
                color={"#F8C332"} 
                        title={(formSpinner.status ? translations[language].tabs.orders.create.loading : translations[language].tabs.orders.create.submit)} 
                onPress={()=> orderId ? handleCreateOrder(`/api/orders/${orderId}`,"PUT") : handleCreateOrder('/api/orders',"POST")}
                disabled={formSpinner.status}
            />
        </View>
    </ScrollView>

            {/* Loading Spinner */}
            {formSpinner.status && (
                <View style={styles.overlay}>
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#F8C332" />
                    </View>
                </View>
            )}

            {/* Success Message - Now rendered outside ScrollView */}
            {success && (
                <View style={styles.successOverlay}>
                    <View style={styles.successContainer}>
                        <Feather name="check-circle" size={50} color="#2E7D32" />
                        <Text style={[styles.successText, { marginTop: 15 }]}>
                            {translations[language].tabs.orders.create.successMsg}
                        </Text>
                    </View>
                </View>
            )}

            {/* Custom Alert - Already positioned correctly */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    main:{
        padding:15
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    spinnerContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    successOverlay: {
        position: 'fixed',
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
        backgroundColor: '#E8F5E9',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 10,
        margin: 10,
        borderRadius: 5,
    },
    errorText: {
        color: '#D32F2F',
        textAlign: 'center',
    },
    successText: {
        color: '#2E7D32',
        textAlign: 'center',
    },
    alertOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    alertContainer: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    alertMessage: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        lineHeight: 22,
    },
    alertButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    errorAlert: {
        borderLeftWidth: 5,
        borderLeftColor: '#D32F2F',
    },
    successAlert: {
        borderLeftWidth: 5,
        borderLeftColor: '#2E7D32',
    },
    warningAlert: {
        borderLeftWidth: 5,
        borderLeftColor: '#F8C332',
    },
    errorButton: {
        backgroundColor: '#D32F2F',
    },
    successButton: {
        backgroundColor: '#2E7D32',
    },
    warningButton: {
        backgroundColor: '#F8C332',
    },
    alertButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
})