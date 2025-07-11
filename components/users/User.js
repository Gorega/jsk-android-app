import { View, StyleSheet, Text, TouchableOpacity, Pressable, Animated, Platform } from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ModalPresentation from '../ModalPresentation';
import { router } from 'expo-router';
import UserBox from "../orders/userBox/UserBox";
import { useSocket } from '../../utils/socketContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import React from 'react';

function User({ user }) {
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    const [showControl, setShowControl] = useState(false);
    const socket = useSocket();
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isRTL = language === 'ar' || language === 'he';
    
    // Use active_status directly from user prop
    const isActiveAccount = user?.active_status === 1;

    // Pulse animation for online status
    useEffect(() => {
        if (isOnline) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isOnline]);

    // Listen for online user updates from socket
    useEffect(() => {
        if (!socket) return;

        // Initialize as offline
        setIsOnline(false);

        // Handle userUpdate events with type USER_ONLINE_STATUS
        const handleUserUpdate = (notification) => {
            if (notification.userId === user.user_id || notification.userId === Number(user.user_id)) {
                if (notification.type === 'USER_ONLINE_STATUS') {
                    setIsOnline(notification.isOnline);
                    
                    if (!notification.isOnline && notification.timestamp) {
                        try {
                            const timestamp = new Date(notification.timestamp);
                            if (!isNaN(timestamp.getTime())) {
                                setLastSeen(timestamp);
                            }
                        } catch (e) {
                            console.error("Invalid timestamp format:", notification.timestamp);
                        }
                    }
                }
            }
        };

        // Handle individual user online status
        const handleUserOnline = (userId) => {
            if (userId === user.user_id || userId === Number(user.user_id)) {
                setIsOnline(true);
            }
        };

        // Handle individual user offline status
        const handleUserOffline = (userId) => {
            if (userId === user.user_id || userId === Number(user.user_id)) {
                setIsOnline(false);
                const now = new Date();
                setLastSeen(now);
            }
        };
        
        // Check if user is already online
        const checkOnlineStatus = () => {
            socket.emit('getOnlineUsers', (onlineUsers) => {
                if (Array.isArray(onlineUsers)) {
                    const userIsOnline = onlineUsers.some(id => 
                        id === user.user_id || id === Number(user.user_id)
                    );
                    setIsOnline(userIsOnline);
                }
            });
        };

        // Listen for events
        socket.on('userUpdate', handleUserUpdate);
        socket.on('userOnline', handleUserOnline);
        socket.on('userOffline', handleUserOffline);
        
        // Check initial status
        checkOnlineStatus();

        return () => {
            socket.off('userUpdate', handleUserUpdate);
            socket.off('userOnline', handleUserOnline);
            socket.off('userOffline', handleUserOffline);
        };
    }, [socket, user.user_id]);

    // Format time since last seen
    const formatLastSeen = useCallback(() => {
        if (!lastSeen || !(lastSeen instanceof Date) || isNaN(lastSeen.getTime())) {
            return translations[language].users.user.offline;
        }
        
        const now = new Date();
        const diffMs = now - lastSeen;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
            return translations[language].users.user.justNow;
        } else if (diffMins < 60) {
            return `${diffMins} ${translations[language].users.user.minutesAgo}`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) {
                return `${diffHours} ${translations[language].users.user.hoursAgo}`;
            } else {
                const diffDays = Math.floor(diffHours / 24);
                return `${diffDays} ${translations[language].users.user.daysAgo}`;
            }
        }
    }, [lastSeen, language]);

    // Memoize the status text to prevent recalculation
    const statusText = useMemo(() => {
        return isOnline ? 
            translations[language].users.user.online : 
            isActiveAccount ? 
                (lastSeen ? formatLastSeen() : translations[language].users.user.active) : 
                translations[language].users.user.inactive;
    }, [isOnline, isActiveAccount, lastSeen, formatLastSeen, language]);

    // Memoize the handleEditPress function
    const handleEditPress = useCallback(() => {
        setShowControl(false);
        router.push({
            pathname: "(create_user)",
            params: { userId: user.user_id }
        });
    }, [user.user_id]);

    return (
        <>
            <Pressable
                onLongPress={() => setShowControl(true)}
                style={({ pressed }) => [
                    { opacity: pressed ? 0.9 : 1 },
                    styles.userPressable
                ]}
            >
                <View style={[
                    styles.user,
                    { backgroundColor: colors.card },
                    isOnline && styles.onlineUserHighlight
                ]}>
                    {/* Header with ID & Status */}
                    <View style={[styles.header]}>
                        <View style={[
                            styles.idContainer,
                            { 
                                borderColor: colors.primary,
                                backgroundColor: colorScheme === 'dark' ? 'rgba(108, 142, 255, 0.15)' : '#EEF2FF'
                            }
                        ]}>
                            <Text style={[styles.idText, { color: colors.primary }]}>#{user?.user_id}</Text>
                            {isActiveAccount && (
                                <View style={styles.activeStatusIndicator} />
                            )}
                        </View>
                        
                        <LinearGradient
                            colors={isOnline ? 
                                ['#10B981', '#059669'] : 
                                isActiveAccount ? ['#3B82F6', '#2563EB'] : ['#EF4444', '#DC2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.statusBadge}
                        >
                            <View style={styles.statusIndicator}>
                                <Animated.View style={[
                                    styles.statusDot,
                                    isOnline ? styles.onlineDot : 
                                    isActiveAccount ? styles.activeDot : styles.inactiveDot,
                                    { transform: [{ scale: isOnline ? pulseAnim : 1 }] }
                                ]} />
                                <Text style={styles.statusText}>
                                    {statusText}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* User Info Section */}
                    <View style={[
                        styles.userInfoSection,
                        { backgroundColor: colorScheme === 'dark' ? colors.surface : '#F8FAFC' }
                    ]}>
                        <UserBox 
                            styles={styles} 
                            box={{
                                label: translations[language].users.user.name,
                                userName: user?.name,
                                phone: user?.phone
                            }}
                        />
                    </View>

                    {/* Location Section */}
                    <View style={[
                        styles.section,
                        { borderBottomColor: colors.border }
                    ]}>
                        <View style={[styles.sectionContent]}>
                            <Ionicons 
                                name="location-outline" 
                                size={22} 
                                color={colors.primary} 
                                style={[styles.sectionIcon]}
                            />
                            <View style={[styles.textContainer, {
                                ...Platform.select({
                                    ios: {
                                        alignItems: isRTL ? "flex-start" : "flex-end"
                                    }
                                }),
                            }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    {translations[language].users.user.location}
                                </Text>
                                <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                                    {user?.city} {user.address ? `, ${user.address}` : ""}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Role Section */}
                    <View style={[
                        styles.section,
                        { borderBottomColor: colors.border }
                    ]}>
                        <View style={[styles.sectionContent]}>
                            <MaterialIcons 
                                name="admin-panel-settings" 
                                size={22} 
                                color={colors.primary} 
                                style={[styles.sectionIcon]}
                            />
                            <View style={[styles.textContainer, {
                                ...Platform.select({
                                    ios: {
                                        alignItems: isRTL ? "flex-start" : "flex-end"
                                    }
                                }),
                            }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    {translations[language].users.user.role}
                                </Text>
                                <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                                    {user?.role}
                                </Text>
                            </View>
                        </View>
                    </View>

                </View>
            </Pressable>
            
            {/* Edit Modal */}
            {showControl && (
                <ModalPresentation
                    showModal={showControl}
                    setShowModal={setShowControl}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {translations[language].users.user.options}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.modalItem, { borderBottomColor: colors.border }]} 
                        onPress={handleEditPress}
                    >
                        <View style={[
                            styles.modalItemIconContainer,
                            { backgroundColor: colorScheme === 'dark' ? 'rgba(108, 142, 255, 0.15)' : '#EEF2FF' }
                        ]}>
                            <Feather name="edit" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.modalItemText, { color: colors.text }]}>
                            {translations[language].users.user.edit}
                        </Text>
                    </TouchableOpacity>
                </ModalPresentation>
            )}
        </>
    );
}

// Wrap the component with React.memo to prevent unnecessary re-renders
export default React.memo(User, (prevProps, nextProps) => {
    // Only re-render if essential properties change
    return (
        prevProps.user.user_id === nextProps.user.user_id &&
        prevProps.user.name === nextProps.user.name &&
        prevProps.user.active_status === nextProps.user.active_status &&
        prevProps.user.role === nextProps.user.role &&
        prevProps.user.city === nextProps.user.city &&
        prevProps.user.address === nextProps.user.address
    );
});

const styles = StyleSheet.create({
    userPressable: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    user: {
        borderRadius: 12,
        padding: 16,
        shadowColor: "#64748B",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2.65,
        elevation: 2,
    },
    onlineUserHighlight: {
        borderLeftWidth: 4,
        borderLeftColor: "#10B981",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    idContainer: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    idText: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    activeStatusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#10B981",
        marginLeft: 6,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 3,
    },
    statusText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginLeft: 6,
    },
    statusIndicator: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    onlineDot: {
        backgroundColor: "#ffffff",
        shadowColor: "#ffffff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
    },
    activeDot: {
        backgroundColor: "#ffffff",
        opacity: 0.8,
    },
    inactiveDot: {
        backgroundColor: "#ffffff",
        opacity: 0.6,
    },
    userInfoSection: {
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
    },
    section: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    sectionContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    sectionIcon: {
        width: 22,
        height: 22,
    },
    textContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 2,
    },
    sectionText: {
        fontSize: 14,
    },
    onlineNowText: {
        fontSize: 12,
        color: "#10B981",
        fontWeight: "500",
        marginTop: 4,
    },
    modalHeader: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    modalItem: {
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        gap: 12,
    },
    modalItemIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    modalItemText: {
        fontSize: 16,
        fontWeight: "500",
    },
    // Support styles for UserBox if needed
    box: {
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
});