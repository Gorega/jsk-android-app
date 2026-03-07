import { TouchableOpacity, Text, Linking, StyleSheet, View, Platform, Alert } from "react-native";
import ModalPresentation from "../../ModalPresentation";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from "react";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';
import { useAuth } from '../../../RootLayout';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import { getToken } from "../../../utils/secureStore";

export default function Contact({ contact, orderId, companyType = 'taiar' }) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const isRTL = language === 'ar' || language === 'he';
    const [showContactModal, setShowContactModal] = useState(false);
    const [showWhatsappOptions, setShowWhatsappOptions] = useState(false);
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [showLanguageSelectionModal, setShowLanguageSelectionModal] = useState(false);
    const [selectedMessageLanguage, setSelectedMessageLanguage] = useState(null);
    const [deliveryDay, setDeliveryDay] = useState('today');
    const [remoteMessage, setRemoteMessage] = useState(null);
    const [remoteMessageLoading, setRemoteMessageLoading] = useState(false);
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [branchCode, setBranchCode] = useState(user?.branch_code || user?.branchCode || null);
    
    // Check if user is driver or delivery company
    const isDriverOrDeliveryCompany = user && ['driver', 'delivery_company'].includes(user.role?.toLowerCase());
    const useJskTemplate = companyType.toLowerCase() === 'jsk' || branchCode?.toUpperCase() === 'T48';

    useEffect(() => {
        setBranchCode(user?.branch_code || user?.branchCode || null);
    }, [user]);

    useEffect(() => {
        if (!user || branchCode) return;
        const branchId = user?.branch_id || user?.branchId;
        if (!branchId) return;
        let cancelled = false;

        const fetchBranchCode = async () => {
            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/branches/${branchId}?language_code=${language}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Accept-Language': language
                    }
                });
                if (!response.ok) return;
                const data = await response.json();
                const code = data?.code || data?.branch?.code || data?.data?.code;
                if (!cancelled && code) {
                    setBranchCode(code);
                }
            } catch (error) {
            }
        };

        fetchBranchCode();
        return () => {
            cancelled = true;
        };
    }, [branchCode, language, user]);

    // Function to record contact history
    const recordContactHistory = async (contactType) => {
        // Only record if user is driver or delivery_company
        if (!user || !['driver', 'delivery_company'].includes(user.role?.toLowerCase()) || !orderId) {
            return;
        }

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}/history/record`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': "en"
                },
                body: JSON.stringify({
                    orderId: orderId,
                    fieldName: contactType,
                    oldValue: '',
                    newValue: `قام السائق بالتواصل مع ${contact.userName} عبر ${contactType}`
                })
            });
            const data = await response.json();
        } catch (error) {
        }
    };

    const fetchRemoteTemplate = async ({ messageLanguage, selectedDay }) => {
        if (!orderId) return null;
        if (!user) return null;

        const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
        const params = {
            order_id: String(orderId),
            language_code: String(language || 'ar'),
            delivery_day: String(selectedDay || deliveryDay || 'today'),
            company_type: String(companyType || 'taiar'),
            ...(messageLanguage ? { message_language: String(messageLanguage) } : {})
        };
        const queryString = (() => {
            try {
                if (typeof URLSearchParams !== 'undefined') {
                    return new URLSearchParams(params).toString();
                }
            } catch (e) {
            }
            return Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== null && String(v).length > 0)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                .join('&');
        })();

        const url = `${baseUrl}/api/orders/message-template?${queryString}`;

        try {
            setRemoteMessageLoading(true);
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': language
            };
            const bearerToken = user?.token || await getToken("userToken").catch(() => null);
            if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers
            });
            const responseText = await response.text();
            let data = null;
            try {
                data = responseText ? JSON.parse(responseText) : null;
            } catch (e) {
                data = null;
            }

            if (!response.ok) {
                return null;
            }
            const message = data?.message;
            if (typeof message === 'string' && message.trim()) {
                setRemoteMessage(message);
                return message;
            }
            return null;
        } catch (e) {
            return null;
        } finally {
            setRemoteMessageLoading(false);
        }
    };

    const fetchRenderTemplateFallback = async ({ messageLanguage, selectedDay }) => {
        if (!user) return null;
        const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
        const url = `${baseUrl}/api/orders/message-template/render?language_code=${encodeURIComponent(String(language || 'ar'))}${messageLanguage ? `&message_language=${encodeURIComponent(String(messageLanguage))}` : ''}`;

        const receiverName = contact.userName || '';
        const senderName = contact.senderName || '';
        const receiverCity = contact.receiverCity || '';
        const receiverAddress = contact.receiverAddress || '';
        const codValue = contact.codValue || contact.cod_value || '';
        const orderReference = contact.orderId || contact.reference || orderId || '';
        const senderId = contact.senderId || contact.sender_id || contact.senderID || null;

        try {
            const bearerToken = user?.token || await getToken("userToken").catch(() => null);
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': language
            };
            if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({
                    delivery_day: String(selectedDay || deliveryDay || 'today'),
                    company_type: String(companyType || 'taiar'),
                    sender_id: senderId,
                    order_id: String(orderId || ''),
                    order_reference: String(orderReference || ''),
                    sender_name: String(senderName || ''),
                    receiver_name: String(receiverName || ''),
                    receiver_city: String(receiverCity || ''),
                    receiver_address: String(receiverAddress || ''),
                    cod_value: String(codValue || '')
                })
            });
            const text = await res.text();
            let data = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                data = null;
            }

            if (!res.ok) return null;
            const message = data?.message;
            if (typeof message === 'string' && message.trim()) {
                setRemoteMessage(message);
                return message;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    // Get message content based on user role
    const getMessageContent = () => {
        if (isDriverOrDeliveryCompany) {
            return contact.msg || remoteMessage || '';
        }
        return contact.msg || '';
    };

    // Show call options when clicking phone icon
    const handlePhoneCall = () => {
        setShowContactModal(true);
    };

    // Track which message option was selected (SMS or WhatsApp)
    const [selectedMessageType, setSelectedMessageType] = useState(null);
    
    // Handle SMS
    const handleSMS = () => {
        setSelectedMessageType('sms');
        setShowContactModal(false);
        
        // For JSK company type, show language selection first
        if (useJskTemplate) {
            setTimeout(() => {
                setShowLanguageSelectionModal(true);
            }, 300);
        } else {
            // For other companies, show day selection directly
            setTimeout(() => {
                setShowMessageOptions(true);
            }, 300);
        }
    };
    
    // Handle actual SMS sending after day selection
    const sendSMS = async (dayOverride) => {
        const selectedDay = dayOverride || deliveryDay;
        const remote = await fetchRemoteTemplate({ messageLanguage: selectedMessageLanguage, selectedDay })
            || await fetchRenderTemplateFallback({ messageLanguage: selectedMessageLanguage, selectedDay });
        const message = (remote || contact.msg || remoteMessage || '').trim();
        if (!message) {
            Alert.alert(
                translations[language]?.common?.error || "Error",
                __DEV__ ? "Template is empty. Check console logs." : (translations[language]?.common?.tryAgain || "Please try again")
            );
            return;
        }
        recordContactHistory('رسالة SMS');
        Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(message)}`);
    };

    // Handle WhatsApp with 972 prefix
    const handleWhatsApp972 = async () => {
        recordContactHistory('whatsapp_972');
        
        // For phone type, don't include auto-message
        // For message type, include auto-message
        const shouldIncludeMessage = selectedMessageType === 'whatsapp' && (useJskTemplate || contact.type !== "phone");
        if (!shouldIncludeMessage) {
            Linking.openURL(`https://wa.me/${`+972${contact.phone}`}`);
        } else {
            const remote = await fetchRemoteTemplate({ messageLanguage: selectedMessageLanguage, selectedDay: deliveryDay })
                || await fetchRenderTemplateFallback({ messageLanguage: selectedMessageLanguage, selectedDay: deliveryDay });
            const message = (remote || contact.msg || remoteMessage || '').trim();
            if (!message) {
                Linking.openURL(`https://wa.me/${`+972${contact.phone}`}`);
                return;
            }
            Linking.openURL(`https://wa.me/${`+972${contact.phone}`}?text=${encodeURIComponent(message)}`);
        }
    };

    // Handle WhatsApp with 970 prefix
    const handleWhatsApp970 = async () => {
        recordContactHistory('whatsapp_970');
        
        // For phone type, don't include auto-message
        // For message type, include auto-message
        const shouldIncludeMessage = selectedMessageType === 'whatsapp' && (useJskTemplate || contact.type !== "phone");
        if (!shouldIncludeMessage) {
            Linking.openURL(`https://wa.me/${`+970${contact.phone}`}`);
        } else {
            const remote = await fetchRemoteTemplate({ messageLanguage: selectedMessageLanguage, selectedDay: deliveryDay })
                || await fetchRenderTemplateFallback({ messageLanguage: selectedMessageLanguage, selectedDay: deliveryDay });
            const message = (remote || contact.msg || remoteMessage || '').trim();
            if (!message) {
                Linking.openURL(`https://wa.me/${`+970${contact.phone}`}`);
                return;
            }
            Linking.openURL(`https://wa.me/${`+970${contact.phone}`}?text=${encodeURIComponent(message)}`);
        }
    };
    
    // Handle selecting delivery day and then showing WhatsApp options
    const selectDayAndShowWhatsapp = async (day) => {
        setDeliveryDay(day);
        setShowMessageOptions(false);
        setRemoteMessage(null);
        await fetchRemoteTemplate({ messageLanguage: selectedMessageLanguage, selectedDay: day });
        setShowWhatsappOptions(true);
    };
    
    // Handle language selection for WhatsApp messages
    const handleLanguageSelect = (lang) => {
        setSelectedMessageLanguage(lang);
        setShowLanguageSelectionModal(false);
        
        // After selecting language, show day selection modal
        setTimeout(() => {
            setShowMessageOptions(true);
        }, 300);
    };
    

    // Handle selecting delivery day and then sending SMS
    const selectDayAndSendSMS = async (day) => {
        setDeliveryDay(day);
        setShowMessageOptions(false);
        setRemoteMessage(null);
        await sendSMS(day);
    };
    
    // Handle transition to WhatsApp options modal
    const handleOpenWhatsappOptions = () => {
        // First close the contact modal
        setShowContactModal(false);
        
        // For phone type, directly show WhatsApp options without day or language selection
        if (contact.type === "phone") {
            setSelectedMessageType(null);
            setTimeout(() => {
                setShowWhatsappOptions(true);
            }, 300);
        } else {
            // For message type, set selected message type
            setSelectedMessageType('whatsapp');
            
            // For JSK company type, show language selection first
            if (useJskTemplate) {
                setTimeout(() => {
                    setShowLanguageSelectionModal(true);
                }, 300);
            } else {
                // For other companies, show day selection first
                setTimeout(() => {
                    setShowMessageOptions(true);
                }, 300);
            }
        }
    };

    return (
        <>
            <TouchableOpacity 
                onPress={() => setShowContactModal(true)}
                style={[styles.contactButton,{
                    backgroundColor: colors.success + '1A'
                }]}
            >
                {contact.type === "phone" ? 
                    <FontAwesome name="phone" size={20} color={colors.success} /> : 
                    <Feather name="message-square" size={20} color={colors.success} />
                }
            </TouchableOpacity>

            {showContactModal && (
                <ModalPresentation
                    showModal={showContactModal}
                    setShowModal={setShowContactModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={[styles.modalContent,{
                        backgroundColor: colors.card
                    }]}>
                        <Text style={[styles.modalTitle,{
                            color: colors.text,
                        ...Platform.select({
                            ios: {
                                textAlign:isRTL ? "left" : ""
                            }
                        }),
                    }]}>
                            {contact.type === "phone" ? translations[language].routes.contactPhone : translations[language].routes.contactMessage}
                        </Text>
                        
                        {/* For phone type: direct call */}
                        {contact.type === "phone" && (
                            <View>
                                <TouchableOpacity
                                style={[styles.modalOption,{
                                    borderBottomColor: colors.border
                                }]}
                                onPress={() => {
                                    recordContactHistory('اتصال هاتفي');
                                    Linking.openURL(`tel:${contact.phone}`);
                                    setShowContactModal(false);
                                }}
                            >
                                <View style={[styles.modalIconContainer,{
                                    backgroundColor: colors.primary
                                }]}>
                                    <FontAwesome name="phone" size={20} color={colors.textInverse} />
                                </View>
                                <Text style={[styles.modalOptionText,{
                                    color: colors.text
                                }]}>
                                {translations[language].tabs.orders.order.userBoxPhoneContactLabel}
                                </Text>
                            </TouchableOpacity>
                            {contact.phone_2 && <TouchableOpacity
                                style={[styles.modalOption,{
                                    borderBottomColor: colors.border
                                }]}
                                onPress={() => {
                                    recordContactHistory('اتصال هاتفي');
                                    Linking.openURL(`tel:${contact.phone_2}`);
                                    setShowContactModal(false);
                                }}
                            >
                                <View style={[styles.modalIconContainer,{
                                    backgroundColor: colors.primary
                                }]}>
                                    <FontAwesome name="phone" size={20} color={colors.textInverse} />
                                </View>
                                <Text style={[styles.modalOptionText,{
                                    color: colors.text
                                }]}>
                                {translations[language].tabs.orders.order.userBoxPhoneContactLabel_2}
                                </Text>
                            </TouchableOpacity>}
                            </View>
                        )}
                        
                        {/* For message type: SMS with day selection */}
                        {/* {contact.type === "message" && (
                            <TouchableOpacity
                                style={[styles.modalOption,{
                                    borderBottomColor: colors.border
                                }]}
                                onPress={() => {
                                    handleSMS();
                                }}
                            >
                                <View style={[styles.modalIconContainer,{
                                    backgroundColor: colors.primary
                                }]}>
                                    <Feather name="message-square" size={20} color={colors.textInverse} />
                                </View>
                                <Text style={[styles.modalOptionText,{
                                    color: colors.text
                                }]}>
                                    {translations[language].tabs.orders.order.contactWhatsapp}
                                </Text>
                            </TouchableOpacity>
                        )} */}
                        
                        {/* WhatsApp option - different behavior based on contact type */}
                        <TouchableOpacity
                            style={[styles.modalOption, styles.withoutBorder,{
                                borderBottomColor: colors.border
                            }]}
                            onPress={handleOpenWhatsappOptions}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {translations[language].tabs.orders.order.contactWhatsapp}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}

            {/* Delivery Day Selection Modal */}
            {showMessageOptions && (
                <ModalPresentation
                    showModal={showMessageOptions}
                    setShowModal={setShowMessageOptions}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={[styles.modalContent, {
                        backgroundColor: colors.card
                    }]}>
                        <Text style={[styles.modalTitle,{
                            color: colors.text,
                            ...Platform.select({
                                ios: {
                                    textAlign:isRTL ? "left" : ""
                                }
                            }),
                        }]}>
                            {translations[language]?.routes?.selectDeliveryDay || "Select Delivery Day"}
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.modalOption,{
                                borderBottomColor: colors.border
                            }]}
                            onPress={() => {
                                // Handle based on which message option was selected
                                if (selectedMessageType === 'sms') {
                                    // If SMS was selected, send SMS with today
                                    selectDayAndSendSMS('today');
                                } else if (selectedMessageType === 'whatsapp') {
                                    // If WhatsApp was selected, show WhatsApp options with today
                                    selectDayAndShowWhatsapp('today');
                                }
                            }}
                        >
                            <View style={[styles.modalIconContainer, {
                                backgroundColor: colors.primary
                            }]}>
                                <Feather name="sun" size={20} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {language === 'he' ? 'היום' : language === 'ar' ? 'اليوم' : 'Today'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, styles.withoutBorder]}
                            onPress={() => {
                                // Handle based on which message option was selected
                                if (selectedMessageType === 'sms') {
                                    // If SMS was selected, send SMS with tomorrow
                                    selectDayAndSendSMS('tomorrow');
                                } else if (selectedMessageType === 'whatsapp') {
                                    // If WhatsApp was selected, show WhatsApp options with tomorrow
                                    selectDayAndShowWhatsapp('tomorrow');
                                }
                            }}
                        >
                            <View style={[styles.modalIconContainer, {
                                backgroundColor: colors.primary
                            }]}>
                                <Feather name="sunrise" size={20} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {language === 'he' ? 'מחר' : language === 'ar' ? 'غدا' : 'Tomorrow'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}
            
            {/* Language Selection Modal for JSK company */}
            {showLanguageSelectionModal && (
                <ModalPresentation
                    showModal={showLanguageSelectionModal}
                    setShowModal={setShowLanguageSelectionModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={[styles.modalContent, {
                        backgroundColor: colors.card
                    }]}>
                        <Text style={[styles.modalTitle,{
                            color: colors.text,
                            ...Platform.select({
                                ios: {
                                    textAlign:isRTL ? "left" : ""
                                }
                            }),
                        }]}>
                            {translations[language]?.routes?.selectLanguage || "Select Message Language"}
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.modalOption,{
                                borderBottomColor: colors.border
                            }]}
                            onPress={() => handleLanguageSelect('ar')}
                        >
                            <View style={[styles.modalIconContainer,{
                                backgroundColor: colors.primary
                            }]}>
                                <Text style={{ color: colors.textInverse, fontSize: 16, fontWeight: 'bold' }}>ع</Text>
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                العربية (Arabic)
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, styles.withoutBorder]}
                            onPress={() => handleLanguageSelect('he')}
                        >
                            <View style={[styles.modalIconContainer,{
                                backgroundColor: colors.primary
                            }]}>
                                <Text style={{ color: colors.textInverse, fontSize: 16, fontWeight: 'bold' }}>עב</Text>
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                עברית (Hebrew)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}
            
            {/* WhatsApp Options Modal */}
            {showWhatsappOptions && (
                <ModalPresentation
                    showModal={showWhatsappOptions}
                    setShowModal={setShowWhatsappOptions}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={[styles.modalContent, {
                        backgroundColor: colors.card
                    }]}>
                        <Text style={[styles.modalTitle,{
                            color: colors.text,
                        ...Platform.select({
                            ios: {
                                textAlign:isRTL ? "left" : ""
                            }
                        }),
                    }]}>
                            {translations[language].tabs.orders.order.whatsapp} {contact.label}
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.modalOption,{
                                borderBottomColor: colors.border
                            }]}
                            onPress={() => {
                                handleWhatsApp972();
                                setShowWhatsappOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {`+972${contact.phone}`}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, styles.withoutBorder]}
                            onPress={() => {
                                handleWhatsApp970();
                                setShowWhatsappOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {`+970${contact.phone}`}
                            </Text>
                        </TouchableOpacity>

                       {contact.phone_2 &&  <TouchableOpacity
                            style={[styles.modalOption, styles.withoutBorder]}
                            onPress={() => {
                                handleWhatsApp970();
                                setShowWhatsappOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {`+970${contact.phone_2}`}
                            </Text>
                        </TouchableOpacity>}

                       {contact.phone_2 &&  <TouchableOpacity
                            style={[styles.modalOption, styles.withoutBorder]}
                            onPress={() => {
                                handleWhatsApp970();
                                setShowWhatsappOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color={colors.textInverse} />
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {`+970${contact.phone_2}`}
                            </Text>
                        </TouchableOpacity>}
                    </View>
                </ModalPresentation>
            )}
       </>
    );
}

const styles = StyleSheet.create({
    contactButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        padding: 16,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "600",
        marginBottom: 16,
        color: '#333333',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    modalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    whatsappIcon: {
        backgroundColor: '#25D366',
    },
    modalOptionText: {
        fontSize: 15,
        color: '#333333',
    },
    withoutBorder: {
        borderBottomWidth: 0,
    },
});
