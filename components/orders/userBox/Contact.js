import { TouchableOpacity, Text, Linking, StyleSheet, View } from "react-native";
import ModalPresentation from "../../ModalPresentation";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { useState } from "react";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';

export default function Contact({ contact }) {
    const { language } = useLanguage();
    const [showContactModal, setShowContactModal] = useState(false);
    const [showWhatsappOptions, setShowWhatsappOptions] = useState(false);
    const isRTL = ["he", "ar"].includes(language);

    return (
        <>
            <TouchableOpacity 
                onPress={() => setShowContactModal(true)}
                style={styles.contactButton}
            >
                {contact.type === "phone" ? 
                    <FontAwesome name="phone" size={20} color="#22c55e" /> : 
                    <Feather name="message-square" size={20} color="#22c55e" />
                }
            </TouchableOpacity>

            {showContactModal && (
                <ModalPresentation
                    showModal={showContactModal}
                    setShowModal={setShowContactModal}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={styles.modalContent}>
                        <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
                            {contact.label}
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, isRTL && styles.modalOptionRTL]}
                            onPress={() => Linking.openURL(
                                contact.type === "phone" 
                                    ? `tel:${contact.phone}` 
                                    : `sms:${contact.phone}?body=${encodeURIComponent(contact.msg)}`
                            )}
                        >
                            <View style={styles.modalIconContainer}>
                                {contact.type === "phone" 
                                    ? <FontAwesome name="phone" size={20} color="#ffffff" /> 
                                    : <Feather name="message-square" size={20} color="#ffffff" />
                                }
                            </View>
                            <Text style={[styles.modalOptionText, isRTL && styles.textRTL]}>
                                {translations[language].tabs.orders.order.contactPhone} {contact.label}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, isRTL && styles.modalOptionRTL, styles.withoutBorder]}
                            onPress={() => setShowWhatsappOptions(true)}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                            </View>
                            <Text style={[styles.modalOptionText, isRTL && styles.textRTL]}>
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
                    <View style={styles.modalContent}>
                        <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
                            {translations[language].tabs.orders.order.contactWhatsapp} {contact.label}
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, isRTL && styles.modalOptionRTL]}
                            onPress={() => Linking.openURL(
                                `https://wa.me/${`+972${contact.phone}`}?text=${encodeURIComponent(contact.msg)}`
                            )}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                            </View>
                            <Text style={[styles.modalOptionText, isRTL && styles.textRTL]}>
                                {`+972${contact.phone}`}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalOption, isRTL && styles.modalOptionRTL, styles.withoutBorder]}
                            onPress={() => Linking.openURL(
                                `https://wa.me/${`+970${contact.phone}`}?text=${encodeURIComponent(contact.msg)}`
                            )}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                            </View>
                            <Text style={[styles.modalOptionText, isRTL && styles.textRTL]}>
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
    modalOptionRTL: {
        flexDirection: 'row-reverse',
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
    textRTL: {
        textAlign: 'right',
    },
    withoutBorder: {
        borderBottomWidth: 0,
    },
});