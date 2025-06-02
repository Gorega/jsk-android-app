import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Feather from '@expo/vector-icons/Feather';
import { router } from "expo-router";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen(){
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

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
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <LinearGradient
                        colors={isOpen ? ['#06D6A0', '#059669'] : ['#FF6B6B', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statusIconContainer}
                    >
                        <Feather name={isOpen ? "clock" : "clock"} size={24} color="white" />
                    </LinearGradient>
                    
                    <View style={styles.statusTextContainer}>
                        <Text style={[styles.statusTitle]}>
                            {translations[language].contact.weAre}{' '}
                            <Text style={{color: isOpen ? "#059669" : "#DC2626", fontWeight: '700'}}>
                                {isOpen ? translations[language].contact.open : translations[language].contact.closed} {translations[language].contact.now}
                            </Text>
                        </Text>
                        <Text style={[styles.statusSubtitle]}>
                            {isOpen 
                                ? (translations[language].contact?.openingHours || "Opening hours: 9:00 AM - 10:00 PM") 
                                : (translations[language].contact?.closingHours || "We'll be back tomorrow at 9:00 AM")}
                        </Text>
                    </View>
                </View>
                
                {/* Contact Card */}
                <View style={styles.contactCard}>
                    <View style={[styles.contactRow]}>
                        <Feather name="phone" size={20} color="#4361EE" />
                        <View style={[styles.contactTextContainer]}>
                            <Text style={styles.contactLabel}>{translations[language].contact.local}</Text>
                            <Text style={styles.contactValue}>+972566150002</Text>
                        </View>
                    </View>
                </View>
                
                {/* Social Media Card */}
                <View style={styles.socialCard}>
                    <Text style={[styles.socialTitle]}>
                        {translations[language].contact?.connectWithUs || "تواصل معنا"}
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
                            <Text style={styles.socialButtonText}>{translations[language].contact.facebook}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => router.push("")}
                        >
                            <LinearGradient
                                colors={['#0084ff', '#0078FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.socialIconContainer}
                            >
                                <FontAwesome5 name="facebook-messenger" size={24} color="white" />
                            </LinearGradient>
                            <Text style={styles.socialButtonText}>{translations[language].contact.messenger}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => router.push("")}
                        >
                            <LinearGradient
                                colors={['#25D366', '#128C7E']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.socialIconContainer}
                            >
                                <FontAwesome name="whatsapp" size={24} color="white" />
                            </LinearGradient>
                            <Text style={styles.socialButtonText}>{translations[language].contact.whatsapp}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Visit Website Button */}
                <TouchableOpacity style={styles.websiteButtonContainer}>
                    <LinearGradient
                        colors={['#4361EE', '#3A0CA3']}
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
        backgroundColor: "#f8f9fa",
    },
    headerWrapper: {
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F2937",
    },
    scrollContent: {
        padding: 20,
        paddingTop: 25,
    },
    statusCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
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
        flex: 1,
    },
    statusTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 14,
        color: "#64748B",
    },
    contactCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        shadowColor: "#000",
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
        color: "#64748B",
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1F2937",
    },
    socialCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
    },
    socialTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 16,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    socialButton: {
        alignItems: 'center',
        width: '30%',
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
        color: "#4B5563",
    },
    websiteButtonContainer: {
        marginTop: 24,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#4361EE',
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