import { View,StyleSheet, ScrollView,Button } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from "expo-router";
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
    const {setTrackChanges} = useAuth();
    const { orderId } = useLocalSearchParams();
    const [senders,setSenders] = useState([]);
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const {user} = useAuth()
    const [cities,setCities] = useState([]);
    const [orderTypes,setOrderTypes] = useState([]);
    const [paymentTypes,setPaymentTypes] = useState([]);
    const [currencyList,setCurrencyList] = useState([]);
    const [checks, setChecks] = useState([]);
    const [prickerSearchValue,setPickerSearchValue] = useState("");
    const [deliveryFee,setDeliveryFee] = useState(0);
    const [returnedOrdersMessage, setReturnedOrdersMessage] = useState('');
    const [selectedValue,setSelectedValue] = useState({
        sender:"",
        city:"",
        orderType:orderId ? "" : { name: "Delivery", value: "delivery" },
        paymentType: orderId ? "" : { name: "Cash", value: "cash" },
        currency:orderId ? "" : { name: "ILS", value: "ILS" },
        itemsType:orderId ? "" : { name: "Normal", value: "normal" },
    });

    const [form,setForm] = useState({})
 
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
            label:"Found it automatically",
            type: "message",
            value: returnedOrdersMessage
        } : {visibility:"hidden"},{
            label:translations[language].tabs.orders.create.sections.client.fields.client,
            type:"input",
            value:form.receiverName || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverName:input}))
        },{
            label: translations[language].tabs.orders.create.sections.client.fields.firstPhone,
            type: "input",
            value: form.receiverFirstPhone || "",
            onChange: (input) => setForm((form) => ({ ...form, receiverFirstPhone: input })),
            onBlur: () => handleCheckPhone(form.receiverFirstPhone)
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.secondPhone,
            type:"input",
            value:form.receiverSecondPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverSecondPhone:input}))
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.city,
            type:"select",
            name:"city",
            value:selectedValue.city.name,
            list:cities
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.area,
            type:"input",
            value:form.receiverArea || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverArea:input}))
        },{
            label:translations[language].tabs.orders.create.sections.client.fields.address,
            type:"input",
            value:form.receiverAddress || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverAddress:input}))
        }]
    },{
        label:translations[language].tabs.orders.create.sections.cost.title,
        icon:<MaterialIcons name="attach-money" size={24} color="#F8C332" />,
        fields:[{
            label:"Payment Type",
            type:"select",
            name:"paymentType",
            placeholder:"Cash",
            defaultValue:"cash",
            value:selectedValue.paymentType.name,
            list:paymentTypes
        },
        (selectedValue.paymentType?.value || form.paymentType) === "cash" ||
        (selectedValue.paymentType?.value || form.paymentType) === "cash/check" ? {
          label:translations[language].tabs.orders.create.sections.cost.fields.packageCost,
          type:"input",
          value:form.codValue || "",
          onChange:(input)=> setForm((form)=> ({...form,codValue:input}))
      } : {visibility:"hidden"},...((selectedValue.paymentType?.value || form.paymentType) === "check" ||
        (selectedValue.paymentType?.value || form.paymentType) === "cash/check" 
          ? [
              {
                value: "+ Add Check",
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
                  label: `Check #${index + 1} - Number`,
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
                  label: `Check #${index + 1} - Value`,
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
                  label: `Check #${index + 1} - Currency`,
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
                  label: `Check #${index + 1} - Date`,
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
            label:"Currency",
            type:"select",
            name:"currency",
            value:selectedValue.currency.name,
            list:currencyList
        },{
            label:translations[language].tabs.orders.create.sections.cost.fields.deliveryFee,
            type:"input",
            value: deliveryFee || form.deliveryFee,
        }]
    },{
        label:translations[language].tabs.orders.create.sections.details.title,
        icon:<Feather name="package" size={24} color="#F8C332" />,
        fields:[{
            label:"Order Type",
            type:"select",
            name:"orderType",
            value:selectedValue.orderType.name,
            list:orderTypes
        },(selectedValue.orderType?.value || form.orderType) === "receive" ||
        (selectedValue.orderType?.value || form.orderType) === "delivery/receive" ? {
            label:"Received Items",
            type:"input",
            name:"receivedItems",
            value:form.receivedItems || "",
            onChange:(input)=> setForm((form)=> ({...form,receivedItems:input}))
        } : {visibility:"hidden"},
        (selectedValue.orderType?.value || form.orderType) === "receive" ||
        (selectedValue.orderType?.value || form.orderType) === "delivery/receive" ? {
            label:"Received Quantity",
            type:"input",
            name:"receivedQuantity",
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
            value:form.numberOfItems || "",
            onChange:(input)=> setForm((form)=> ({...form,numberOfItems:input}))
        },{
            label:translations[language].tabs.orders.create.sections.details.fields.weight,
            type:"input",
            value:form.orderWeight || "",
            onChange:(input)=> setForm((form)=> ({...form,orderWeight:input}))
        },{
            label:translations[language].tabs.orders.create.sections.details.fields.orderType,
            type:"select",
            name:"itemsType",
            list:[{
                name:"normal",
                value:"noraml"
            }],
            value:form.itemsType || selectedValue.itemsType.name,
        }]
    },{
        label:"Notes",
        icon:<Feather name="package" size={24} color="#F8C332" />,
        fields:[{
            label:"Note",
            type:"input",
            value:form.noteContent || "",
            onChange:(input)=> setForm((form)=> ({...form,noteContent:input}))
        }]
    }]

    const handleCheckPhone = async (phone) => {
        if (!phone) return;
    
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/receivers/check-phone/${encodeURIComponent(phone)}`
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
                        city: { name: city.city_name, city_id: city.city_id }
                    }));
                }
    
                // Show warning if returned orders
                setReturnedOrdersMessage(
                    data.returnedOrdersCount > 0 
                        ? `Warning: This client has ${data.returnedOrdersCount} returned orders`
                        : ''
                );
            }
        } catch (error) {
            console.error('Phone check error:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to check phone number'
            );
        }
    };

    const handleCreateOrder = async (url,method)=>{

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
        
        setFormSpinner({status:true})
        setFieldErrors({});
        setSuccess(false);
        setError({status:false,msg:""});
        try{
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`,{
                method:method,
                credentials:"include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': "en"
                },
                body:JSON.stringify({
                    reference_id: form.referenceId,
                    delivery_fee: deliveryFee ? deliveryFee : form.deliveryFee,
                    sender_id: selectedValue.sender.user_id,
                    business_branch_id: selectedValue.sender.branch_id,
                    current_branch_id: selectedValue.sender.branch_id,
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
                    receiver_first_mobile: form.receiverFirstPhone,
                    receiver_second_mobile: sanitizeInput(form.receiverSecondPhone),
                    receiver_country: sanitizeInput("palestine"),
                    receiver_city: selectedValue.city.city_id || form.senderCityId,
                    receiver_area: form.receiverArea,
                    receiver_address: form.receiverAddress, 
                    note: form.noteContent,
                    checks: formattedChecks
                })
            })
            const data = await res.json();

            if(!res.ok){
                throw {
                    status: res.status,
                    ...data
                  };
            }
            setFormSpinner({status:false})
            setSuccess(true)
            setTrackChanges({type:"ORDER"})
            console.log(data);
        }catch(err){
            setFormSpinner({status:false});
            if (err.type === 'VALIDATION_ERROR' && err.details) {
                // Handle validation errors
                const errors = {};
                err.details.forEach(error => {
                    errors[error.field] = error.message;
                });
                setFieldErrors(errors);
                
                // Set general error message
                setError({
                    status: true,
                    msg: "Please check the highlighted fields"
                });
            } else {
                // Handle other types of errors
                const errorMessages = {
                    SENDER_NOT_FOUND: "Sender not found",
                    CITY_NOT_FOUND: "City not found",
                    BUSINESS_BRANCH_NOT_FOUND: "Business branch not found",
                    CURRENT_BRANCH_NOT_FOUND: "Current branch not found",
                    TO_BRANCH_NOT_FOUND: "Destination branch not found",
                    RECEIVER_CREATION_FAILED: "Failed to create receiver",
                    ORDER_CREATION_FAILED: "Failed to create order",
                    NOTE_CREATION_FAILED: "Failed to create note",
                    QR_CODE_GENERATION_FAILED: "Failed to generate QR code",
                    CODE_UPDATE_FAILED: "Failed to update order codes",
                    ORDER_ITEM_CREATION_FAILED: "Failed to create order item",
                    STATUS_CREATION_FAILED: "Failed to create order status"
                };

                setError({
                    status: true,
                    msg: errorMessages[err.type] || "An unexpected error occurred"
                });
            }
            console.log(err)
            throw err;
        }
    }


    const fetchOrderData = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}`, {
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
                    sender:{name:orderData.sender,id:orderData.senderId},
                    city:{name:orderData.senderCity,id:orderData.senderCityId},
                    orderType:{ name: orderData.orderType, value: orderData.orderType },
                    paymentType: { name: orderData.paymentType, value: orderData.paymentType },
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
            console.log(err);
        }
    };

    const fetchSenders = async (pageNumber = 1, isLoadMore = false)=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users?page=${pageNumber}&role=business&np=${prickerSearchValue}`, {
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
            console.log(err);
        }finally {
            setLoadingMore(false);
        }
    }

    const fetchCities = async ()=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/addresses/cities`, {
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
            console.log(err);
        }
    }



    const fetchDeliveryFee = async ()=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/delivery_fee?senderCityId=${selectedValue.sender.city_id || form.senderCityId}&receiverCityId=${selectedValue.city.city_id || form.receiverCityId}&orderType=${"normal"}&senderId=${selectedValue.sender.user_id || form.senderId}`, {
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
            console.log(err);
        }
    }

    const loadMoreData = async () => {
        console.log("loadMoreData called");
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
                console.error("Error loading more data:", error);
            } finally {
                setLoadingMore(false);
            }
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderData();
        }
    }, [orderId]);

    useEffect(()=>{
        fetchCities();
        setPage(1);
        fetchSenders(1, false);
        setOrderTypes([{
            name:"Delivery",
            value:"delivery"
        },{
            name:"Receive",
            value:"receive"
        },{
            name:"Delivery / Recieve",
            value:"delivery/receive"
        }])
        setCurrencyList([{
            name:"ILS",
            value:"ILS"
        },{
            name:"USD",
            value:"USD"
        },{
            name:"JOD",
            value:"JOD"
        }]);
        setPaymentTypes([{
            name:"Cash",
            value:"cash"
        },{
            name:"Check",
            value:"check"
        },{
            name:"Cash/Check",
            value:"cash/check"
        }])
    },[prickerSearchValue])

    useEffect(() => {
        fetchDeliveryFee();
}, [selectedValue]);


    return <ScrollView>
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
                    />
            })}
            <Button color={"#F8C332"} title="Submit" onPress={()=> orderId ? handleCreateOrder(`/api/orders/${orderId}`,"PUT") : handleCreateOrder('/api/orders',"POST")} />
        </View>
    </ScrollView>
}

const styles = StyleSheet.create({
    main:{
        padding:15
    }
})