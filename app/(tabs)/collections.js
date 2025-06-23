import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import ModalPresentation from "../../components/ModalPresentation";
import { router } from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function Collections({ showModal, setShowModal }) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';

    // Helper for RTL-aware styling
    const getDirectionalStyle = (ltrStyle, rtlStyle) => {
        return isRTL ? rtlStyle : ltrStyle;
    };

    const collections = [
        ["business","entery","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(user.role) ? { visibility: "hidden" } : {
            label: ["driver","delivery_company"].includes(user.role) ? translations[language].tabs.collections.options.driver_own_collections : translations[language].tabs.collections.options.driver_money_collections,
            link: "(collection)?type=driver_money",
            icon: <FontAwesome name="money" size={22} color="#4361EE" />,
            iconBackground: "#EEF2FF",
            iconColor: "#4361EE"
        },
        ["driver","delivery_company","entery","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(user.role) ? { visibility: "hidden" } : {
            label: ["business"].includes(user.role) ? 
                translations[language].tabs.collections.options.my_money_collections : 
                translations[language].tabs.collections.options.business_money_collections,
            link: "(collection)?type=business_money",
            icon: <FontAwesome name="money" size={22} color="#4361EE" />,
            iconBackground: "#EEF2FF",
            iconColor: "#4361EE"
        },
        !["business","entery","support_agent","sales_representative"].includes(user.role) ? {
            label: ["driver","delivery_company"].includes(user.role) ? translations[language].tabs.collections.options.driver_own_sent_collections : translations[language].tabs.collections.options.sent_collections,
            link: "(collection)?type=sent",
            icon: <FontAwesome6 name="money-bill-trend-up" size={22} color="#4361EE" />,
            iconBackground: "#EEF2FF",
            iconColor: "#4361EE"
        } : { visibility: "hidden" },
        ["business","accountant","entery","support_agent","sales_representative"].includes(user.role) ? { visibility: "hidden" } : {
            label:  ["driver","delivery_company"].includes(user.role) ? translations[language].tabs.collections.options.my_returned_collections : translations[language].tabs.collections.options.driver_returned_collections,
            link: "(collection)?type=driver_returned",
            icon: <Octicons name="package-dependencies" size={22} color="#4361EE" />,
            iconBackground: "#EEF2FF",
            iconColor: "#4361EE"
        },
        ["driver","delivery_company","accountant","entery","support_agent","sales_representative"].includes(user.role) ? { visibility: "hidden" } : {
            label: ["business"].includes(user.role) ? 
                translations[language].tabs.collections.options.my_returned_collections : 
                translations[language].tabs.collections.options.business_returned_collections,
            link: "(collection)?type=business_returned",
            icon: <Octicons name="package-dependencies" size={22} color="#4361EE" />,
            iconBackground: "#EEF2FF",
            iconColor: "#4361EE"
        },
        user.role !== "business" ? {
            label: translations[language].tabs.collections.options.runsheet_collections,
            link: "(collection)?type=dispatched",
            icon: <Feather name="truck" size={22} color="#4361EE" />,
            iconBackground: "#EEF2FF", 
            iconColor: "#4361EE"
        } : { visibility: "hidden" }
    ].filter(item => item.visibility !== "hidden");

    return (
        <ModalPresentation
            showModal={showModal}
            setShowModal={setShowModal}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {translations[language].tabs.collections.title || "Collections"}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.closeHeaderButton,
                            getDirectionalStyle(
                                { right: 16 },
                                { left: 16 }
                            )
                        ]}
                        onPress={() => setShowModal(false)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="x" size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Collection Options */}
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    {collections.map((collection, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.itemContainer,
                                index === collections.length - 1 && styles.lastItem
                            ]}
                            onPress={() => {
                                router.push(collection.link);
                                setShowModal(false);
                            }}
                            activeOpacity={0.7}
                        >
                            {/* Icon */}
                            <View style={[
                                styles.iconContainer,
                                { backgroundColor: collection.iconBackground }
                            ]}>
                                {collection.icon}
                            </View>
                            
                            {/* Text */}
                            <View style={styles.textContainer}>
                                <Text style={[
                                    styles.itemLabel
                                ]}>
                                    {collection.label}
                                </Text>
                                {collection.description && (
                                    <Text style={[
                                        styles.itemDescription
                                    ]}>
                                        {collection.description}
                                    </Text>
                                )}
                            </View>
                            
                            {/* Arrow */}
                            <View>
                                <Feather
                                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                                    size={20}
                                    color="#94A3B8"
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Bottom Button */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setShowModal(false)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {translations[language].tabs.collections.close || "Close"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ModalPresentation>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        position: 'relative',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
    },
    closeHeaderButton: {
        position: 'absolute',
        top: 16,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitleContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    scrollView: {
        maxHeight: '100%',
    },
    scrollContent: {
        paddingBottom: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        gap:15,
        borderBottomColor: '#F1F5F9',
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        textAlign:'left'
    },
    itemDescription: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    bottomContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    button: {
        backgroundColor: '#4361EE',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});