import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image, ScrollView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useLanguage, translations } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

export default function ReadyOrders() {
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [expandedSenders, setExpandedSenders] = useState({});
    const [selectedOrders, setSelectedOrders] = useState({});

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/driver-collection-tasks`, {
                headers: {
                    'Accept-Language': language
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                setTasks(data.data);
                // Keep all sender groups collapsed initially
                setExpandedSenders({});
            } else {
                Alert.alert(translations[language].errors.error, data.message || 'Failed to fetch tasks');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            Alert.alert(translations[language].errors.error, 'Network error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks();
    };

    const toggleSender = (senderId) => {
        setExpandedSenders(prev => ({
            ...prev,
            [senderId]: !prev[senderId]
        }));
    };

    const toggleOrderSelection = (orderId) => {
        setSelectedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const toggleSenderSelection = (senderId, orderIds) => {
        const allSelected = orderIds.every(id => selectedOrders[id]);
        const newSelection = { ...selectedOrders };

        orderIds.forEach(id => {
            newSelection[id] = !allSelected;
        });

        setSelectedOrders(newSelection);
    };

    const handleConfirmReceive = async () => {
        const selectedIds = Object.keys(selectedOrders).filter(id => selectedOrders[id]);

        if (selectedIds.length === 0) {
            Alert.alert(translations[language].errors.error, translations[language].errors.noItemsScanned || 'No orders selected');
            return;
        }

        setActionLoading(true);
        try {
            const updates = selectedIds.map(id => ({
                order_id: parseInt(id),
                status: 'received_from_business'
            }));

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/status`, {
                method: "PUT",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language
                },
                credentials: "include",
                body: JSON.stringify({ updates })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.details || 'Failed to update status');
            }

            // Success
            Alert.alert(
                translations[language].common.success,
                translations[language].common.receivedOrdersSuccessMessage || 'Orders received successfully',
                [{
                    text: 'OK', onPress: () => {
                        setSelectedOrders({});
                        fetchTasks(); // Refresh list
                    }
                }]
            );

        } catch (error) {
            Alert.alert(translations[language].errors.error, error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const renderSenderGroup = ({ item }) => {
        const isExpanded = expandedSenders[item.sender_id];
        const orderIds = item.orders.map(o => o.order_id);
        const allSelected = orderIds.length > 0 && orderIds.every(id => selectedOrders[id]);
        const someSelected = orderIds.some(id => selectedOrders[id]);

        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleSender(item.sender_id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.userInfoRow}>
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.avatarText, { color: colors.primary }]}>{item.sender_name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={[styles.senderName, { color: colors.text }]}>{item.sender_name}</Text>
                                <Text style={[styles.senderPhone, { color: colors.textSecondary }]}>{item.sender_phone}</Text>
                            </View>
                        </View>

                        <View style={styles.addressContainer}>
                            {(item.sender_city || item.sender_address) && (
                                <View style={styles.locationRow}>
                                    <MaterialIcons name="location-pin" size={16} color={colors.textSecondary} />
                                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                        {[item.sender_city, item.sender_address].filter(Boolean).join(', ')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => toggleSenderSelection(item.sender_id, orderIds)}
                            style={styles.groupCheckbox}
                        >
                            <MaterialIcons
                                name={allSelected ? "check-box" : someSelected ? "indeterminate-check-box" : "check-box-outline-blank"}
                                size={24}
                                color={allSelected || someSelected ? colors.primary : colors.textSecondary}
                            />
                        </TouchableOpacity>
                        <MaterialIcons
                            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                            size={24}
                            color={colors.textSecondary}
                        />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={[styles.ordersList, { borderTopColor: colors.border }]}>
                        {item.orders.map(order => (
                          <TouchableOpacity
                            key={order.order_id}
                            style={[styles.orderItem, { borderColor: colors.border }]}
                            onPress={() => toggleOrderSelection(order.order_id)}
                          >
                            <View style={styles.orderInfo}>
                                <Text style={[styles.orderRef, { color: colors.text }]}>#{order.reference_id || order.order_id}</Text>
                                <Text style={[styles.receiverName, { color: colors.textSecondary }]}>
                                    {order.receiver_name}
                                </Text>
                                {(order.receiver_city || order.receiver_address) && (
                                    <Text style={[styles.receiverAddress, { color: colors.textTertiary }]}>
                                        {[order.receiver_city, order.receiver_address].filter(Boolean).join(', ')}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.orderActions}>
                                {/* <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}> 
                                    <Text style={[styles.statusText, { color: colors.warning }]}>
                                        {translations[language]?.status?.[order.status] || order.status}
                                    </Text>
                                </View> */}
                                <MaterialIcons
                                    name={selectedOrders[order.order_id] ? "check-box" : "check-box-outline-blank"}
                                    size={24}
                                    color={selectedOrders[order.order_id] ? colors.primary : colors.textSecondary}
                                />
                            </View>
                          </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const selectedCount = Object.values(selectedOrders).filter(Boolean).length;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: translations[language]?.common?.readyOrders || "Ready Orders",
                    headerStyle: { backgroundColor: colors.background },
                    headerTitleStyle: { color: colors.text },
                    headerTintColor: colors.text,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderSenderGroup}
                    keyExtractor={item => item.sender_id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Feather name="package" size={64} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {translations[language]?.camera?.noItemsScanned || "No pending collection tasks found."}
                            </Text>
                        </View>
                    }
                />
            )}

            {selectedCount > 0 && (
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <View style={styles.footerInfo}>
                        <Text style={[styles.selectedText, { color: colors.text }]}>
                            {selectedCount} {translations[language]?.common?.selected || "Selected"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: actionLoading ? 0.7 : 1 }]}
                        onPress={handleConfirmReceive}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <Text style={styles.confirmButtonText}>
                                {translations[language]?.common?.receive || "Confirm Receive"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop:25
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerContent: {
        flex: 1,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTextContainer: {
        flex: 1,
    },
    senderName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    senderPhone: {
        fontSize: 14,
    },
    addressContainer: {
        marginTop: 4,
        paddingLeft: 52, // Align with text
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        fontSize: 13,
        marginLeft: 4,
        flex: 1,
    },
    headerActions: {
        alignItems: 'center',
        gap: 12,
    },
    groupCheckbox: {
        padding: 4,
    },
    ordersList: {
        borderTopWidth: 1,
        backgroundColor: 'transparent',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent', // Handled by container valid check if needed
    },
    orderInfo: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        flex: 1
    },
    orderRef: {
        fontSize: 15,
        fontWeight: '500',
    },
    receiverName: {
        fontSize: 13,
        marginTop: 2,
        flexWrap: 'wrap',
        flexShrink: 1,
        width: '100%'
    },
    receiverAddress: {
        fontSize: 12,
        marginTop: 2,
        flexWrap: 'wrap',
        flexShrink: 1,
        width: '100%'
    },
    orderActions: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 8
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    footerInfo: {
        flex: 1,
    },
    selectedText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    closeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4
    },
});
