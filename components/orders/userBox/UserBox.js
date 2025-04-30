import { View, Text, StyleSheet } from "react-native";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Contact from "./Contact";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';

export default function BusinessBox({ box }) {
    const { language } = useLanguage();
    const isRTL = ["he", "ar"].includes(language);

    return (
        <View style={styles.container}>
            <View style={[styles.contentRow, isRTL && styles.contentRowRTL]}>
                <View style={[styles.userInfo, isRTL && styles.userInfoRTL]}>
                    <View style={styles.iconContainer}>
                        <SimpleLineIcons name="user" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.labelText, isRTL && styles.textRTL]}>{box.label}</Text>
                        <Text style={[styles.valueText, isRTL && styles.textRTL]}>{box.userName}</Text>
                    </View>
                </View>
                <View style={[styles.contactActions, isRTL && styles.contactActionsRTL]}>
                    <Contact
                        contact={{
                            type: "phone",
                            label: translations[language].tabs.orders.order.userBoxPhoneContactLabel,
                            phone: box.phone,
                            msg: ""
                        }}
                    />
                    <Contact
                        contact={{
                            type: "msg",
                            label: translations[language].tabs.orders.order.userBoxMessageContactLabel,
                            phone: box.phone,
                            msg: ""
                        }}
                    />
                </View>
            </View>
        </View>
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
    contentRowRTL: {
        flexDirection: 'row-reverse',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap:12,
        flex: 1,
    },
    userInfoRTL: {
        flexDirection: 'row-reverse',
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
    textRTL: {
        textAlign: 'right',
    },
    contactActions: {
        flexDirection: 'row',
        gap: 16,
    },
    contactActionsRTL: {
        flexDirection: 'row-reverse',
    },
});