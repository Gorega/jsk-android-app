import React from "react";
import { View, StyleSheet, Text, ScrollView, StatusBar, Platform } from "react-native";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function HomeScreen(){
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar 
                barStyle={isDark ? "light-content" : "dark-content"} 
                backgroundColor={colors.statusBarBg} 
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.cardContainer, { 
                    backgroundColor: colors.card,
                    shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : "#000" 
                }]}>
                    <LinearGradient
                        colors={['#4361EE', '#3A0CA3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconContainer}
                    >
                        <Feather name="info" size={24} color="white" />
                    </LinearGradient>
                    
                    <Text style={[styles.title, {
                        color: colors.text,
                        ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        }),
                    }]}>
                        {translations[language].about.aboutLabel}
                    </Text>
                    
                    <Text style={[styles.description, {
                        color: colors.textSecondary,
                        ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        }),
                    }]}>
                        {translations[language].about.aboutDesc}
                    </Text>
                </View>
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
    cardContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#4B5563",
    }
});