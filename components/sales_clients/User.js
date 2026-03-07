import { View, StyleSheet, Text, Platform, TouchableOpacity, Pressable } from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState, useCallback } from 'react';
import UserBox from "../orders/userBox/UserBox";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import ModalPresentation from '../ModalPresentation';
import { router } from 'expo-router';
import React from 'react';

function User({ user }) {
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const isRTL = language === 'ar' || language === 'he';
    const [showControl, setShowControl] = useState(false);

    const statusColors = useMemo(() => {
        const w = user?.willingness;
        if (w === 'high') return ['#10B981', '#059669'];
        if (w === 'medium') return ['#3B82F6', '#2563EB'];
        if (w === 'low') return ['#EF4444', '#DC2626'];
        return ['#64748B', '#475569'];
    }, [user?.willingness]);

    const statusText = useMemo(() => {
        return user?.status || user?.willingness || '';
    }, [user?.status, user?.willingness]);

    const handleEditPress = useCallback(() => {
        setShowControl(false);
        router.push({ pathname: "(create_sales_client)", params: { clientId: user.client_id } });
    }, [user?.client_id]);

    return (
        <>
            <Pressable
                onLongPress={() => setShowControl(true)}
                style={({ pressed }) => [
                    { opacity: pressed ? 0.95 : 1 },
                    styles.userPressable
                ]}
            >
            <View style={[
                styles.user,
                { backgroundColor: colors.card }
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
                            <Text style={[styles.idText, { color: colors.primary }]}>#{user?.client_id}</Text>
                        </View>
                        
                        <LinearGradient
                            colors={statusColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.statusBadge}
                        >
                            <View style={styles.statusIndicator}>
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
                                    {user?.city} {user?.address ? `, ${user.address}` : ""}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Role Section */}
                    {user?.activity?.length > 1 && <View style={[
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
                                    {translations[language].users.user.activity}
                                </Text>
                                <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                                    {user?.activity || ""}
                                </Text>
                            </View>
                        </View>
                    </View>}

                    {/* Contact Section */}
                    {(user?.email || user?.phone_2) && (
                        <View style={[
                            styles.section,
                            { borderBottomColor: colors.border }
                        ]}>
                            <View style={[styles.sectionContent]}>
                                <Ionicons 
                                    name="call-outline" 
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
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{translations[language].users.user.contact}</Text>
                                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}> 
                                        {user?.email ? `${user.email}` : ''}
                                        {(user?.email && user?.phone_2) ? ' | ' : ''}
                                        {user?.phone_2 ? `${user.phone_2}` : ''}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Note Section */}
                    {user?.note && (
                        <View style={[
                            styles.section,
                            { borderBottomColor: colors.border }
                        ]}>
                            <View style={[styles.sectionContent]}>
                                <Ionicons 
                                    name="document-text-outline" 
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
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{translations[language].users.user.note}</Text>
                                    <Text style={[styles.sectionText, { color: colors.textSecondary }]}> 
                                        {user?.note}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </Pressable>

            {showControl && (
                <ModalPresentation
                    showModal={showControl}
                    setShowModal={setShowControl}
                    customStyles={{ bottom: 15 }}
                >
                    <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: colors.border }]}> 
                        <Text style={[styles.modalTitle, { color: colors.text }]}> 
                            {translations[language].users.user.options}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.modalItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]} 
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
    return (
        prevProps.user.client_id === nextProps.user.client_id &&
        prevProps.user.name === nextProps.user.name &&
        prevProps.user.status === nextProps.user.status &&
        prevProps.user.willingness === nextProps.user.willingness &&
        prevProps.user.activity === nextProps.user.activity &&
        prevProps.user.city === nextProps.user.city &&
        prevProps.user.address === nextProps.user.address &&
        prevProps.user.email === nextProps.user.email &&
        prevProps.user.phone_2 === nextProps.user.phone_2 &&
        prevProps.user.area === nextProps.user.area &&
        prevProps.user.note === nextProps.user.note
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