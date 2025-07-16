import { TouchableOpacity, Text, Linking, StyleSheet, View, Platform } from "react-native";
import ModalPresentation from "../../ModalPresentation";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { useState } from "react";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';
import { useAuth } from '../../../RootLayout';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';

export default function Contact({ contact, orderId }) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const isRTL = language === 'ar' || language === 'he';
    const [showContactModal, setShowContactModal] = useState(false);
    const [showWhatsappOptions, setShowWhatsappOptions] = useState(false);
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    // Check if user is driver or delivery company
    const isDriverOrDeliveryCompany = user && ['driver', 'delivery_company'].includes(user.role?.toLowerCase());

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
            console.error('Error recording contact history:', error);
        }
    };

    // Generate WhatsApp message template with dynamic order data
    const generateWhatsAppMessage = () => {
        // Extract all available data with fallbacks
        const receiverName = contact.userName || '';
        const orderReference = contact.orderId || contact.reference || '';
        const businessName = contact.businessName || user?.business?.name || 'طيار للتوصيل';
        const codValue = contact.codValue || contact.cod_value || '';
        const currency = contact.currency || '';
        const deliveryDate = contact.deliveryDate || 'اليوم';
        const senderName = contact.senderName || contact.sender?.name || '';
        
        // Create message based on language
        if (language === 'ar' || language === 'he') {
            return `مرحبا ${receiverName}، منحكي معك من شركة طيار للتوصيل سنقوم بتوصيل طردكم (${orderReference})${codValue ? ` بقيمة ${codValue}${currency}` : ''} من (${businessName}) ${deliveryDate}... الرجاء ارسال موقعكم واسم البلد لتاكيد وصول طلبكم (لا يمكن تحديد ساعات لوصول الطلبيه بسبب حركه السير وظروف اخرى) عدم الرد على هذه الرساله يؤدي الى تاجيل`;
        } else {
            return `Hello ${receiverName}, this is Taiar delivery service. We will deliver your package (${orderReference})${codValue ? ` with value ${codValue}${currency}` : ''} from (${businessName}) ${deliveryDate}. Please send your location and city name to confirm your order delivery (delivery time cannot be specified due to traffic and other conditions). Not responding to this message will lead to postponement.`;
        }
    };

    // Get message content based on user role
    const getMessageContent = () => {
        if (isDriverOrDeliveryCompany) {
            return contact.msg || generateWhatsAppMessage();
        }
        return contact.msg || '';
    };

    // Handle phone call
    const handlePhoneCall = () => {
        recordContactHistory('اتصال هاتفي');
        Linking.openURL(`tel:${contact.phone}`);
    };

    // Handle SMS
    const handleSMS = () => {
        recordContactHistory('رسالة SMS');
        Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(getMessageContent())}`);
    };

    // Handle WhatsApp with 972 prefix
    const handleWhatsApp972 = () => {
        recordContactHistory('whatsapp_972');
        Linking.openURL(`https://wa.me/${`+972${contact.phone}`}?text=${encodeURIComponent(getMessageContent())}`);
    };

    // Handle WhatsApp with 970 prefix
    const handleWhatsApp970 = () => {
        recordContactHistory('whatsapp_970');
        Linking.openURL(`https://wa.me/${`+970${contact.phone}`}?text=${encodeURIComponent(getMessageContent())}`);
    };

    // Handle transition to WhatsApp options modal
    const handleOpenWhatsappOptions = () => {
        // First close the contact modal, then open WhatsApp options modal
        setShowContactModal(false);
        
        // Add a small delay before showing the WhatsApp options modal
        // This ensures the first modal has time to close properly
        setTimeout(() => {
            setShowWhatsappOptions(true);
        }, 300);
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
                            {contact.label}
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.modalOption,{
                                borderBottomColor: colors.border
                            }]}
                            onPress={() => {
                                if (contact.type === "phone") {
                                    handlePhoneCall();
                                } else {
                                    handleSMS();
                                }
                                setShowContactModal(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer,{
                                backgroundColor: colors.primary
                            }]}>
                                {contact.type === "phone" 
                                    ? <FontAwesome name="phone" size={20} color={colors.textInverse} /> 
                                    : <Feather name="message-square" size={20} color={colors.textInverse} />
                                }
                            </View>
                            <Text style={[styles.modalOptionText,{
                                color: colors.text
                            }]}>
                                {translations[language].tabs.orders.order.contactPhone} {contact.label}
                            </Text>
                        </TouchableOpacity>
                        
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
                                {translations[language].tabs.orders.order.contactWhatsapp} {contact.label}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}

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
                            {translations[language].tabs.orders.order.contactWhatsapp} {contact.label}
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