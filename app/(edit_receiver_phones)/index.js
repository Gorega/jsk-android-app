import { View, StyleSheet, ScrollView, Text, Alert, ActivityIndicator, Keyboard, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../_layout";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../../components/ModalPresentation";
import { getToken } from "../../utils/secureStore";
import Section from "../../components/create/Section";
import Feather from '@expo/vector-icons/Feather';

export default function EditPhoneScreen() {
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const { orderId } = useLocalSearchParams();
    const { user } = useAuth();
    const [orderData, setOrderData] = useState(null);
    const [form, setForm] = useState({
        receiverFirstPhone: '',
        receiverSecondPhone: ''
    });
    const [showAlert, setShowAlert] = useState({
        visible: false,
        type: 'error',
        title: '',
        message: '',
        onClose: null
    });

    // Fetch order data when component mounts
    useEffect(() => {
        fetchOrderData();
    }, [orderId]);

    const fetchOrderData = async () => {
        if (!orderId) {
            router.back();
            return;
        }

        try {
            setLoading(true);
            const token = await getToken("userToken");
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        'Accept-Language': language,
                        "Cookie": token ? `token=${token}` : ""
                    },
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch order data');
            }

            const data = await response.json();
            setOrderData(data);
            setForm({
                receiverFirstPhone: data.receiver_mobile || '',
                receiverSecondPhone: data.receiver_second_mobile || ''
            });
        } catch (error) {
            Alert.alert(
                translations[language].tabs.orders.order.error || 'Error',
                error.message || translations[language].tabs.orders.order.errorFetchingOrder || 'Error fetching order data'
            );
        } finally {
            setLoading(false);
        }
    };

    const clearFieldError = (fieldName) => {
        if (fieldErrors && fieldName && fieldErrors[fieldName]) {
            setFieldErrors(prev => {
                const updated = {...prev};
                delete updated[fieldName];
                return updated;
            });
        }
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setFieldErrors({});
        setSubmitting(true);
        setError({ status: false, msg: "" });
        Keyboard.dismiss();

        // Basic validation
        if (!form.receiverFirstPhone) {
            setFieldErrors({ receiver_mobile: translations[language].tabs.orders.create.validation.required || 'This field is required' });
            setSubmitting(false);
            return;
        }

        try {
            const token = await getToken("userToken");
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/receivers/${orderData.receiver_id}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language,
                        "Cookie": token ? `token=${token}` : ""
                    },
                    body: JSON.stringify({
                        phone: form.receiverFirstPhone,
                        phone_2: form.receiverSecondPhone || null,
                        orderId: orderId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setSubmitting(false);
                
                if (data.details && Array.isArray(data.details)) {
                    // Handle validation errors
                    const errors = {};
                    for (const error of data.details) {
                        const fieldName = error.field === 'phone' ? 'receiver_mobile' : 
                                         error.field === 'phone_2' ? 'receiver_second_mobile' : error.field;
                        errors[fieldName] = error.message;
                    }
                    setFieldErrors(errors);
                    
                    setError({
                        status: true,
                        msg: translations[language].tabs.orders.create.errorValidationMsg || 'Please correct the errors in the form'
                    });
                    
                    setShowAlert({
                        visible: true,
                        type: 'error',
                        title: translations[language].tabs.orders.create.error || 'Error',
                        message: translations[language].tabs.orders.create.errorValidationMsg || 'Please correct the errors in the form'
                    });
                } else {
                    setError({
                        status: true,
                        msg: data.message || translations[language].tabs.orders.create.errorMsg || 'An error occurred'
                    });
                    
                    setShowAlert({
                        visible: true,
                        type: 'error',
                        title: translations[language].tabs.orders.create.error || 'Error',
                        message: data.message || translations[language].tabs.orders.create.errorMsg || 'An error occurred'
                    });
                }
                return;
            }

            setSubmitting(false);
            
            setShowAlert({
                visible: true,
                type: 'success',
                title: translations[language].tabs.orders.create.success || 'Success',
                message: translations[language].tabs.orders.create.phoneUpdateSuccess || 'Phone numbers updated successfully',
                onClose: () => router.back()
            });

        } catch (err) {
            setSubmitting(false);
            
            setError({
                status: true,
                msg: translations[language].tabs.orders.create.errorMsg || 'An error occurred'
            });
            
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || 'Error',
                message: translations[language].tabs.orders.create.errorMsg || 'An error occurred'
            });
        }
    };

    // Define the sections for the form
    const sections = [{
        label: translations[language].tabs.orders.order.receiverPhones || 'Receiver Phones',
        icon: <Feather name="phone" size={22} color="#4361EE" />,
        fields: [{
            label: translations[language].tabs.orders.create.sections.client.fields.firstPhone || 'First Phone',
            type: "input",
            name: "receiver_mobile",
            value: form.receiverFirstPhone || "",
            onChange: (input) => {
                clearFieldError('receiver_mobile');
                setForm((form) => ({ ...form, receiverFirstPhone: input }));
            },
            error: fieldErrors.receiver_mobile
        }, {
            label: translations[language].tabs.orders.create.sections.client.fields.secondPhone || 'Second Phone',
            type: "input",
            name: "receiver_second_mobile",
            value: form.receiverSecondPhone || "",
            onChange: (input) => {
                clearFieldError('receiver_second_mobile');
                setForm((form) => ({ ...form, receiverSecondPhone: input }));
            },
            error: fieldErrors.receiver_second_mobile
        }]
    }];

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4361EE" />
                    <Text style={styles.loadingText}>
                        {translations[language].tabs.orders.order.loading || 'Loading...'}
                    </Text>
                </View>
            ) : (
                <>
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                        {sections.map((section, index) => (
                            <Section
                                key={index}
                                section={section}
                                setSelectedValue={() => {}}
                                selectedValue={{}}
                                fieldErrors={fieldErrors}
                                setFieldErrors={setFieldErrors}
                                isRTL={isRTL}
                            />
                        ))}
                    </ScrollView>
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {translations[language].tabs.orders.create.save || 'Save Changes'}
                                </Text>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                            disabled={submitting}
                        >
                            <Text style={styles.cancelButtonText}>
                                {translations[language].tabs.orders.create.cancel || 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            
            {/* Alert Modal */}
            {showAlert.visible && (
                <ModalPresentation
                    showModal={showAlert.visible}
                    setShowModal={() => setShowAlert({ ...showAlert, visible: false })}
                    position="center"
                >
                    <View style={[
                        styles.alertContainer,
                        showAlert.type === 'success' ? styles.successContainer : styles.errorContainer
                    ]}>
                        <View style={[
                            styles.alertIconContainer,
                            showAlert.type === 'success' ? styles.successIconContainer : styles.errorIconContainer
                        ]}>
                            <Feather 
                                name={showAlert.type === 'success' ? "check-circle" : "alert-circle"} 
                                size={32} 
                                color="#FFFFFF" 
                            />
                        </View>
                        <Text style={styles.alertTitle}>{showAlert.title}</Text>
                        <Text style={styles.alertMessage}>{showAlert.message}</Text>
                        <TouchableOpacity
                            style={[
                                styles.alertButton,
                                showAlert.type === 'success' ? styles.successButton : styles.errorButton
                            ]}
                            onPress={() => {
                                setShowAlert({ ...showAlert, visible: false });
                                if (showAlert.onClose) showAlert.onClose();
                            }}
                        >
                            <Text style={styles.alertButtonText}>
                                {translations[language].tabs.orders.order.ok || 'OK'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#4361EE',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 16,
    },
    alertContainer: {
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        width: '80%',
    },
    successContainer: {
        backgroundColor: 'white',
    },
    errorContainer: {
        backgroundColor: 'white',
    },
    alertIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successIconContainer: {
        backgroundColor: '#10B981',
    },
    errorIconContainer: {
        backgroundColor: '#EF4444',
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 16,
    },
    alertButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successButton: {
        backgroundColor: '#10B981',
    },
    errorButton: {
        backgroundColor: '#EF4444',
    },
    alertButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});