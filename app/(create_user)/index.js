import { View, StyleSheet, ScrollView, Text, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState, useRef } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from "../../utils/secureStore";
import { useAuth } from "../../RootLayout";

export default function HomeScreen() {
    const { userId } = useLocalSearchParams();
    const { language } = useLanguage();
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cities, setCities] = useState([]);
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [pricelists, setPricelists] = useState([]);
    const [managers, setManagers] = useState([]);
    const { user } = useAuth()
    const [prickerSearchValue, setPickerSearchValue] = useState("");
    const [selectedValue, setSelectedValue] = useState({
        city_id: "",
        role_id: "",
        pricelist_id: "",
        branch_id: "",
        manager_id: ""
    });

    const [form, setForm] = useState({});
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
        label: translations[language].users.create.sections.user.title,
        icon: <FontAwesome name="user-o" size={24} color="#4361EE" />,
        fields: [{
            label: translations[language].users.create.sections.user.fields.name,
            name: "name",
            type: "input",
            value: form.name || "",
            onChange: (input) => setForm((form) => ({ ...form, name: input }))
        },["admin","manager"].includes(user.role) ? {
            label: translations[language].users.create.sections.details.fields.role,
            type: "select",
            name: "role_id",
            value: selectedValue.role_id.name || form.role,
            list: roles
        } : {visibility:"hidden"},(selectedValue.role_id?.role_id === 2 || user.role === "business") ? {
            label: translations[language].users.create.sections.user.fields.commercial,
            type: "input",
            name: "comercial_name",
            value: form.comercialName || "",
            onChange: (input) => setForm((form) => ({ ...form, comercialName: input }))
        } : {visibility:"hidden"}, {
            label: translations[language].users.create.sections.user.fields.firstPhone,
            type: "input",
            name: "firstPhone",
            value: form.firstPhone || "",
            onChange: (input) => setForm((form) => ({ ...form, firstPhone: input }))
        }, {
            label: translations[language].users.create.sections.user.fields.secondPhone,
            type: "input",
            name: "secondPhone",
            value: form.secondPhone || "",
            onChange: (input) => setForm((form) => ({ ...form, secondPhone: input }))
        },{
            label: translations[language].users.create.sections.user.fields.city,
            type: "select",
            name: "city_id",
            value: selectedValue.city_id.name || form.city,
            list: cities
            .slice(2) // Skip first two cities
            .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
            .filter(city => 
                !prickerSearchValue || 
                city.name.toLowerCase().includes(prickerSearchValue.toLowerCase())
            ),
            showSearchBar: true,
        }, {
            label: translations[language].users.create.sections.user.fields.address,
            type: "input",
            name: "address",
            value: form.address || "",
            onChange: (input) => setForm((form) => ({ ...form, address: input }))
        }]
    }, {
        label: translations[language].users.create.sections.details.title,
        icon: <MaterialIcons name="admin-panel-settings" size={24} color="#4361EE" />,
        fields: [{
            label: translations[language].users.create.sections.details.fields.branch,
            type: "select",
            name: "branch_id",
            value: selectedValue.branch_id.name || form.branch,
            list: branches
        }, selectedValue.role_id?.role_id === 2 ? {
            label: translations[language].users.create.sections.details.fields.pricelist,
            type: "select",
            name: "pricelist_id",
            value: selectedValue.pricelist_id.name || form.priceList,
            list: pricelists
        } : { visibility: "hidden" }]
    }];

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
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`, {
                method: method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    'Accept-Language': language,
                    // "Cookie": token ? `token=${token}` : ""
                },
                body: JSON.stringify({
                    name: form.name,
                    comercial_name: form.comercialName,
                    email: form.email,
                    phone: form.firstPhone,
                    phone_2: form.secondPhone,
                    password: form.firstPhone,
                    role_id: selectedValue.role_id.role_id || form.role_id,
                    branch_id: selectedValue.branch_id.branch_id || form.branch_id,
                    affiliator: form.affiliator,
                    pricelist_id: selectedValue.pricelist_id.pricelist_id || form.priceList_id,
                    country: "palestine",
                    city_id: selectedValue.city_id.city_id || form.city_id,
                    expected_salary:0,
                    address: form.address,
                    website: form.website,
                    tiktok: form.tiktok,
                    whatsapp: form.whatsapp,
                    instagram: form.instagram,
                    facebook: form.facebook,
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
                onClose: () => {["admin","manager"].includes(user.role) ? router.push("(users)") : router.push("(tabs)")}
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
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${userId}?language_code=${language}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : ""
                }
            });
            const userData = await res.json();
            setSelectedValue((selectedValue) => (
                {
                    ...selectedValue,
                    city: { name: userData.city, id: userData.city_id },
                    role: { name: userData.role, id: userData.role_id },
                    branch: { name: userData.branch, id: userData.branch_id },
                    pricelist: { name: userData.priceList, id: userData.priceList_id },
                    branch:{name:userData.branch, id: userData.branch_id}
                }
            ));
            setForm({
                name: userData.name,
                comercialName: userData.comercialName,
                firstPhone: userData.firstPhone,
                secondPhone: userData.secondPhone,
                affiliator: userData.affiliator,
                city: userData.city,
                city_id:userData.city_id,
                address: userData.address,
                role: userData.role,
                branch: userData.branch,
                branch_id: userData.branch_id,
                role_id:userData.role_id,
                priceList: userData.priceList,
                priceList_id:user.priceList_id
            });
        } catch (err) {
        }
    };

    const fetchRelatedData = async (url, setData) => {
        try {
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/${url}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : ""
                }
            });
            const data = await res.json();
            setData(data.data);
        } catch (err) {
        }
    };

    const loadMoreData = async () => {
        if (!loadingMore && managers?.length > 0) {
            setLoadingMore(true);
            const nextPage = page + 1;
            setPage(nextPage);
            try {
                await fetchRelatedData(`api/users?role=business&language_code=${language}&page=${nextPage}`, (newData) => {
                    setManagers(prev => [...prev, ...newData]);
                });
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

    useEffect(() => {
        fetchRelatedData(`api/addresses/cities?language_code=${language}`, setCities);
        fetchRelatedData(`api/branches?language_code=${language}`, setBranches);
        fetchRelatedData(`api/prices-list`, setPricelists);
        fetchRelatedData(`api/roles?language_code=${language}`, setRoles);
        fetchRelatedData(`api/users?role=business&language_code=${language}`, setManagers);
        setPage(1);
    }, [language]);

    const CustomAlert = ({ type, title, message, onClose }) => {
        return (
            <View style={styles.alertOverlay}>
                <View style={[
                    styles.alertContainer
                ]}>
                    <View style={[
                        styles.alertColorBar,
                        type === 'error' ? styles.errorBar :
                            type === 'success' ? styles.successBar :
                                styles.warningBar
                    ]} />
                    <View style={styles.alertContent}>
                        <View style={[
                            styles.alertHeader
                        ]}>
                            <Text style={[
                                styles.alertTitle
                            ]}>
                                {title}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[
                            styles.alertMessage
                        ]}>
                            {message}
                        </Text>
                        <View>
                            <TouchableOpacity
                                style={[
                                    styles.alertButton,
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
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.contentContainer
                ]}
                keyboardShouldPersistTaps="handled"
            >

                <View style={styles.main}>
                    {sections?.map((section, index) => {
                        return <Section
                            key={index}
                            section={section}
                            loadMoreData={loadMoreData}
                            loadingMore={loadingMore}
                            setSelectedValue={setSelectedValue}
                            fieldErrors={fieldErrors}
                            setFieldErrors={setFieldErrors}
                            prickerSearchValue={prickerSearchValue}
                            setPickerSearchValue={setPickerSearchValue}
                        />
                    })}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => userId ? 
                            createSender(`/api/users/${userId}`, "PUT") : 
                            createSender('/api/users', "POST")}
                        disabled={formSpinner.status}
                    >
                        <LinearGradient
                            colors={['#4361EE', '#3A0CA3']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {formSpinner.status ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {translations[language].users.create.submit}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Loading Spinner */}
            {formSpinner.status && (
                <View style={styles.overlay}>
                    <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color="#4361EE" />
                    </View>
                </View>
            )}

            {/* Success Message */}
            {success && (
                <View style={styles.successOverlay}>
                    <View style={styles.successContainer}>
                        <View style={styles.successIconContainer}>
                            <Feather name="check-circle" size={50} color="#FFFFFF" />
                        </View>
                        <Text style={styles.successTitle}>
                            {translations[language].users.create.success}
                        </Text>
                        <Text style={styles.successText}>
                            {translations[language].users.create.successMsg}
                        </Text>
                        <TouchableOpacity 
                            style={styles.successButton}
                            onPress={() => router.push("(tabs)/users")}
                        >
                            <Text style={styles.successButtonText}>
                                {translations[language].users.create.returnToUsers}
                            </Text>
                        </TouchableOpacity>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    main: {
        width: '100%',
        padding: 16,
    },
    submitButton: {
        marginTop: 24,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    gradientButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
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
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    successIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    successButton: {
        backgroundColor: '#4361EE',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    successButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        flexDirection: 'row',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    alertColorBar: {
        width: 8,
    },
    errorBar: {
        backgroundColor: '#EF4444',
    },
    successBar: {
        backgroundColor: '#10B981',
    },
    warningBar: {
        backgroundColor: '#F59E0B',
    },
    alertContent: {
        flex: 1,
        padding: 16,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
    },
    closeButton: {
        padding: 4,
    },
    alertMessage: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 22,
    },
    alertButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        minWidth: 100,
        alignItems: 'center',
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
        fontSize: 14,
        fontWeight: '600',
    },
});