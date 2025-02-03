import { View,StyleSheet, ScrollView,Button } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../_layout";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

export default function HomeScreen(){
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
    const [prickerSearchValue,setPickerSearchValue] = useState("");
    const [deliveryFee,setDeliveryFee] = useState(0);
    const [selectedValue,setSelectedValue] = useState({
        sender:"",
        city:"",
    });

    const [form,setForm] = useState({})
    const [isReplaced,setIsReplaced] = useState(false);
 
    const sections = [user.role !== "business" ? {
        label:"Sender",
        icon:<SimpleLineIcons name="user-follow" size={24} color="#F8C332" />,
        fields:[{
            label:"Sender",
            type:"select",
            name:"sender",
            value:selectedValue.sender.name,
            list:senders.data,
            showSearchBar:true
        }]
    }:{visibility:"hidden"},{
        label:"Client",
        icon:<FontAwesome name="user-o" size={24} color="#F8C332" />,
        fields:[{
            label:"Client",
            type:"input",
            value:form.receiverName || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverName:input}))
        },{
            label:"Phone Number",
            type:"input",
            value:form.receiverFirstPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverFirstPhone:input}))
        },{
            label:"Second Phone Number",
            type:"input",
            value:form.receiverSecondPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverSecondPhone:input}))
        },{
            label:"City",
            type:"select",
            name:"city",
            value:selectedValue.city.name,
            list:cities
        },{
            label:"Area",
            type:"input",
            value:form.receiverArea || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverArea:input}))
        },{
            label:"Address",
            type:"input",
            value:form.receiverAddress || "",
            onChange:(input)=> setForm((form)=> ({...form,receiverAddress:input}))
        }]
    },{
        label:"Cost",
        icon:<MaterialIcons name="attach-money" size={24} color="#F8C332" />,
        fields:[{
            label:"Package Cost",
            type:"input",
            value:form.codValue || "",
            onChange:(input)=> setForm((form)=> ({...form,codValue:input}))
        },{
            label:"Delivery Fee",
            type:"input",
            value: deliveryFee || form.deliveryFee,
        },{
            label:"Is Replaced ?",
            type:"checkbox",
            value:isReplaced,
            onChange:()=> setIsReplaced(!isReplaced)
        }]
    },{
        label:"Order Details",
        icon:<Feather name="package" size={24} color="#F8C332" />,
        fields:[{
            label:"Product",
            type:"input",
            value:form.orderItems || "",
            onChange:(input)=> setForm((form)=> ({...form,orderItems:input}))
        },{
            label:"Quantity",
            type:"input",
            value:form.numberOfItems || "",
            onChange:(input)=> setForm((form)=> ({...form,numberOfItems:input}))
        },{
            label:"Weight",
            type:"input",
            value:form.orderWeight || "",
            onChange:(input)=> setForm((form)=> ({...form,orderWeight:input}))
        },{
            label:"Order Type",
            type:"select",
            name:"order_type",
            list:[{
                label:"normal",
                action:"noraml"
            }],
            value:form.orderType || "",
        }]
    }]

    const handleCreateOrder = async (url,method)=>{
        
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
                    cod_value:form.codValue,
                    type: form.orderType,
                    weight: form.orderWeight,
                    item_price: form.codValue,
                    extra_cost: form.extraCost,
                    discount: form.discount,
                    replacement_order: isReplaced,
                    receiver_name: form.receiverName,
                    receiver_first_mobile: form.receiverFirstPhone,
                    receiver_second_mobile: sanitizeInput(form.receiverSecondPhone),
                    receiver_country: sanitizeInput("palestine"),
                    receiver_city: selectedValue.city.city_id || form.senderCityId,
                    receiver_area: form.receiverArea,
                    receiver_address: form.receiverAddress, 
                    note: form.noteContent
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
                    city:{name:orderData.senderCity,id:orderData.senderCityId}}
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
                orderType:orderData.orderType,
                orderWeight:orderData.orderWeight,
            })
            setIsReplaced(orderData.replacementOrder || false);
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