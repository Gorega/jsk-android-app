import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Feather from '@expo/vector-icons/Feather';
import { router } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function HomeScreen(){
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [isOpen, setIsOpen] = useState(false);
    const isRTL = language === 'ar' || language === 'he';

    useEffect(() => {
        const currentHour = new Date().getHours();
    
        // Open from 9 AM (09:00) to 10 PM (22:00)
        if (currentHour >= 9 && currentHour < 22) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.statusBarBg} />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: colors.card, shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)' }]}>
                    <LinearGradient
                        colors={isOpen ? ['#06D6A0', '#059669'] : ['#FF6B6B', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statusIconContainer}
                    >
                        <Feather name={isOpen ? "clock" : "clock"} size={24} color="white" />
                    </LinearGradient>
                    
                    <View style={[styles.statusTextContainer]}>
                        <Text style={[
                            styles.statusTitle,
                            { color: colors.text },
                            {
                                ...Platform.select({
                                    ios: {
                                        textAlign: isRTL ? "left" : ""
                                    }
                                }),
                            }
                        ]}>
                            {translations[language].contact.weAre}{' '}
                            <Text style={{color: isOpen ? "#059669" : "#DC2626", fontWeight: '700'}}>
                                {isOpen ? translations[language].contact.open : translations[language].contact.closed} {translations[language].contact.now}
                            </Text>
                        </Text>
                        <Text style={[
                            styles.statusSubtitle,
                            { color: colors.textSecondary }
                        ]}>
                            {isOpen 
                                ? (translations[language].contact?.openingHours || "Opening hours: 9:00 AM - 10:00 PM") 
                                : (translations[language].contact?.closingHours || "We'll be back tomorrow at 9:00 AM")}
                        </Text>
                    </View>
                </View>
                
                {/* Contact Card */}
                <View style={[styles.contactCard, { backgroundColor: colors.card, shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)' }]}>
                    <View style={[styles.contactRow]}>
                        <Feather name="phone" size={20} color={colors.primary} />
                        <View style={[styles.contactTextContainer]}>
                            <Text style={[
                                styles.contactLabel,
                                { color: colors.textSecondary },
                                {
                                    ...Platform.select({
                                        ios: {
                                            textAlign: isRTL ? "left" : ""
                                        }
                                    }),
                                }
                            ]}>{translations[language].contact.local}</Text>
                            <Text style={[styles.contactValue, { color: colors.text }]}>+972566150002</Text>
                        </View>
                    </View>
                </View>
                
                {/* Social Media Card */}
                <View style={[styles.socialCard, { backgroundColor: colors.card, shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)' }]}>
                    <Text style={[
                        styles.socialTitle,
                        { color: colors.text },
                        {
                            ...Platform.select({
                                ios: {
                                    textAlign: isRTL ? "left" : ""
                                }
                            }),
                        }
                    ]}>
                        {translations[language].contact?.connectWithUs}
                    </Text>
                    
                    <View style={styles.socialButtonsContainer}>
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => router.push("https://www.facebook.com/TAIAR.Palestine/?locale=ar_AR")}
                        >
                            <LinearGradient
                                colors={['#4267B2', '#3b5998']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.socialIconContainer}
                            >
                                <FontAwesome name="facebook" size={24} color="white" />
                            </LinearGradient>
                            <Text style={[styles.socialButtonText, { color: colors.textSecondary }]}>
                                {translations[language].contact.facebook}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => router.push("https://www.instagram.com/taiar.palestine/?hl=ar")}
                        >
                            <LinearGradient
                                colors={['#C13584', '#833AB4']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.socialIconContainer}
                            >
                                <FontAwesome5 name="instagram" size={24} color="white" />
                            </LinearGradient>
                            <Text style={[styles.socialButtonText, { color: colors.textSecondary }]}>
                                {translations[language].contact.instagram}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => router.push("")}
                        >
                            <LinearGradient
                                colors={['#000000', '#000000']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.socialIconContainer}
                            >
                                <FontAwesome5 name="tiktok" size={24} color="white" />
                            </LinearGradient>
                            <Text style={[styles.socialButtonText, { color: colors.textSecondary }]}>
                                {translations[language].contact.tiktok}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => router.push("https://wa.me/972566150002")}
                        >
                            <LinearGradient
                                colors={['#25D366', '#128C7E']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.socialIconContainer}
                            >
                                <FontAwesome name="whatsapp" size={24} color="white" />
                            </LinearGradient>
                            <Text style={[styles.socialButtonText, { color: colors.textSecondary }]}>
                                {translations[language].contact.whatsapp}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Visit Website Button */}
                <TouchableOpacity style={styles.websiteButtonContainer} onPress={() => router.push("https://taiar.org/ar")}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.websiteButton}
                    >
                        <Feather name="globe" size={20} color="#FFFFFF" style={{marginRight: 8}} />
                        <Text style={styles.websiteButtonText}>
                            {translations[language].contact.visitSite}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerWrapper: {
        paddingVertical: 16,
        alignItems: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "700",
    },
    scrollContent: {
        padding: 20,
        paddingTop: 25,
    },
    statusCard: {
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
        gap: 10,
    },
    statusIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusTextContainer: {
    },
    statusTitle: {
        fontSize: 17,
        fontWeight: "600",
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 14,
    },
    contactCard: {
        borderRadius: 20,
        padding: 18,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactTextContainer: {
        marginLeft: 16,
        marginRight: 16,
    },
    contactLabel: {
        fontSize: 14,
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 17,
        fontWeight: "600",
    },
    socialCard: {
        borderRadius: 20,
        padding: 18,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
    },
    socialTitle: {
        fontSize: 17,
        fontWeight: "600",
        marginBottom: 16,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    socialButton: {
        alignItems: 'center',
        width: '20%',
    },
    socialIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    socialButtonText: {
        fontSize: 14,
    },
    websiteButtonContainer: {
        marginTop: 24,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    websiteButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        gap: 10,
    },
    websiteButtonText: {
        fontWeight: "700",
        color: "#FFFFFF",
        fontSize: 16,
    }
});