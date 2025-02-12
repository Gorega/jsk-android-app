import { View,StyleSheet, ScrollView,Button } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useLocalSearchParams } from "expo-router";

export default function HomeScreen(){
    const { userId } = useLocalSearchParams();
    const { language } = useLanguage();
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const [cities,setCities] = useState([]);
    const [roles,setRoles] = useState([]);
    const [pricelists,setPricelists] = useState([]);
    const [prickerSearchValue,setPickerSearchValue] = useState("");
    const [selectedValue,setSelectedValue] = useState({
        city:"",
        role:"",
        pricelist:""
    });

    const [form,setForm] = useState({})
 
    const sections = [{
        label:translations[language].users.create.sections.user.title,
        icon:<FontAwesome name="user-o" size={24} color="#F8C332" />,
        fields:[{
            label:translations[language].users.create.sections.user.fields.name,
            type:"input",
            value:form.name || "",
            onChange:(input)=> setForm((form)=> ({...form,name:input}))
        },{
            label:translations[language].users.create.sections.user.fields.commercial,
            type:"input",
            value:form.comercialName || "",
            onChange:(input)=> setForm((form)=> ({...form,comercialName:input}))
        },{
            label:translations[language].users.create.sections.user.fields.firstPhone,
            type:"input",
            value:form.firstPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,firstPhone:input}))
        },{
            label:translations[language].users.create.sections.user.fields.secondPhone,
            type:"input",
            value:form.secondPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,secondPhone:input}))
        },{
            label:translations[language].users.create.sections.user.fields.affillator,
            type:"input",
            value:form.Affillator || "",
            onChange:(input)=> setForm((form)=> ({...form,Affillator:input}))
        },{
            label:translations[language].users.create.sections.user.fields.city,
            type:"select",
            name:"city",
            value:selectedValue.city.name,
            list:cities
        },{
            label:translations[language].users.create.sections.user.fields.area,
            type:"input",
            value:form.area || "",
            onChange:(input)=> setForm((form)=> ({...form,area:input}))
        },{
            label:translations[language].users.create.sections.user.fields.address,
            type:"input",
            value:form.address || "",
            onChange:(input)=> setForm((form)=> ({...form,address:input}))
        }]
    },{
        label:translations[language].users.create.sections.details.title,
        icon:<MaterialIcons name="attach-money" size={24} color="#F8C332" />,
        fields:[{
            label:translations[language].users.create.sections.details.fields.role,
            type:"select",
            name:"role",
            value:selectedValue.role.name,
            list:roles
        },{
            label:translations[language].users.create.sections.details.fields.pricelist,
            type:"select",
            name:"pricelist",
            value:selectedValue.pricelist.name,
            list:pricelists
        }]
    }]

    const createSender = async (url,method)=>{

        setFormSpinner({status:true})
        setFieldErrors({});
        setSuccess({status:false,msg:""});
        setError({status:false,msg:""});

        try{
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${url}`,{
            method:method,
            credentials:"include",
            headers: {
                "Content-Type": "application/json",
            },
            body:JSON.stringify({
                name:form.name,
                comercial_name:form.comercialName,
                email:form.email,
                phone:form.firstPhone,
                phone_2:form.secondPhone,
                password:form.firstPhone,
                role_id:selectedValue.role.role_id,
                branch_id:selectedValue.branch.branch_id,
                manager_id:selectedValue.manager.user_id,
                affiliator:form.affiliator,
                pricelist_id:selectedValue.pricelist.pricelist_id,
                country:"palestine",
                city_id:selectedValue.city.city_id,
                area:form.area,
                address:form.address,
                website:form.website,
                tiktok:form.tiktok,
                whatsapp:form.whatsapp,
                instagram:form.instagram,
                facebook:form.facebook,
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
            setTrackChanges({type:"SENDER"})
            setModals((modals)=> modals.filter((modal)=> modal.type !== "CREATE_USER" && modal.type !== "EDIT_USER"));
            return data;

        }catch(err){
            setFormSpinner({status:false});
            if (err.type === 'VALIDATION_ERROR' && err.details) {
                // Handle validation errors
                const errors = {};
                err.details.forEach(error => {
                    errors[error.field] = error.message;
                });
                setFieldErrors(errors);
                console.log(errors)
                
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
            throw err;
        }
    }


    const fetchUserData = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
            const userData = await res.json();
            setSelectedValue((selectedValue)=> (
                {...selectedValue,
                    city:{name:userData.city,id:userData.city_id},
                    role:{name:userData.role,id:userData.role_id},
                    pricelist:{name:userData.priceList,id:userData.priceList_id}
                }
                    
            ))
            setForm({
                name:userData.name,
                comercialName:userData.comercialName,
                firstPhone:userData.firstPhone,
                secondPhone:userData.secondPhone,
                affiliator:userData.affiliator,
                city_id:userData.city_id,
                area:userData.area,
                address:userData.address,
                role_id:userData.role_id,
                priceList_id:userData.priceList_id,
            })
        } catch (err) {
            console.log(err);
        }
    };

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

    const fetchPricelists = async ()=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/prices-list`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            setPricelists(data.data);
        } catch (err) {
            console.log(err);
        }
    }

    const fetchRoles = async ()=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/roles`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            setRoles(data.data);
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
        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    useEffect(()=>{
        fetchCities();
        fetchPricelists();
        fetchRoles();
        setPage(1);
    },[])

    return <ScrollView>
            <View style={styles.main}>
            {sections?.map((section,index)=>{
                return <Section
                    key={index}
                    section={section}
                    loadMoreData={loadMoreData}
                    loadingMore={loadingMore}
                    setSelectedValue={setSelectedValue}
                    />
            })}
            <Button color={"#F8C332"} title={translations[language].users.create.submit} />
        </View>
    </ScrollView>
}

const styles = StyleSheet.create({
    main:{
        padding:15
    }
})