import { View, Text, StyleSheet,Platform } from "react-native";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Contact from "./Contact";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';
import { RTLWrapper } from '../../../utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';

/**
 * UserBox component - displays user contact information
 * @param {object} box - Contains label, userName, phone
 * @param {string} orderId - Order ID for contact context
 * @param {object} orderData - Full order data (passed from parent to avoid extra API calls)
 */
export default function BusinessBox({ box, orderId, orderData }) {
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    return (
        <RTLWrapper>
            <View style={[styles.container,{
                borderBottomColor: colors.border
            }]}>
            <View style={[styles.contentRow]}>
                <View style={styles.userInfo}>
                    <View style={[styles.iconContainer,{
                        backgroundColor: colors.primary
                    }]}>
                        <SimpleLineIcons name="user" size={20} color={colors.textInverse} />
                    </View>
                    <View style={[styles.textContainer,{
                         ...Platform.select({
                            ios: {
                                alignItems:isRTL ? "flex-start" : ""
                            }
                        }),
                    }]}>
                        <Text style={[styles.labelText,{
                            color: colors.textSecondary
                        }]}>{box.label}</Text>
                        <Text style={[styles.valueText,{
                            textAlign: isRTL ? "left" : "left",
                            color: colors.text
                        }]}>{box.userName}</Text>
                    </View>
                </View>
                <View style={[styles.contactActions]}>
                    <Contact
                        contact={{
                            type: "phone",
                            label: translations[language].tabs.orders.order.userBoxPhoneContactLabel,
                            phone: box.phone,
                            phone_2: box.phone_2,
                            userName: box.userName,
                            msg: "",
                            orderId: orderId,
                            senderName: orderData?.external_sender_name ? orderData?.external_sender_name : orderData?.sender,
                            receiverCity: orderData?.receiver_city || "",
                            receiverAddress: orderData?.receiver_address || "",
                            codValue: orderData?.cod_values?.[0]?.value || "",
                            currency: orderData?.cod_values?.[0]?.currency || "₪"
                        }}
                        orderId={orderId}
                    />
                    <Contact
                        contact={{
                            type: "message",
                            label: translations[language].tabs.orders.order.userBoxMessageContactLabel,
                            phone: box.phone,
                            phone_2: box.phone_2,
                            userName: box.userName,
                            msg: "",
                            orderId: orderId,
                            receiverCity: orderData?.receiver_city || "",
                            receiverAddress: orderData?.receiver_address || "",
                            senderName: orderData?.external_sender_name ? orderData?.external_sender_name : orderData?.sender,
                            codValue: orderData?.cod_values?.[0]?.value || "",
                            currency: orderData?.cod_values?.[0]?.currency || "₪"
                        }}
                        orderId={orderId}
                    />
                </View>
            </View>
        </View>
        </RTLWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap:12,
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        backgroundColor: '#4361EE',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    labelText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 3,
    },
    valueText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    contactActions: {
        flexDirection: 'row',
        gap: 16,
    },
    contactActionsRTL: {
        flexDirection: 'row-reverse',
    }
});