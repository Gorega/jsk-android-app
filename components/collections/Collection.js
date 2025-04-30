import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "../../app/_layout";
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import UserBox from "../orders/userBox/UserBox";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../ModalPresentation";
import { useState } from 'react';
import { getToken } from "../../utils/secureStore";

// Helper functions for RTL
const getTextAlign = (isRTL) => isRTL ? 'right' : 'left';
const getFlexDirection = (isRTL) => isRTL ? 'row-reverse' : 'row';
const getMargin = (isRTL, marginSize = 12) => isRTL 
    ? { marginLeft: marginSize, marginRight: 0 } 
    : { marginRight: marginSize, marginLeft: 0 };

export default function Collection({ type, collection }) {
    const { language } = useLanguage();
    const isRTL = ["he", "ar"].includes(language);
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleCollectNotification = async (type, action) => {
        setIsLoading(true);
        try {
            const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/collect/request?requestType=${type}`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language,
                    "Cookie": token ? `token=${token}` : ""
                },
                credentials: "include",
                body: JSON.stringify({
                    action,
                    collection_id: collection.collection_id
                })
            });
            const data = await res.json();
            Alert.alert(data.message);
        } catch (err) {
            Alert.alert(err.message);
        } finally {
            setIsLoading(false);
            setShowModal(false);
        }
    };

    const handleCollectionStatusConfirm = async (status) => {
        // Show confirmation prompt
        Alert.alert(
            // Title
            status === "paid" ?
                translations[language].collections.collection.confirmPaymentTitle :
                translations[language].collections.collection.confirmReturnedTitle,
            // Message
            status === "paid" ?
                translations[language].collections.collection.confirmPaymentMessage :
                translations[language].collections.collection.confirmReturnedMessage,
            // Buttons array
            [
                {
                    text: translations[language].collections.collection.cancel || "Cancel",
                    style: "cancel"
                },
                {
                    text: translations[language].collections.collection.confirm || "Confirm",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const updates = {
                                collection_ids: [collection.collection_id],
                                status: status,
                                note_content: null
                            };

                            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/status`, {
                                method: "PUT",
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                credentials: "include",
                                body: JSON.stringify({ updates })
                            });

                            const data = await res.json();

                            if (data.failures?.length > 0 && data.successes?.length > 0) {
                                return;
                            }
                        } catch (err) {
                            Alert.alert(err.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderCollectionUser = () => {
        if ((type === "business_money" || type === "business_returned") && user.role !== "business") {
            return <UserBox
                box={{
                    label: translations[language].tabs.orders.order.userSenderBoxLabel,
                    userName: collection.business_name,
                    phone: ""
                }}
            />
        }
        if ((type === "sent" || type === "dispatched") && user.role !== "driver") {
            return <UserBox
                box={{
                    label: translations[language].tabs.orders.order.userDriverBoxLabel,
                    userName: collection.current_driver_name,
                    phone: ""
                }}
            />
        }
    }

    // Get status color
    const getStatusColor = (statusKey) => {
        const statusColors = {
            "returned_in_branch": "#6366F1",
            "money_in_branch": "#6366F1",
            "deleted": "#EF4444",
            "returned_out": "#3B82F6",
            "money_out": "#3B82F6",
            "returned_delivered": "#3B82F6",
            "paid": "#3B82F6",
            "completed": "#10B981",
            "pending": "#8B5CF6",
            "in_dispatched_to_branch": "#8B5CF6",
            "partial": "#8B5CF6"
        };
        
        return statusColors[statusKey] || "#64748B";
    };

    return (
        <View style={styles.collectionCard}>
            {/* Header section with ID and status */}
            <View style={[styles.header, { flexDirection: getFlexDirection(isRTL) }]}>
                <View style={styles.idSection}>
                    <View style={[styles.idContainer,{ flexDirection: getFlexDirection(isRTL) }]}>
                        <Text style={styles.idText}>#{collection.collection_id}</Text>
                    </View>
                </View>
                
                <View style={[
                    styles.statusBadge, 
                    { 
                        backgroundColor: getStatusColor(collection.status_key),
                        flexDirection: getFlexDirection(isRTL)
                    }
                ]}>
                    <Text style={styles.statusText}>{collection.status}</Text>
                </View>
            </View>
            
            <View style={styles.contentContainer}>
                {/* User information */}
                <View style={styles.userInfoSection}>
                    {renderCollectionUser()}
                </View>
                
                {/* Order count section */}
                <View style={styles.infoSection}>
                    <View style={[styles.sectionRow, { flexDirection: getFlexDirection(isRTL) }]}>
                        <View style={[
                            styles.iconWrapper, 
                            { backgroundColor: '#4361EE' },
                            getMargin(isRTL)
                        ]}>
                            <Feather name="package" size={20} color="#ffffff" />
                        </View>
                        <View style={styles.sectionContent}>
                            <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
                                {type === "driver" 
                                    ? translations[language].collections.collection.numberOfCollections 
                                    : translations[language].collections.collection.numberOfOrders}
                            </Text>
                            <Text style={[styles.sectionValue, { textAlign: getTextAlign(isRTL) }]}>
                                {type === "driver" ? collection.number_of_collections : collection.number_of_orders}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Money section */}
                {type !== "returned" && (
                    <View style={styles.infoSection}>
                        <View style={[styles.sectionRow, { flexDirection: getFlexDirection(isRTL) }]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#F72585' },
                                getMargin(isRTL)
                            ]}>
                                <MaterialIcons name="attach-money" size={20} color="#ffffff" />
                            </View>
                            <View style={styles.sectionContent}>
                                <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
                                    {type === "driver" 
                                        ? translations[language].collections.collection.moneyToDeliver 
                                        : translations[language].collections.collection.moneyToCollect}
                                </Text>
                                <Text style={[styles.sectionValue, { textAlign: getTextAlign(isRTL) }]}>
                                    {type === "driver" ? collection.total_cod_value : collection.total_cod_value}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* Checks section for driver */}
                {type === "driver" && (
                    <View style={styles.infoSection}>
                        <View style={[styles.sectionRow, { flexDirection: getFlexDirection(isRTL) }]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#3A0CA3' },
                                getMargin(isRTL)
                            ]}>
                                <MaterialIcons name="attach-money" size={20} color="#ffffff" />
                            </View>
                            <View style={styles.sectionContent}>
                                <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
                                    {translations[language].collections.collection.checksToDeliver}
                                </Text>
                                <Text style={[styles.sectionValue, { textAlign: getTextAlign(isRTL) }]}>
                                    {collection.checks_value}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* Branch section */}
                {(type === "returned" || type === "dispatched") && (
                    <View style={styles.infoSection}>
                        <View style={[styles.sectionRow, { flexDirection: getFlexDirection(isRTL) }]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#4CC9F0' },
                                getMargin(isRTL)
                            ]}>
                                <Ionicons name="git-branch-outline" size={20} color="#ffffff" />
                            </View>
                            <View style={styles.sectionContent}>
                                <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
                                    {translations[language].collections.collection.currentBranch}
                                </Text>
                                <Text style={[styles.sectionValue, { textAlign: getTextAlign(isRTL) }]}>
                                    {collection.current_branch_name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* To branch section */}
                {type === "dispatched" && (
                    <View style={styles.infoSection}>
                        <View style={[styles.sectionRow, { flexDirection: getFlexDirection(isRTL) }]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#7209B7' },
                                getMargin(isRTL)
                            ]}>
                                <Ionicons name="git-branch-outline" size={20} color="#ffffff" />
                            </View>
                            <View style={styles.sectionContent}>
                                <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
                                    {translations[language].collections.collection.toBranch}
                                </Text>
                                <Text style={[styles.sectionValue, { textAlign: getTextAlign(isRTL) }]}>
                                    {collection.to_branch_name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
            
            {/* Action buttons */}
            <View style={styles.actionsContainer}>
                {type === "driver" ? (
                    <TouchableOpacity 
                        style={[styles.actionButton, { flexDirection: getFlexDirection(isRTL) }]}
                        onPress={() => router.push({
                            pathname: "/(collection)?type=money",
                            params: { collectionIds: collection.collection_ids }
                        })}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.actionIconContainer,
                            { backgroundColor: '#4361EE' },
                            getMargin(isRTL, 8)
                        ]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color="#ffffff" />
                        </View>
                        <Text style={styles.actionText}>
                            {translations[language].collections.collection.collections}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.actionButton, { flexDirection: getFlexDirection(isRTL) }]}
                        onPress={() => router.push({
                            pathname: "/(tabs)/orders",
                            params: { orderIds: collection.order_ids }
                        })}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.actionIconContainer,
                            { backgroundColor: '#4361EE' },
                            getMargin(isRTL, 8)
                        ]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color="#ffffff" />
                        </View>
                        <Text style={styles.actionText}>
                            {translations[language].collections.collection.orders}
                        </Text>
                    </TouchableOpacity>
                )}
                
                {/* Business package request */}
                {(user.role === "business" && collection.status_key === "returned_in_branch") && (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionButton, { flexDirection: getFlexDirection(isRTL) }]}
                            onPress={() => setShowModal(true)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.actionIconContainer,
                                { backgroundColor: '#F72585' },
                                getMargin(isRTL, 8)
                            ]}>
                                <FontAwesome6 name="money-bill-trend-up" size={18} color="#ffffff" />
                            </View>
                            <Text style={styles.actionText}>
                                {translations[language].collections.collection.request_package}
                            </Text>
                        </TouchableOpacity>
                        
                        <ModalPresentation 
                            customStyles={{bottom: 15}} 
                            showModal={showModal} 
                            setShowModal={setShowModal}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                                    {translations[language]?.packageActions || 'Package Actions'}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, { flexDirection: getFlexDirection(isRTL) }]}
                                onPress={() => handleCollectNotification("package", "prepare")}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#4361EE" size="small" />
                                ) : (
                                    <>
                                        <View style={[
                                            styles.modalIconContainer,
                                            { backgroundColor: '#4361EE' },
                                            getMargin(isRTL, 12)
                                        ]}>
                                            <MaterialIcons name="inventory" size={18} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.modalOptionText, { textAlign: getTextAlign(isRTL) }]}>
                                            {translations[language].collections.collection.prepare_package}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, styles.noBorder, { flexDirection: getFlexDirection(isRTL) }]}
                                onPress={() => handleCollectNotification("package", "send")}
                                disabled={isLoading}
                            >
                                <View style={[
                                    styles.modalIconContainer,
                                    { backgroundColor: '#F72585' },
                                    getMargin(isRTL, 12)
                                ]}>
                                    <Feather name="send" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.modalOptionText, { textAlign: getTextAlign(isRTL) }]}>
                                    {translations[language].collections.collection.send_package}
                                </Text>
                            </TouchableOpacity>
                        </ModalPresentation>
                    </>
                )}
                
                {/* Business money request */}
                {(user.role === "business" && collection.status_key === "money_in_branch") && (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionButton, { flexDirection: getFlexDirection(isRTL) }]}
                            onPress={() => setShowModal(true)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.actionIconContainer,
                                { backgroundColor: '#F72585' },
                                getMargin(isRTL, 8)
                            ]}>
                                <FontAwesome6 name="money-bill-trend-up" size={18} color="#ffffff" />
                            </View>
                            <Text style={styles.actionText}>
                                {translations[language].collections.collection.request_money}
                            </Text>
                        </TouchableOpacity>
                        
                        <ModalPresentation 
                            customStyles={{bottom: 15}} 
                            showModal={showModal} 
                            setShowModal={setShowModal}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalHeaderText, { textAlign: getTextAlign(isRTL) }]}>
                                    {translations[language]?.moneyActions || 'Money Actions'}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, { flexDirection: getFlexDirection(isRTL) }]}
                                onPress={() => handleCollectNotification("money", "prepare")}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#4361EE" size="small" />
                                ) : (
                                    <>
                                        <View style={[
                                            styles.modalIconContainer,
                                            { backgroundColor: '#4361EE' },
                                            getMargin(isRTL, 12)
                                        ]}>
                                            <MaterialIcons name="payments" size={18} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.modalOptionText, { textAlign: getTextAlign(isRTL) }]}>
                                            {translations[language].collections.collection.prepare_money}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, styles.noBorder, { flexDirection: getFlexDirection(isRTL) }]}
                                onPress={() => handleCollectNotification("money", "send")}
                                disabled={isLoading}
                            >
                                <View style={[
                                    styles.modalIconContainer,
                                    { backgroundColor: '#F72585' },
                                    getMargin(isRTL, 12)
                                ]}>
                                    <Feather name="send" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.modalOptionText, { textAlign: getTextAlign(isRTL) }]}>
                                    {translations[language].collections.collection.send_money}
                                </Text>
                            </TouchableOpacity>
                        </ModalPresentation>
                    </>
                )}
            </View>
            
            {/* Confirm payment button for business */}
            {collection.status_key === "money_out" && user.role === "business" && (
                <TouchableOpacity 
                    style={[styles.confirmButton, { flexDirection: getFlexDirection(isRTL) }]}
                    onPress={() => handleCollectionStatusConfirm("paid")}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <>
                            <MaterialIcons 
                                name="cloud-done" 
                                size={20} 
                                color="white" 
                                style={getMargin(isRTL, 8)}
                            />
                            <Text style={styles.confirmButtonText}>
                                {translations[language].collections.collection.confirmPaymentTitle}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
            
            {/* Confirm returned button for business */}
            {collection.status_key === "returned_out" && user.role === "business" && (
                <TouchableOpacity 
                    style={[styles.confirmButton, { flexDirection: getFlexDirection(isRTL) }]}
                    onPress={() => handleCollectionStatusConfirm("returned_delivered")}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <>
                            <MaterialIcons 
                                name="cloud-done" 
                                size={20} 
                                color="white" 
                                style={getMargin(isRTL, 8)}
                            />
                            <Text style={styles.confirmButtonText}>
                                {translations[language].collections.collection.confirmReturnedTitle}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    collectionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        backgroundColor: 'rgba(67, 97, 238, 0.05)',
    },
    idSection: {
        flex: 1,
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    idLabel: {
        fontSize: 14,
        color: '#64748B',
        marginRight: 4,
    },
    idText: {
        fontWeight: '700',
        fontSize: 16,
        color: '#4361EE',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 100,
    },
    statusText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    userInfoSection: {
        marginBottom: 8,
    },
    infoSection: {
        backgroundColor: 'rgba(249, 250, 251, 1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 4,
    },
    sectionValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    actionIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4361EE',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        margin: 16,
        marginTop: 0,
        padding: 12,
        borderRadius: 12,
        shadowColor: "#10B981",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    modalHeaderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    modalIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
});