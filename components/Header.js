import { View, StyleSheet, SafeAreaView, Image, Text, TouchableOpacity, Platform, Animated } from "react-native";
import avatar from "../assets/images/avatar2.jpg";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from "../RootLayout";
import { useEffect, useState, useRef } from "react";
import { translations } from '../utils/languageContext';
import { useLanguage } from '../utils/languageContext';
import { router } from "expo-router";
import { useSocket } from '../utils/socketContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from "@/utils/secureStore";
import { RTLWrapper } from '@/utils/RTLWrapper';
import { StatusBar } from 'expo-status-bar';

export default function Header({ showGreeting = true, title }) {
    const socket = useSocket();
    const { user } = useAuth();
    const { language } = useLanguage();
    const [greetingMsg, setGreetingMsg] = useState("");
    const [notificationsCount, setNotificationsCount] = useState(0);
    const badgeAnimation = useRef(new Animated.Value(0)).current;
    const balanceAnimation = useRef(new Animated.Value(0)).current;
    const headerAnimation = useRef(new Animated.Value(0)).current;
    const isRTL = language === 'ar' || language === 'he';

    useEffect(() => {
        // Animate header appearance
        Animated.timing(headerAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

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
            // const token = await getToken("userToken");
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/count`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    // "Cookie": token ? `token=${token}` : ""
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
    
        // Fetch initial notification count when component mounts
        const fetchNotificationCount = async () => {
            try {
                // const token = await getToken("userToken");
                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/count?user_id=${user.userId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                        // "Cookie": token ? `token=${token}` : ""
                    }
                });
    
                if (response.ok) {
                    const data = await response.json();
                    setNotificationsCount(data.count || 0);
                }
            } catch (error) {
            }
        };
        
        fetchNotificationCount();
    
        const handleNotification = (notification) => {
            if (!notification || Number(user.userId) !== Number(notification.user_id)) {
                return;
            }
    
            switch (notification.type) {
                case 'NEW_NOTIFICATION':
                    setNotificationsCount(prev => prev + 1);
                    break;
                case 'UPDATE_COUNT':
                    // Set to the exact count provided in the notification
                    if (notification.count !== undefined) {
                        setNotificationsCount(notification.count);
                    } else {
                        setNotificationsCount(prev => prev + 1);
                    }
                    break;
                case 'NOTIFICATIONS_RESET':
                    setNotificationsCount(0);
                    break;
                case 'NOTIFICATION_DELETED':
                    setNotificationsCount(prev => Math.max(0, prev - 1));
                    break;
                case 'NOTIFICATION_UPDATED':
                    // Handle if needed
                    break;
                case 'ALL_NOTIFICATIONS_DELETED':
                    setNotificationsCount(0);
                    break;
            }
        };
    
        socket.off('notification').on('notification', handleNotification);
        
        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, user]);

    return (
        <RTLWrapper>
            <StatusBar style="dark" />
            <Animated.View style={{ opacity: headerAnimation, transform: [{ translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
            }) }] }}>
                <LinearGradient
                    colors={['#ffffff', '#f8f9fa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.container}
                >
                    <SafeAreaView style={styles.safeArea}>
                        {/* Main Header Row */}
                        <View style={styles.main}>
                            {/* User Avatar and Balance */}
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={() => router.push({
                                    pathname: "(create_user)",
                                    params: { userId: user.userId }
                                })}
                            >
                                <View style={styles.avatarWrapper}>
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
                                </View>
                                
                            </TouchableOpacity>
                            
                            {/* Title or Greeting */}
                            {showGreeting ? (
                                <View style={[styles.greetingContainer,{
                                    ...Platform.select({
                                        ios: {
                                            flexDirection:"column",
                                            alignItems:isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }]}>
                                    <Text style={styles.greeting}>
                                        {greetingMsg}
                                    </Text>
                                    <Text style={styles.subGreeting}>
                                        {user.name}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.titleContainer}>
                                    <Text style={styles.titleText}>{title}</Text>
                                </View>
                            )}
                            
                            {/* Notification Button */}
                            <View style={styles.notificationContainer}>
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
                                    </LinearGradient>
                                </TouchableOpacity>
                                {notificationsCount > 0 && (
                                    <Animated.View 
                                        style={[
                                            styles.badge,
                                            { transform: [
                                                { scale: badgeAnimation },
                                                { translateX: 2 }
                                            ] }
                                        ]}
                                    >
                                        <Text style={styles.badgeText}>
                                            {notificationsCount > 99 ? '99+' : notificationsCount}
                                        </Text>
                                    </Animated.View>
                                )}
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </Animated.View>
        </RTLWrapper>
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
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: '#ffffff',
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
    avatarContainer: {
        position: 'relative',
    },
    avatarWrapper: {
        borderRadius: 26,
        padding: 2,
        backgroundColor: 'white',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    greetingContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    greeting: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    notificationContainer: {
        position: 'relative',
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationButton: {
        shadowColor: "#4361EE",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    notificationGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 14,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: 'white',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    }
});