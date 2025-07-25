import { View, Text, StyleSheet,Platform } from "react-native";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Contact from "./Contact";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';
import { RTLWrapper } from '../../../utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import { useEffect, useState } from "react";

export default function BusinessBox({ box, orderId }) {
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [orderData, setOrderData] = useState(null);

    // Fetch order data if orderId is available
    useEffect(() => {
        const fetchOrderData = async () => {
            if (!orderId) return;
            
            try {
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${orderId}?language_code=${language}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    }
                });
                const data = await res.json();
                setOrderData(data);
            } catch (error) {
                console.error("Error fetching order data:", error);
            }
        };
        
        fetchOrderData();
    }, [orderId, language]);

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
                            userName: box.userName,
                            msg: "",
                            orderId: orderId,
                            businessName: orderData?.sender || "طيار للتوصيل",
                            codValue: orderData?.cod_values?.[0]?.value || "",
                            currency: orderData?.cod_values?.[0]?.currency || "₪"
                        }}
                        orderId={orderId}
                    />
                    <Contact
                        contact={{
                            type: "msg",
                            label: translations[language].tabs.orders.order.userBoxMessageContactLabel,
                            phone: box.phone,
                            userName: box.userName,
                            msg: "",
                            orderId: orderId,
                            businessName: orderData?.sender || "طيار للتوصيل",
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