import { View, StyleSheet, ScrollView, Text, Alert, ActivityIndicator, Keyboard, TouchableOpacity, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../../components/ModalPresentation";
import { getToken } from "../../utils/secureStore";
import Section from "../../components/create/Section";
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function EditReceiverDetailsScreen() {
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const { orderId } = useLocalSearchParams();
    const { user } = useAuth();
    const [orderData, setOrderData] = useState(null);
    const [form, setForm] = useState({
        receiverFirstPhone: '',
        receiverSecondPhone: '',
        receiverAddress: '',
        codValue: '',
        codValueReason: '',
        codCurrency: 'ILS' // Default currency
    });
    const [showCodUpdateForm, setShowCodUpdateForm] = useState(false);
    const [codValueChanged, setCodValueChanged] = useState(false);
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
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        'Accept-Language': language,
                    },
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch order data');
            }

            const data = await response.json();
            setOrderData(data);
            
            // Extract COD value from response
            let codValue = '';
            let currency = '';
            
            // First check if cod_values array exists - this is the preferred source
            if (data.cod_values && Array.isArray(data.cod_values) && data.cod_values.length > 0) {
                codValue = data.cod_values[0].value.toString();
                currency = data.cod_values[0].currency;
            } 
            // Fall back to parsing from total_cod_value string
            else if (data.total_cod_value) {
                const match = data.total_cod_value.match(/[\d.]+/);
                if (match) {
                    codValue = match[0];
                    // Try to extract currency from the string
                    const currencyMatch = data.total_cod_value.match(/^(\w+):/);
                    if (currencyMatch && currencyMatch[1]) {
                        currency = currencyMatch[1];
                    } else {
                        currency = 'ILS'; // Default currency
                    }
                }
            }
            
            setForm({
                receiverFirstPhone: data.receiver_mobile || '',
                receiverSecondPhone: data.receiver_second_mobile || '',
                receiverAddress: data.receiver_address || '',
                codValue: codValue,
                codValueReason: '',
                codCurrency: currency || 'ILS'
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

    const handleCodValueChange = (value) => {
        const numericValue = value.replace(/[^0-9.]/g, '');
        setForm(prev => ({ ...prev, codValue: numericValue }));
        
        // Compare with original value from either cod_values array or total_cod_value string
        let originalCodValue = '';
        
        // First check if cod_values array exists - this is the preferred source
        if (orderData && orderData.cod_values && Array.isArray(orderData.cod_values) && orderData.cod_values.length > 0) {
            originalCodValue = orderData.cod_values[0].value.toString();
        }
        // Fall back to parsing from total_cod_value string
        else if (orderData && orderData.total_cod_value) {
            const match = orderData.total_cod_value.match(/[\d.]+/);
            if (match) {
                originalCodValue = match[0];
            }
        }
        
        // Compare as numbers to avoid string comparison issues
        if (originalCodValue && Number(numericValue) !== Number(originalCodValue)) {
            setCodValueChanged(true);
            setShowCodUpdateForm(true);
        } else {
            setCodValueChanged(false);
            setShowCodUpdateForm(false);
        }
    };

    const requestCodValueUpdate = async () => {
        if (!form.codValueReason) {
            setFieldErrors(prev => ({ ...prev, cod_value_reason: translations[language].tabs.orders.create.validation.required || 'Reason is required' }));
            setSubmitting(false); // Add this line to reset the submitting state
            
            // Also add an error alert to notify the user
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || 'Error',
                message: translations[language].tabs.orders.create.validation.required || 'Reason is required'
            });
            return;
        }

        try {
            setSubmitting(true);
            
            // Extract currency from cod_values array or total_cod_value
            let currency = 'ILS'; // Default to ILS if nothing else is found
            
            // First check if cod_values array exists - this is the preferred source
            if (orderData && orderData.cod_values && Array.isArray(orderData.cod_values) && orderData.cod_values.length > 0) {
                currency = orderData.cod_values[0].currency;
            } 
            // Fall back to parsing from total_cod_value string only if cod_values is not available
            else if (orderData && orderData.total_cod_value) {
                const currencyMatch = orderData.total_cod_value.match(/^(\w+):/);
                if (currencyMatch && currencyMatch[1]) {
                    currency = currencyMatch[1];
                }
            }
            
            
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}/request_cod_value_update`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language,
                    },
                    body: JSON.stringify({
                        order_id: orderId,
                        requested_cod_value: Number(form.codValue),
                        currency: currency,
                        reason: form.codValueReason
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setSubmitting(false);
                setShowAlert({
                    visible: true,
                    type: 'error',
                    title: translations[language].tabs.orders.create.error || 'Error',
                    message: data.message || translations[language].tabs.orders.create.errorMsg || 'An error occurred'
                });
                return;
            }

            setSubmitting(false);
            setShowAlert({
                visible: true,
                type: 'success',
                title: translations[language].tabs.orders.create.success || 'Success',
                message: translations[language].tabs.orders.create.codUpdateRequestSuccess || 'COD value update request sent successfully',
                onClose: () => router.back()
            });

        } catch (err) {
            console.error("Error updating COD value:", err);
            setSubmitting(false);
            setShowAlert({
                visible: true,
                type: 'error',
                title: translations[language].tabs.orders.create.error || 'Error',
                message: translations[language].tabs.orders.create.errorMsg || 'An error occurred'
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
            
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/receivers/${orderData.receiver_id}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language,
                    },
                    body: JSON.stringify({
                        phone: form.receiverFirstPhone,
                        phone_2: form.receiverSecondPhone || null,
                        address: form.receiverAddress || null,
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
                                         error.field === 'phone_2' ? 'receiver_second_mobile' : 
                                         error.field === 'address' ? 'receiver_address' : error.field;
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

            // If COD value has changed and we need to request an update
            if (codValueChanged && showCodUpdateForm) {
                await requestCodValueUpdate();
                return;
            }

            setSubmitting(false);
            
            setShowAlert({
                visible: true,
                type: 'success',
                title: translations[language].tabs.orders.create.success || 'Success',
                message: translations[language].tabs.orders.create.receiverDetailsUpdateSuccess || 'Receiver details updated successfully',
                onClose: () => router.back()
            });

        } catch (err) {
            console.error("Error submitting form:", err);
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
    const sections = [
        {
            label: translations[language].tabs.orders.order.receiverPhones || 'Receiver Phones',
            icon: <Feather name="phone" size={22} color={colors.primary} />,
            fields: [
                {
                    label: translations[language].tabs.orders.create.sections.client.fields.firstPhone || 'First Phone',
                    type: "input",
                    name: "receiver_mobile",
                    value: form.receiverFirstPhone || "",
                    onChange: (input) => {
                        clearFieldError('receiver_mobile');
                        setForm((form) => ({ ...form, receiverFirstPhone: input }));
                    },
                    error: fieldErrors.receiver_mobile,
                    editable: true, // Explicitly make sure it's editable
                    keyboardType: "phone-pad" // Use phone pad keyboard for phone numbers
                }, 
                {
                    label: translations[language].tabs.orders.create.sections.client.fields.secondPhone || 'Second Phone',
                    type: "input",
                    name: "receiver_second_mobile",
                    value: form.receiverSecondPhone || "",
                    onChange: (input) => {
                        clearFieldError('receiver_second_mobile');
                        setForm((form) => ({ ...form, receiverSecondPhone: input }));
                    },
                    error: fieldErrors.receiver_second_mobile,
                    editable: true, // Explicitly make sure it's editable
                    keyboardType: "phone-pad" // Use phone pad keyboard for phone numbers
                }
            ]
        },
        {
            label: translations[language].tabs.orders.order.receiverAddress || 'Receiver Address',
            icon: <Feather name="map-pin" size={22} color={colors.primary} />,
            fields: [
                {
                    label: translations[language].tabs.orders.create.sections.client.fields.address || 'Address',
                    type: "input",
                    name: "receiver_address",
                    value: form.receiverAddress || "",
                    onChange: (input) => {
                        clearFieldError('receiver_address');
                        setForm((form) => ({ ...form, receiverAddress: input }));
                    },
                    error: fieldErrors.receiver_address,
                    editable: true // Explicitly make sure it's editable
                }
            ]
        }
    ];
    
    // Update the condition to check for cod_values array as well
    if (orderData && user.role === 'driver' || user.role === 'delivery_company' &&
        (orderData.total_cod_value || 
         (orderData.cod_values && Array.isArray(orderData.cod_values) && orderData.cod_values.length > 0))) {
        
        // Get currency from cod_values array if available
        let currencySymbol = '₪'; // Default to ILS symbol
        
        if (orderData.cod_values && Array.isArray(orderData.cod_values) && orderData.cod_values.length > 0) {
            const currency = orderData.cod_values[0].currency;
            // Map currency code to symbol
            switch(currency) {
                case 'ILS':
                    currencySymbol = '₪';
                    break;
                case 'USD':
                    currencySymbol = '$';
                    break;
                case 'EUR':
                    currencySymbol = '€';
                    break;
                default:
                    currencySymbol = currency; // Use currency code if no symbol mapping exists
            }
        }
        
        sections.push({
            label: translations[language].tabs.orders.order.codValue || 'COD Value',
            icon: <Feather name="dollar-sign" size={22} color={colors.primary} />,
            fields: [
                {
                    label: `(${form.codCurrency})`,
                    type: "input",
                    name: "cod_value",
                    value: form.codValue,
                    onChange: handleCodValueChange,
                    keyboardType: "numeric",
                    error: fieldErrors.cod_value,
                    editable: true // Explicitly make sure it's editable
                }
            ]
        });
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {loading ? (
                <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
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
                            />
                        ))}
                        
                        {/* COD Value Update Reason Form */}
                        {codValueChanged && showCodUpdateForm && (
                            <View style={[styles.reasonContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.reasonTitle, { color: colors.text }]}>
                                    {translations[language].tabs.orders.order.codUpdateReason || 'Reason for COD Value Update'}
                                </Text>
                                <TextInput
                                    style={[
                                        styles.reasonInput, 
                                        { 
                                            backgroundColor: colors.background,
                                            borderColor: fieldErrors.cod_value_reason ? colors.error : colors.border,
                                            color: colors.text
                                        }
                                    ]}
                                    placeholder={translations[language].tabs.orders.order.enterReason || 'Enter reason for update'}
                                    placeholderTextColor={colors.textSecondary}
                                    multiline={true}
                                    numberOfLines={3}
                                    value={form.codValueReason}
                                    onChangeText={(text) => {
                                        clearFieldError('cod_value_reason');
                                        setForm(prev => ({ ...prev, codValueReason: text }));
                                    }}
                                />
                                {fieldErrors.cod_value_reason && (
                                    <Text style={styles.errorText}>{fieldErrors.cod_value_reason}</Text>
                                )}
                                <Text style={[styles.reasonNote, { color: colors.textSecondary }]}>
                                    {translations[language].tabs.orders.order.codUpdateNote || 'Note: COD value update requires approval from the sender'}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                    
                    <View style={[styles.buttonContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton, 
                                submitting && styles.submitButtonDisabled,
                                { backgroundColor: submitting ? colors.buttonSecondary : colors.primary }
                            ]}
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
                            style={[styles.cancelButton, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
                            onPress={() => router.back()}
                            disabled={submitting}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
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
                        { backgroundColor: colors.card },
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
                        <Text style={[styles.alertTitle, { color: showAlert.type === 'success' ? colors.success : colors.error }]}>{showAlert.title}</Text>
                        <Text style={[styles.alertMessage, { color: showAlert.type === 'success' ? colors.success : colors.error }]}>{showAlert.message}</Text>
                        <TouchableOpacity
                            style={[
                                styles.alertButton,
                                showAlert.type === 'success' 
                                    ? { backgroundColor: colors.success } 
                                    : { backgroundColor: colors.error }
                            ]}
                            onPress={() => {
                                setShowAlert({ ...showAlert, visible: false });
                                if (showAlert.onClose) showAlert.onClose();
                            }}
                        >
                            <Text style={[styles.alertButtonText, { color: isDark ? colors.text : "#ffff" }]}>
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
    },
    reasonContainer: {
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        borderWidth: 1,
    },
    reasonTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    reasonInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    reasonNote: {
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
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
        marginBottom: 10,
    },
    alertMessage: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    alertButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    alertButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});