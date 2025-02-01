import { View,StyleSheet, ScrollView,Button } from "react-native";
import Section from "../../components/create/Section";
import { useContext, useEffect, useState } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../_layout";

export default function HomeScreen(){
    const { orderId } = useLocalSearchParams();
    const [senders,setSenders] = useState([]);
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const {userRoleId} = useAuth()
    const [cities,setCities] = useState([]);
    const [prickerSearchValue,setPickerSearchValue] = useState("");
    const [deliveryFee,setDeliveryFee] = useState(0);
    const [selectedValue,setSelectedValue] = useState({
        sender:"",
        city:"",
    });

    const [form,setForm] = useState({})
    const [isReplaced,setIsReplaced] = useState(false);
 
    const sections = [userRoleId !== 2 ? {
        label:"Sender",
        icon:<FontAwesome name="user-o" size={24} color="#F8C332" />,
        fields:[{
            label:"Sender",
            type:"select",
            name:"sender",
            value:selectedValue.sender.name,
            list:senders,
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
            value: deliveryFee,
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

    const loadMoreData = () => {
        if (!loadingMore && senders?.length > 0) {
            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSenders(nextPage, true);
        }
    };

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

    const fetchSenders = async (pageNumber = 1, shouldAppend = false)=>{
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
            setSenders(prevData => 
                shouldAppend ? [...prevData, ...newData.data] : newData.data
            );
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
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/delivery_fee?senderCityId=${selectedValue.sender.city_id}&receiverCityId=${selectedValue.city.city_id}&orderType=${"normal"}&senderId=${selectedValue.sender.user_id}`, {
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
    if (selectedValue.sender.id && selectedValue.city.id) {
        fetchDeliveryFee();
    }
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
            <Button color={"#F8C332"} title="Submit" />
        </View>
    </ScrollView>
}

const styles = StyleSheet.create({
    main:{
        padding:15
    }
})