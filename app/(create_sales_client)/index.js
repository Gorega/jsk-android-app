import { View, StyleSheet, ScrollView, Text, ActivityIndicator, TouchableOpacity, Platform, KeyboardAvoidingView } from "react-native";
import Section from "../../components/create/Section";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from "../../utils/secureStore";
import { useAuth } from "../../RootLayout";
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const { clientId } = useLocalSearchParams();
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cities, setCities] = useState([]);
    const { user } = useAuth()
    const [prickerSearchValue, setPickerSearchValue] = useState("");
    const [selectedValue, setSelectedValue] = useState({
        city_id: "",
        willingness: null
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

    const willingnessOptions = useMemo(() => ([
        { name: translations[language].users.create.sections.user.fields.high, action: 'high' },
        { name: translations[language].users.create.sections.user.fields.medium, action: 'medium' },
        { name: translations[language].users.create.sections.user.fields.low, action: 'low' }
    ]), [language]);

    const sortedCities = useMemo(() => ([...cities]).sort((a, b) => a.name.localeCompare(b.name)), [cities]);

    const sections = useMemo(() => ([{
        label: translations[language].users.create.sections.user.title,
        icon: <FontAwesome name="user-o" size={24} color="#4361EE" />,
        fields: [{
            label: translations[language].users.create.sections.user.fields.name,
            name: "name",
            type: "input",
            value: form.name || "",
            onChange: (input) => setForm((form) => ({ ...form, name: input }))
        }, {
            label: translations[language].users.user.activity,
            type: "input",
            name: "activity",
            value: form.activity || "",
            onChange: (input) => setForm((form) => ({ ...form, activity: input }))
        }, {
            label: translations[language].users.create.sections.user.fields.firstPhone,
            type: "input",
            name: "phone",
            value: form.phone || "",
            onChange: (input) => setForm((form) => ({ ...form, phone: input }))
        }, {
            label: translations[language].users.create.sections.user.fields.secondPhone,
            type: "input",
            name: "phone_2",
            value: form.phone_2 || "",
            onChange: (input) => setForm((form) => ({ ...form, phone_2: input }))
        }, {
            label: translations[language].users.user.email,
            type: "input",
            name: "email",
            value: form.email || "",
            onChange: (input) => setForm((form) => ({ ...form, email: input }))
        },{
            label: translations[language].users.create.sections.user.fields.city,
            type: "select",
            name: "city_id",
            value: selectedValue.city_id.name || form.city,
            list: sortedCities.filter(city => 
                !prickerSearchValue || 
                city.name.toLowerCase().includes(prickerSearchValue.toLowerCase())
            ),
            showSearchBar: true,
        },{
            label: translations[language].users.create.sections.user.fields.address,
            type: "input",
            name: "address",
            value: form.address || "",
            onChange: (input) => setForm((form) => ({ ...form, address: input }))
        }, {
            label: translations[language].users.create.sections.user.fields.willingness,
            type: "select",
            name: "willingness",
            value: selectedValue.willingness?.name || form.willingness,
            list: willingnessOptions
        }, {
            label: translations[language].tabs?.orders?.order?.note || 'Note',
            type: "input",
            name: "note",
            value: form.note || "",
            onChange: (input) => setForm((form) => ({ ...form, note: input }))
        }]
    }]), [language, form, selectedValue, sortedCities, prickerSearchValue, willingnessOptions]);

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


    const submitClient = async (url, method) => {
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
                    'Accept-Language': language,
                },
                body: JSON.stringify({
                    name: form.name,
                    activity: form.activity,
                    phone: form.phone,
                    phone_2: form.phone_2,
                    email: form.email,
                    city_id: selectedValue.city_id?.city_id || form.city_id,
                    area: "",
                    address: form.address,
                    willingness: selectedValue.willingness?.action || form.willingness,
                    note: form.note
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
                onClose: () => {router.push("(sales_clients)")}
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

    const fetchClientData = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/sales_rep_clients/${clientId}?language_code=${language}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                }
            });
            const userData = await res.json();
            setSelectedValue((selectedValue) => (
                {
                    ...selectedValue,
                    city_id: { name: userData.city, city_id: userData.city_id },
                    willingness: userData.willingness ? { name: userData.willingness, action: userData.willingness } : null
                }
            ));
            setForm({
                name: userData.name,
                activity: userData.activity,
                phone: userData.phone,
                phone_2: userData.phone_2,
                email: userData.email,
                city: userData.city,
                city_id:userData.city_id,
                area: userData.area,
                address: userData.address,
                willingness: userData.willingness,
                note: userData.note
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

    const loadMoreData = useCallback(() => {}, []);

    useEffect(() => {
        if (clientId) {
            fetchClientData();
        }
    }, [clientId]);

    useEffect(() => {
        fetchRelatedData(`api/addresses/cities?language_code=${language}`, setCities);
        setPage(1);
    }, [language]);

    const CustomAlert = ({ type, title, message, onClose }) => {
        return (
            <View style={styles.alertOverlay}>
                <View style={[
                    styles.alertContainer,
                    { backgroundColor: colors.card }
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
                                styles.alertTitle,
                                { color: colors.text }
                            ]}>
                                {title}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={24} color={isDark ? colors.textSecondary : "#64748B"} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[
                            styles.alertMessage,
                            { color: isDark ? colors.textSecondary : "#64748B" }
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 64 : 0}
            style={[
            styles.container, 
            { 
                backgroundColor: colors.background,
                paddingTop: insets.top
            }
        ]}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.contentContainer,
                    { backgroundColor: colors.background }
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

                    <View style={[
                        styles.buttonContainer,
                        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12) }
                    ]}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => clientId ? 
                                submitClient(`/api/sales_rep_clients/${clientId}`, "PUT") : 
                                submitClient('/api/sales_rep_clients', "POST")}
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
                </View>
            </ScrollView>

            {/* Loading Spinner */}
            {formSpinner.status && (
                <View style={[
                    styles.overlay, 
                    { 
                        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom
                    }
                ]}>
                    <View style={[styles.spinnerContainer, { backgroundColor: colors.card }]}>
                        <ActivityIndicator size="large" color="#4361EE" />
                    </View>
                </View>
            )}

            {/* Success Message */}
            {success && (
                <View style={[
                    styles.successOverlay, 
                    { 
                        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom
                    }
                ]}>
                    <View style={[styles.successContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.successIconContainer}>
                            <Feather name="check-circle" size={50} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.successTitle, { color: colors.text }]}>
                            {translations[language].users.create.success}
                        </Text>
                        <Text style={[styles.successText, { color: isDark ? colors.textSecondary : '#64748B' }]}>
                            {translations[language].users.create.successMsg}
                        </Text>
                        <TouchableOpacity 
                            style={styles.successButton}
                            onPress={() => router.push("(sales_clients)")}
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
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
    },
    main: {
        width: '100%',
        padding: 16,
    },
    buttonContainer: {
        marginTop: 24,
        width: '100%',
    },
    submitButton: {
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
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    spinnerContainer: {
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
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500,
    },
    successContainer: {
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
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
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
    },
    closeButton: {
        padding: 4,
    },
    alertMessage: {
        fontSize: 15,
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