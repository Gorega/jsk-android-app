import { TouchableOpacity, Text, StyleSheet, ScrollView, View, Platform } from "react-native";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from "expo-router";
import ModalPresentation from "../../components/ModalPresentation";
import { useState } from "react";
import { deleteToken } from "../../utils/secureStore";
import { useAuth } from "../_layout";

export default function Settings() {
    const { language, setLanguage } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const { setIsAuthenticated, user } = useAuth();

    const settings = [
        (["admin", "manager"].includes(user.role)) ? {
            label: translations[language].tabs.settings.options.users,
            onPress: () => router.push("(users)"),
            icon: <FontAwesome name="user-o" size={22} color="#4361EE" />
        } : null,
        (["manager", "admin", "business"].includes(user.role)) ? {
            label: translations[language].tabs.settings.options.complaints,
            onPress: () => router.push("(complaints)"),
            icon: <MaterialIcons name="fmd-bad" size={22} color="#4361EE" />
        } : null,
        {
            label: translations[language].tabs.settings.options.language.title,
            onPress: () => setShowLanguageModal(true),
            icon: <MaterialIcons name="language" size={22} color="#4361EE" />,
            value: language.toUpperCase()
        },
        {
            label: translations[language].tabs.settings.options.changePassword,
            onPress: () => router.push("(change_password)"),
            icon: <AntDesign name="lock" size={22} color="#4361EE" />
        },
        {
            label: translations[language].tabs.settings.options.contactUs,
            onPress: () => router.push("(contact_us)"),
            icon: <Entypo name="phone" size={22} color="#4361EE" />
        },
        {
            label: translations[language].tabs.settings.options.aboutUs,
            onPress: () => router.push("(info)"),
            icon: <MaterialCommunityIcons name="information-outline" size={22} color="#4361EE" />
        },
        {
            label: translations[language].tabs.settings.options.logout,
            onPress: async () => {
                await deleteToken("userToken");
                setIsAuthenticated(false);
                router.replace("(auth)");
            },
            icon: <MaterialIcons name="logout" size={22} color="#EF4444" />,
            danger: true
        }
    ].filter(Boolean); // Remove null values

    const handleLanguageChange = async (newLang) => {
        await setLanguage(newLang);
        setShowLanguageModal(false);
    };

    return (
        <View style={styles.container}>
            {/* User Info Card */}
            <View style={[styles.userCard,{ flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userRole}>{user.role}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Settings Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{translations[language].tabs.settings?.preferences}</Text>
                </View>

                {settings.slice(0, 3).map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.item,
                            { flexDirection: isRTL ? "row-reverse" : "row" }
                        ]}
                        onPress={item?.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconContainer,
                            isRTL ? { marginLeft: 12 } : { marginRight: 12 }
                        ]}>
                            {item?.icon}
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={[
                                styles.itemLabel,
                                { textAlign: isRTL ? "right" : "left" }
                            ]}>
                                {item?.label}
                            </Text>
                        </View>
                        {item.value && (
                            <View style={[
                                styles.valueContainer,
                                isRTL ? { marginRight: 'auto' } : { marginLeft: 'auto' }
                            ]}>
                                <Text style={styles.valueText}>{item.value}</Text>
                            </View>
                        )}
                        <MaterialIcons 
                            name={isRTL ? "chevron-left" : "chevron-right"} 
                            size={24} 
                            color="#94A3B8" 
                            style={isRTL ? { marginRight: 'auto' } : { marginLeft: 'auto' }}
                        />
                    </TouchableOpacity>
                ))}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{translations[language].tabs.settings.support}</Text>
                </View>

                {settings.slice(3, 7).map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.item,
                            { flexDirection: isRTL ? "row-reverse" : "row" }
                        ]}
                        onPress={item?.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconContainer,
                            isRTL ? { marginLeft: 12 } : { marginRight: 12 }
                        ]}>
                            {item?.icon}
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={[
                                styles.itemLabel,
                                { textAlign: isRTL ? "right" : "left" }
                            ]}>
                                {item?.label}
                            </Text>
                        </View>
                        <MaterialIcons 
                            name={isRTL ? "chevron-left" : "chevron-right"} 
                            size={24} 
                            color="#94A3B8" 
                            style={isRTL ? { marginRight: 'auto' } : { marginLeft: 'auto' }}
                        />
                    </TouchableOpacity>
                ))}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{translations[language].tabs.settings.account}</Text>
                </View>
                
                <TouchableOpacity
                    style={[
                        styles.item,
                        styles.dangerItem,
                        { flexDirection: isRTL ? "row-reverse" : "row" }
                    ]}
                    onPress={settings[7]?.onPress}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.iconContainer,
                        styles.dangerIconContainer,
                        isRTL ? { marginLeft: 12 } : { marginRight: 12 }
                    ]}>
                        {settings[7]?.icon}
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={[
                            styles.itemLabel,
                            styles.dangerLabel,
                            { textAlign: isRTL ? "right" : "left" }
                        ]}>
                            {settings[7]?.label}
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {showLanguageModal && (
                <ModalPresentation 
                    showModal={showLanguageModal} 
                    setShowModal={setShowLanguageModal}
                    onDismiss={() => setShowLanguageModal(false)}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {translations[language].tabs.settings.options.language.title}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            language === 'ar' && styles.activeLanguage
                        ]}
                        onPress={() => handleLanguageChange('ar')}
                    >
                        <Text style={[
                            styles.languageText, 
                            language === 'ar' && styles.activeLanguageText,
                            { textAlign: isRTL ? "right" : "left" }
                        ]}>
                            {translations[language].tabs.settings.options.language.options.ar}
                        </Text>
                        {language === 'ar' && (
                            <Ionicons name="checkmark-circle" size={20} color="#4361EE" />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            language === 'en' && styles.activeLanguage
                        ]}
                        onPress={() => handleLanguageChange('en')}
                    >
                        <Text style={[
                            styles.languageText,
                            language === 'en' && styles.activeLanguageText,
                            { textAlign: isRTL ? "right" : "left" }
                        ]}>
                            {translations[language].tabs.settings.options.language.options.en}
                        </Text>
                        {language === 'en' && (
                            <Ionicons name="checkmark-circle" size={20} color="#4361EE" />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            language === 'he' && styles.activeLanguage,
                            { borderBottomWidth: 0 }
                        ]}
                        onPress={() => handleLanguageChange('he')}
                    >
                        <Text style={[
                            styles.languageText,
                            language === 'he' && styles.activeLanguageText,
                            { textAlign: isRTL ? "right" : "left" }
                        ]}>
                            {translations[language].tabs.settings.options.language.options.he}
                        </Text>
                        {language === 'he' && (
                            <Ionicons name="checkmark-circle" size={20} color="#4361EE" />
                        )}
                    </TouchableOpacity>
                </ModalPresentation>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#64748B',
        textTransform: 'capitalize',
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerIconContainer: {
        backgroundColor: '#FEE2E2',
    },
    itemTextContainer: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    },
    dangerLabel: {
        color: '#EF4444',
    },
    dangerItem: {
        borderBottomWidth: 0,
    },
    valueContainer: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    valueText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    activeLanguage: {
        backgroundColor: '#F0F9FF',
    },
    languageText: {
        fontSize: 16,
        color: '#334155',
    },
    activeLanguageText: {
        color: '#4361EE',
        fontWeight: '600',
    },
});
