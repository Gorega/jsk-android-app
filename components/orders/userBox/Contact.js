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

export default function Contact({ contact, orderId, companyType = 'jsk' }) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const isRTL = language === 'ar' || language === 'he';
    const [showContactModal, setShowContactModal] = useState(false);
    const [showWhatsappOptions, setShowWhatsappOptions] = useState(false);
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [showLanguageSelectionModal, setShowLanguageSelectionModal] = useState(false);
    const [selectedMessageLanguage, setSelectedMessageLanguage] = useState(null);
    const [deliveryDay, setDeliveryDay] = useState('today');
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
        }
    };

    // Generate WhatsApp message template with dynamic order data
    const generateWhatsAppMessage = (messageLanguage = null) => {
        // Extract all available data with fallbacks
        const receiverName = contact.userName || '';
        const orderReference = contact.orderId || contact.reference || '';
        // Use external_sender_name if available, otherwise use sender_name
        const senderName = contact.senderName || '';
        const receiverCity = contact.receiverCity || '';
        const receiverAddress = contact.receiverAddress || '';
        const codValue = contact.codValue || contact.cod_value || '';
        const driverName = user?.name || '';

        
        // Get company display name
        const companyDisplayName = companyType.toLowerCase() === 'jsk' ? 'JSK Logistics' : 'طيار';
        
        // For JSK company, handle language selection
        if (companyType.toLowerCase() === 'jsk') {
            // Arabic day format
            const arDay = deliveryDay === 'today' ? 'اليوم' : 'غدا';
            
            // Hebrew day format
            const heDay = deliveryDay === 'today' ? 'היום' : 'מחר';
            
            // Format address for Arabic
            const arAddress = `${receiverCity}, ${receiverAddress}`;
            
            // Format address for Hebrew - reverse order for RTL
            const heAddress = `${receiverAddress}, ${receiverCity}`;
            
            // Arabic message
            const arMessage = `${companyDisplayName} – إشعار توصيل – في الطريق إليك\n\n` +
                `مرحباً،\n` +
                `معك ${companyDisplayName} للتوصيل 🚚\n\n` +
                `نود إعلامك بأن طلبيتك في طريقها إليك حالياً 🚗💨\n\n` +
                `👤 الاسم: ${receiverName}\n` +
                `📍 المنطقة: ${arAddress}\n` +
                `💰 سعر الطلبية: ${codValue}\n` +
                `👤 التاجر: ${senderName}\n` +
                `🔢 رقم الباركود: ${orderReference}\n\n` +
                `✨ ملاحظة: سأكون في منطقتكم ${arDay}، وسأرسل لكم رسالة قبل الوصول بـ 30 دقيقة لطلب موقعكم.\n` +
                `نرجو التعاون معنا وإرسال موقعكم لتسهيل وصول المندوب إليكم.\n\n` +
                `شكراً لاختياركم خدماتنا.\n` +
                `مع تحياتي،\n` +
                `${companyDisplayName}`;
            
            // Hebrew message
            const heMessage = `${companyDisplayName} – הודעת משלוח – בדרך אליך\n\n` +
                `שלום,\n` +
                `עם ${companyDisplayName} למשלוחים 🚚\n\n` +
                `נשמח להודיעך שההזמנה שלך בדרך אליך 🚗💨\n\n` +
                `👤 שם: ${receiverName}\n` +
                `📍 אזור: ${heAddress}\n` +
                `💰 מחיר ההזמנה: ${codValue}\n` +
                `👤 סוחר: ${senderName}\n` +
                `🔢 מספר ברקוד: ${orderReference}\n\n` +
                `✨ הערה: אהיה באזורכם ${heDay}, ואשלח הודעה 30 דקות לפני ההגעה כדי לבקש את מיקומכם.\n` +
                `נודה לשיתוף הפעולה ושליחת מיקומכם להקל על הגעת השליח.\n\n` +
                `תודה שבחרתם בשירותינו.\n` +
                `${companyDisplayName}`;
            
            // Return based on selected language
            if (messageLanguage === 'ar') {
                return arMessage;
            } else if (messageLanguage === 'he') {
                return heMessage;
            } else {
                // Default behavior if no language is selected (shouldn't happen with the new UI)
                return `${arMessage}\n\n---\n\n${heMessage}`;
            }
        }
        
        // For other companies, use language-specific templates
        if (language === 'ar') {
            const arDay = deliveryDay === 'today' ? 'اليوم' : 'غدا';
            
            return `عزيزي الزبون (${receiverName}), لديك طرد مرسل من ${senderName} بقيمة ${codValue} شيكل, حالياً موجود لدى شركة ${companyDisplayName} للتوصيل, سوف يصلك ${arDay}, يرجى ارسال الموقع أو العنوان بالتفصيل على هذا الرقم من أجل تسهيل عملية الاستلام, وشكراً لتعاونك.\nملاحظة هامة: ممنوع قياس الملابس والاحذية او تجربة الاجهزة الكهربائية والكريمات وشكرا`;

        } else if (language === 'he') {
            // Hebrew day format
            const heDay = deliveryDay === 'today' ? 'היום' : 'מחר';
            
            // Format address for Hebrew - reverse order for RTL
            const heAddress = `${receiverAddress}, ${receiverCity}`;
            
            return `${companyDisplayName} – הודעת משלוח – בדרך אליך\n\n` +
                `שלום,\n` +
                `עם ${companyDisplayName} למשלוחים 🚚\n\n` +
                `נשמח להודיעך שההזמנה שלך בדרך אליך 🚗💨\n\n` +
                `👤 שם: ${receiverName}\n` +
                `📍 אזור: ${heAddress}\n` +
                `💰 מחיר ההזמנה: ${codValue}\n` +
                `👤סוחר: ${senderName}\n` +
                `🔢 מספר ברקוד: ${orderReference}\n\n` +
                `✨ הערה: אהיה באזורכם ${heDay}, ואשלח הודעה 30 דקות לפני ההגעה כדי לבקש את מיקומכם.\n` +
                `נודה לשיתוף הפעולה ושליחת מיקומכם להקל על הגעת השליח.\n\n` +
                `תודה שבחרתם בשירותינו.\n` +
                `${companyDisplayName}`;
        } else { // English
            // English day format
            const enDay = deliveryDay === 'today' ? 'today' : 'tomorrow';
            
            // Format address for English
            const enAddress = `${receiverCity}, ${receiverAddress}`;
            
            return `${companyDisplayName} - Delivery Notification - On the way to you\n\n` +
                `Hello,\n` +
                `This is ${companyDisplayName} Delivery 🚚\n\n` +
                `We would like to inform you that your order is on its way to you now 🚗💨\n\n` +
                `👤 Name: ${receiverName}\n` +
                `📍 Area: ${enAddress}\n` +
                `💰 Order price: ${codValue}\n` +
                `👤 Seller: ${senderName}\n` +
                `� Barcode number: ${orderReference}\n\n` +
                `✨ Note: I will be in your area ${enDay}, and will send you a message 30 minutes before arrival to request your location.\n` +
                `Please cooperate with us and send your location to facilitate the driver's arrival.\n\n` +
                `Thank you for choosing our services.\n` +
                `${companyDisplayName}`;
        }
    };

    // Get message content based on user role
    const getMessageContent = () => {
        if (isDriverOrDeliveryCompany) {
            return contact.msg || generateWhatsAppMessage(selectedMessageLanguage);
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
        if (companyType.toLowerCase() === 'jsk') {
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
    const sendSMS = () => {
        recordContactHistory('رسالة SMS');
        // Use selected language for JSK company type
        const message = companyType.toLowerCase() === 'jsk' ? 
            generateWhatsAppMessage(selectedMessageLanguage) : 
            getMessageContent();
        Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(message)}`);
    };

    // Handle WhatsApp with 972 prefix
    const handleWhatsApp972 = () => {
        recordContactHistory('whatsapp_972');
        
        // For phone type, don't include auto-message
        // For message type, include auto-message
        if (contact.type === "phone") {
            Linking.openURL(`https://wa.me/${`+972${contact.phone}`}`);
        } else {
            // Use selected language for JSK company type
            const message = companyType.toLowerCase() === 'jsk' ? 
                generateWhatsAppMessage(selectedMessageLanguage) : 
                getMessageContent();
            Linking.openURL(`https://wa.me/${`+972${contact.phone}`}?text=${encodeURIComponent(message)}`);
        }
    };

    // Handle WhatsApp with 970 prefix
    const handleWhatsApp970 = () => {
        recordContactHistory('whatsapp_970');
        
        // For phone type, don't include auto-message
        // For message type, include auto-message
        if (contact.type === "phone") {
            Linking.openURL(`https://wa.me/${`+970${contact.phone}`}`);
        } else {
            // Use selected language for JSK company type
            const message = companyType.toLowerCase() === 'jsk' ? 
                generateWhatsAppMessage(selectedMessageLanguage) : 
                getMessageContent();
            Linking.openURL(`https://wa.me/${`+970${contact.phone}`}?text=${encodeURIComponent(message)}`);
        }
    };
    
    // Handle selecting delivery day and then showing WhatsApp options
    const selectDayAndShowWhatsapp = (day) => {
        setDeliveryDay(day);
        setShowMessageOptions(false);
        
        setTimeout(() => {
            setShowWhatsappOptions(true);
        }, 300);
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
    const selectDayAndSendSMS = (day) => {
        setDeliveryDay(day);
        setShowMessageOptions(false);
        
        setTimeout(() => {
            sendSMS();
        }, 300);
    };
    
    // Handle transition to WhatsApp options modal
    const handleOpenWhatsappOptions = () => {
        // First close the contact modal
        setShowContactModal(false);
        
        // For phone type, directly show WhatsApp options without day selection
        if (contact.type === "phone") {
            setTimeout(() => {
                // Show WhatsApp options directly without auto-message
                setShowWhatsappOptions(true);
            }, 300);
        } else {
            // For message type, set selected message type
            setSelectedMessageType('whatsapp');
            
            // For JSK company type, show language selection first
            if (companyType.toLowerCase() === 'jsk') {
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