import { View,StyleSheet, ScrollView,Button, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState, useRef } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useLocalSearchParams } from "expo-router";
import Feather from '@expo/vector-icons/Feather';

export default function HomeScreen(){
    const { userId } = useLocalSearchParams();
    const { language } = useLanguage();
    const [page,setPage] = useState(1);
    const [loadingMore,setLoadingMore] = useState(false);
    const [cities,setCities] = useState([]);
    const [roles,setRoles] = useState([]);
    const [branches,setBranches] = useState([]);
    const [pricelists,setPricelists] = useState([]);
    const [managers,setManagers] = useState([]);
    const [prickerSearchValue,setPickerSearchValue] = useState("");
    const [selectedValue,setSelectedValue] = useState({
        city:"",
        role:"",
        pricelist:"",
        branch:"",
        manager:""
    });

    const [form,setForm] = useState({})
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState({ status: false, msg: "" });
    const [formSpinner, setFormSpinner] = useState({ status: false });
    const [fieldErrors, setFieldErrors] = useState({});
    const [showAlert, setShowAlert] = useState({
        visible: false,
        type: 'error',
        title: '',
        message: '',
        onClose: null
    });
    const scrollViewRef = useRef(null);

    const sections = [{
        label:translations[language].users.create.sections.user.title,
        icon:<FontAwesome name="user-o" size={24} color="#F8C332" />,
        fields:[{
            label:translations[language].users.create.sections.user.fields.name,
            name:"name",
            type:"input",
            value:form.name || "",
            onChange:(input)=> setForm((form)=> ({...form,name:input}))
        },{
            label:translations[language].users.create.sections.user.fields.commercial,
            type:"input",
            name:"comercial_name",
            value:form.comercialName || "",
            onChange:(input)=> setForm((form)=> ({...form,comercialName:input}))
        },{
            label:translations[language].users.create.sections.user.fields.firstPhone,
            type:"input",
            name:"phone",
            value:form.firstPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,firstPhone:input}))
        },{
            label:translations[language].users.create.sections.user.fields.secondPhone,
            type:"input",
            name:"secondPhone",
            value:form.secondPhone || "",
            onChange:(input)=> setForm((form)=> ({...form,secondPhone:input}))
        },{
            label:translations[language].users.create.sections.user.fields.affillator,
            type:"input",
            name:"affilliator",
            value:form.affiliator || "",
            onChange:(input)=> setForm((form)=> ({...form,affiliator:input}))
        },{
            label:translations[language].users.create.sections.user.fields.city,
            type:"select",
            name:"city_id",
            value:selectedValue.city.name,
            list:cities
        },{
            label:translations[language].users.create.sections.user.fields.area,
            type:"input",
            name:"area",
            value:form.area || "",
            onChange:(input)=> setForm((form)=> ({...form,area:input}))
        },{
            label:translations[language].users.create.sections.user.fields.address,
            type:"input",
            name:"address",
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
            name:"role_id",
            value:selectedValue.role.name,
            list:roles
        },{
            label:translations[language].users.create.sections.details.fields.branch,
            type:"select",
            name:"branch_id",
            name:"branch",
            value:selectedValue.branch.name,
            list:branches
        },{
            label:translations[language].users.create.sections.details.fields.manager,
            type:"select",
            name:"manager",
            name:"manager_id",
            value:selectedValue.manager.name,
            list:managers
        },selectedValue.role.id === 2 ? {
            label:translations[language].users.create.sections.details.fields.pricelist,
            type:"select",
            name:"pricelist_id",
            value:selectedValue.pricelist.name,
            list:pricelists
        } : {visibility:"hidden"}]
    }]

    const scrollToError = (fieldName) => {
        const sectionWithError = sections.find(section => 
            section.fields.some(field => field.name === fieldName)
        );

        if (sectionWithError && scrollViewRef.current) {
            const sectionIndex = sections.indexOf(sectionWithError);
            const approximatePosition = sectionIndex * 250;
            
            scrollViewRef.current.scrollTo({
                y: Math.max(0, approximatePosition - 50),
                animated: true
            });
        }
    };

    const createSender = async (url, method) => {
        setFormSpinner({ status: true });
        setFieldErrors({});
        setSuccess(false);
        setError({ status: false, msg: "" });

        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`, {
                method: method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': language
                },
                body: JSON.stringify({
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
            });

            const data = await res.json();

            if (!res.ok) {
                setFormSpinner({ status: false });
                if (data.details) {
                    const errors = {};
                    data.details.forEach(error => {
                        errors[error.field] = error.message;
                    });
                    setFieldErrors(errors);
                    
                    const firstErrorField = data.details[0]?.field;
                    if (firstErrorField) {
                        scrollToError(firstErrorField);
                    }

                    setShowAlert({
                        visible: true,
                        type: 'error',
                        title: translations[language].users.create.error,
                        message: translations[language].users.create.errorValidationMsg
                    });
                } else {
                    setShowAlert({
                        visible: true,
                        type: 'error',
                        title: translations[language].users.create.error,
                        message: data.message || translations[language].users.create.errorMsg
                    });
                }
                return;
            }

            setFormSpinner({ status: false });
            setSuccess(true);
            
            setShowAlert({
                visible: true,
                type: 'success',
                title: translations[language].users.create.success,
                message: translations[language].users.create.successMsg,
                onClose: () => router.push("(tabs)/users")
            });

        } catch (err) {
            setFormSpinner({ status: false });
            
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].users.create.error,
                message: translations[language].users.create.errorMsg
            });
        }
    };

    const fetchUserData = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}?language_code=${language}`, {
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
                    branch:{name:userData.branch,id:userData.branch_id},
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
        }
    };

    const fetchRelatedData = async (url,setData)=>{
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/${url}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            setData(data.data);
        } catch (err) {
        }
    }

    const loadMoreData = async () => {
        if (!loadingMore && senders?.data.length > 0) {
            // Check if there's more data to load
            if (senders.data.length >= senders?.metadata.total_records) {
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
        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    useEffect(()=>{
        fetchRelatedData(`api/addresses/cities?language_code=${language}`,setCities)
        fetchRelatedData(`api/branches?language_code=${language}`,setBranches)
        fetchRelatedData(`api/prices-list`,setPricelists)
        fetchRelatedData(`api/roles?language_code=${language}`,setRoles)
        fetchRelatedData(`api/users?role=business&language_code=${language}`,setManagers)
        setPage(1);
    },[])

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

    return <View style={{ flex: 1 }}>
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
                            loadMoreData={loadMoreData}
                            loadingMore={loadingMore}
                            setSelectedValue={setSelectedValue}
                            fieldErrors={fieldErrors}
                            setFieldErrors={setFieldErrors}
                            />
                    })}
                    <Button 
                        color={"#F8C332"} 
                        title={formSpinner.status ? translations[language].users.create.loading : translations[language].users.create.submit}
                        onPress={() => userId ? createSender(`/api/users/${userId}`, "PUT") : createSender('/api/users', "POST")}
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

            {/* Success Message */}
            {success && (
                <View style={styles.successOverlay}>
                    <View style={styles.successContainer}>
                        <Feather name="check-circle" size={50} color="#2E7D32" />
                        <Text style={[styles.successText, { marginTop: 15 }]}>
                            {translations[language].users.create.successMsg}
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
        </View>
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
});