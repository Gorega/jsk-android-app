import { View, StyleSheet, SafeAreaView, Image, Text, TouchableOpacity, Platform, Animated } from "react-native";
import avatar from "../assets/images/avatar2.jpg";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from "@/app/_layout";
import { useEffect, useState, useRef } from "react";
import { translations } from '../utils/languageContext';
import { useLanguage } from '../utils/languageContext';
import { router } from "expo-router";
import { useSocket } from '../utils/socketContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from "@/utils/secureStore";

export default function Header({ showGreeting = true, title }) {
    const socket = useSocket();
    const { user } = useAuth();
    const { language } = useLanguage();
    const [greetingMsg, setGreetingMsg] = useState("");
    const [notificationsCount, setNotificationsCount] = useState(0);
    const isRTL = language === 'ar' || language === 'he';
    const badgeAnimation = useRef(new Animated.Value(0)).current;
    const balanceAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (notificationsCount > 0) {
            Animated.sequence([
                Animated.timing(badgeAnimation, {
                    toValue: 1.2,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(badgeAnimation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            badgeAnimation.setValue(0);
        }
    }, [notificationsCount]);

    useEffect(() => {
        if (user?.total_amount) {
            Animated.timing(balanceAnimation, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }
    }, [user?.total_amount]);

    const handleNotificationIcon = async () => {
        // Navigate first to ensure good UX
        router.push("/(notifications)");
    
        try {
            // Reset count on server
            const token = await getToken("userToken");
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/count`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    "Cookie": token ? `token=${token}` : ""
                },
                body: JSON.stringify({
                    user_id: user.userId
                })
            });
    
            if (!response.ok) {
                throw new Error(await response.text());
            }
    
            // Reset local count
            setNotificationsCount(0);
        } catch (error) {
            console.error('Error resetting notifications:', error);
        }
    };

    useEffect(() => {
        const currentHour = new Date().getHours();
    
        if (currentHour >= 5 && currentHour < 12) {
            setGreetingMsg(translations[language].greeting.morning);
        } else if (currentHour >= 12 && currentHour < 18) {
            setGreetingMsg(translations[language].greeting.afternoon);
        } else {
            setGreetingMsg(translations[language].greeting.evening);
        }
    }, [language, user]);

    useEffect(() => {
        if (!socket || !user) return;
    
        const handleNotification = (notification) => {
            if (!notification || Number(user.userId) !== Number(notification.user_id)) {
                return;
            }
    
            switch (notification.type) {
                case 'NEW_NOTIFICATION':
                case 'UPDATE_COUNT':
                    setNotificationsCount(prev => prev + 1);
                    break;
                case 'NOTIFICATIONS_RESET':
                    setNotificationsCount(0);
                    break;
                case 'NOTIFICATION_DELETED':
                case 'NOTIFICATION_UPDATED':
                case 'ALL_NOTIFICATIONS_DELETED':
                    // Handle count updates here if needed
                    break;
            }
        };
    
        socket.off('notification').on('notification', handleNotification);
        
        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, user]);

    return (
        <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Main Header Row */}
                <View style={[
                    styles.main,
                    { flexDirection: isRTL ? "row-reverse" : "row" }
                ]}>
                    {/* User Avatar and Balance */}
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={() => router.push({
                            pathname: "(create_user)",
                            params: { userId: user.userId }
                        })}
                    >
                        {user?.avatar ? (
                            <Image 
                                style={styles.avatar} 
                                source={{ uri: user.avatar }}
                                resizeMode="cover" 
                            />
                        ) : (
                            <Image 
                                style={styles.avatar} 
                                source={avatar}
                                resizeMode="cover" 
                            />
                        )}
                        
                        {["business", "driver"].includes(user?.role) && (
                            <Animated.View 
                                style={[
                                    styles.balanceBadge,
                                    { 
                                        opacity: balanceAnimation,
                                        transform: [{ scale: balanceAnimation }] 
                                    }
                                ]}
                            >
                                <Text style={styles.balanceText}>₪{user?.total_amount}</Text>
                            </Animated.View>
                        )}
                    </TouchableOpacity>
                    
                    {/* Title or Greeting */}
                    {showGreeting ? (
                        <View style={[
                            styles.greetingContainer,
                            isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }
                        ]}>
                            <Text style={[styles.greeting, isRTL && styles.textRTL]}>
                                {greetingMsg}
                            </Text>
                            <Text style={[styles.subGreeting, isRTL && styles.textRTL]}>
                                {user.name}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>{title}</Text>
                        </View>
                    )}
                    
                    {/* Notification Button */}
                    <TouchableOpacity 
                        style={styles.notificationButton}
                        onPress={handleNotificationIcon}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#4361EE', '#3A0CA3']}
                            style={styles.notificationGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons 
                                name="notifications" 
                                size={24} 
                                color="white" 
                            />
                            {notificationsCount > 0 && (
                                <Animated.View 
                                    style={[
                                        styles.badge,
                                        { transform: [{ scale: badgeAnimation }] }
                                    ]}
                                >
                                    <Text style={styles.badgeText}>
                                        {notificationsCount > 99 ? '99+' : notificationsCount}
                                    </Text>
                                </Animated.View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        ...Platform.select({
            ios: {
                paddingTop: 50,
            },
            android: {
                paddingTop: 25,
            },
        }),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    safeArea: {
        width: '100%',
    },
    main: {
        height: 80,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    textRTL: {
        textAlign: 'right',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    balanceBadge: {
        position: 'absolute',
        bottom: -8,
        right: -10,
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 2,
    },
    balanceText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    greetingContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    subGreeting: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    notificationButton: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    notificationGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});