import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, ActivityIndicator, ScrollView, Linking } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "../../RootLayout";
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import UserBox from "../orders/userBox/UserBox";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../ModalPresentation";
import { useState } from 'react';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function Collection({ type, collection }) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [showModal, setShowModal] = useState(false);
    const [showSendersModal, setShowSendersModal] = useState(false);
    const [showPhoneOptions, setShowPhoneOptions] = useState(false);
    const [currentPhone, setCurrentPhone] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const isRTL = language === 'ar' || language === 'he';

    // Handle phone call
    const handlePhoneCall = (phoneNumber) => {
        if (!phoneNumber) return;
        Linking.openURL(`tel:${phoneNumber}`);
    };

    // Handle WhatsApp with 972 prefix
    const handleWhatsApp972 = (phoneNumber) => {
        if (!phoneNumber) return;
        const whatsappNumber = phoneNumber.startsWith('0') ? 
            phoneNumber.substring(1) : phoneNumber;
        Linking.openURL(`whatsapp://send?phone=972${whatsappNumber}`);
    };

    // Handle WhatsApp with 970 prefix
    const handleWhatsApp970 = (phoneNumber) => {
        if (!phoneNumber) return;
        const whatsappNumber = phoneNumber.startsWith('0') ? 
            phoneNumber.substring(1) : phoneNumber;
        Linking.openURL(`whatsapp://send?phone=970${whatsappNumber}`);
    };

    const handleCollectNotification = async (type, action) => {
        setIsLoading(true);
        try {
            // const token = await getToken("userToken");
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/collections/collect/request?requestType=${type}`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language,
                    // "Cookie": token ? `token=${token}` : ""
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
        if ((type === "sent" || type === "dispatched" || type === "driver_money" || type === "driver_returned") && !["driver","delivery_company"].includes(user.role)) {
            return <UserBox
                box={{
                    label: translations[language].tabs.orders.order.userDriverBoxLabel,
                    userName: type === "sent" ? collection.driver_name : collection.previous_driver_name,
                    phone: ""
                }}
            />
        }
    }

    // Get status color
    const getStatusColor = (statusKey) => {
        const statusColors = {
            "returned_in_branch": colors.primary,
            "money_in_branch": colors.primary,
            "deleted": colors.error,
            "returned_out": colors.info,
            "money_out": colors.info,
            "returned_delivered": colors.info,
            "paid": colors.info,
            "completed": colors.success,
            "pending": "#8B5CF6",
            "in_dispatched_to_branch": "#8B5CF6",
            "partial": "#8B5CF6"
        };
        
        return statusColors[statusKey] || colors.textSecondary;
    };

    return (
        <View style={[
            styles.collectionCard,
            { 
                backgroundColor: colors.card,
                shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
            }
        ]}>
            {/* Header section with ID and status */}
            <View style={[
                styles.header,
                { 
                    borderBottomColor: colors.border,
                    backgroundColor: isDark ? colors.surface : 'rgba(67, 97, 238, 0.05)'
                }
            ]}>
                <View style={styles.idSection}>
                    <View style={[styles.idContainer]}>
                        <Text style={[
                            styles.idText,
                            { color: colors.primary }
                        ]}>#{collection.collection_id}</Text>
                    </View>
                </View>
                
                <View style={[
                    styles.statusBadge, 
                    { 
                        backgroundColor: getStatusColor(type === "sent" ? collection.status : collection.status_key)
                    }
                ]}>
                    <Text style={styles.statusText}>{type === "sent" ? collection.status_label : collection.status}</Text>
                </View>
            </View>
            
            <View style={styles.contentContainer}>
                {/* User information */}
                <View style={styles.userInfoSection}>
                    {renderCollectionUser()}
                </View>
                
                {/* Order count section */}
                <View style={[
                    styles.infoSection,
                    { backgroundColor: colors.surface }
                ]}>
                    <View style={[styles.sectionRow]}>
                        <View style={[
                            styles.iconWrapper, 
                            { backgroundColor: colors.primary }
                        ]}>
                            <Feather name="package" size={20} color="#ffffff" />
                        </View>
                        <View style={[
                            styles.sectionContent,
                            {
                                ...Platform.select({
                                    ios: {
                                        alignItems: isRTL ? "flex-start" : ""
                                    }
                                }),
                            }
                        ]}>
                            <Text style={[
                                styles.sectionTitle,
                                { color: colors.textSecondary }
                            ]}>
                                {type === "sent" 
                                    ? translations[language].collections.collection.numberOfCollections 
                                    : translations[language].collections.collection.numberOfOrders}
                            </Text>
                            <Text style={[
                                styles.sectionValue,
                                { color: colors.text }
                            ]}>
                                {type === "sent" ? collection.sub_collections?.length : collection.number_of_orders}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Delivery Type section */}
                {type === "sent" && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#8B5CF6' }
                            ]}>
                                <MaterialCommunityIcons name="truck-delivery" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {translations[language]?.collections?.collection?.deliveryType || "Delivery Type"}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text }
                                ]}>
                                    {collection.delivery_type_label}
                                </Text>
                            </View>
                        </View>
                    </View>   
                )}
                
                {/* Money section */}
                {type !== "returned" && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#F72585' }
                            ]}>
                                <MaterialIcons name="attach-money" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {type === "sent" 
                                        ? translations[language].collections.collection.moneyToDeliver 
                                        : translations[language].collections.collection.moneyToCollect}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text }
                                ]}>
                                    {user.role === "business" ? collection.total_net_value : collection.total_cod_value}
                                    {type === "sent" && collection.total_net_value}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* Checks section for driver */}
                {(type === "sent" && collection.total_checks > 0) && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#3A0CA3' }
                            ]}>
                                <MaterialIcons name="attach-money" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {translations[language].collections.collection.checksToDeliver}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text }
                                ]}>
                                    {collection.total_checks}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* Branch section */}
                {(type === "returned" || type === "dispatched") && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#4CC9F0' }
                            ]}>
                                <Ionicons name="git-branch-outline" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {translations[language].collections.collection.currentBranch}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text }
                                ]}>
                                    {collection.current_branch_name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                
                {/* To branch section */}
                {type === "dispatched" && (
                    <View style={[
                        styles.infoSection,
                        { backgroundColor: colors.surface }
                    ]}>
                        <View style={[styles.sectionRow]}>
                            <View style={[
                                styles.iconWrapper, 
                                { backgroundColor: '#7209B7' }
                            ]}>
                                <Ionicons name="git-branch-outline" size={20} color="#ffffff" />
                            </View>
                            <View style={[
                                styles.sectionContent,
                                {
                                    ...Platform.select({
                                        ios: {
                                            alignItems: isRTL ? "flex-start" : ""
                                        }
                                    }),
                                }
                            ]}>
                                <Text style={[
                                    styles.sectionTitle,
                                    { color: colors.textSecondary }
                                ]}>
                                    {translations[language].collections.collection.toBranch}
                                </Text>
                                <Text style={[
                                    styles.sectionValue,
                                    { color: colors.text }
                                ]}>
                                    {collection.to_branch_name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
            
            {/* Action buttons */}
            <View style={styles.actionsContainer}>
                {type === "sent" ? (
                    <TouchableOpacity 
                        style={[
                            styles.actionButton,
                            { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }
                        ]}
                        onPress={() => setShowSendersModal(true)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.actionIconContainer,
                            { backgroundColor: colors.primary }
                        ]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color="#ffffff" />
                        </View>
                        <Text style={[
                            styles.actionText,
                            { color: colors.primary }
                        ]}>
                            {translations[language].collections.collection.collections}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[
                            styles.actionButton,
                            { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }
                        ]}
                        onPress={() => router.push({
                            pathname: "/(tabs)/orders",
                            params: { orderIds: collection.order_ids }
                        })}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.actionIconContainer,
                            { backgroundColor: colors.primary }
                        ]}>
                            <MaterialCommunityIcons name="package-variant" size={18} color="#ffffff" />
                        </View>
                        <Text style={[
                            styles.actionText,
                            { color: colors.primary }
                        ]}>
                            {translations[language].collections.collection.orders}
                        </Text>
                    </TouchableOpacity>
                )}
                
                {/* Senders Information Modal */}
                {type === "sent" && (
                    <ModalPresentation 
                        position="bottom"
                        customStyles={{maxHeight: '80%'}}
                        showModal={showSendersModal} 
                        setShowModal={setShowSendersModal}
                    >
                        <View style={[
                            styles.modalHeader,
                            { borderBottomColor: colors.border, backgroundColor: colors.card }
                        ]}>
                            <Text style={[
                                styles.modalHeaderText,
                                { color: colors.text }
                            ]}>
                                {translations[language]?.collections?.collection?.collections || "Collections"}
                            </Text>
                        </View>
                        
                        <ScrollView style={[styles.sendersScrollView, { backgroundColor: colors.background }]}>
                            {collection.sub_collections?.map((subCollection, index) => (
                                <View key={index} style={[
                                    styles.senderCard,
                                    { borderBottomColor: colors.border, backgroundColor: colors.card }
                                ]}>
                                    <View style={styles.senderHeader}>
                                        <Text style={[
                                            styles.senderName,
                                            { color: colors.text }
                                        ]}>{subCollection.business_name}</Text>
                                        <View style={[
                                            styles.senderStatusBadge, 
                                            { backgroundColor: getStatusColor(subCollection.status) }
                                        ]}>
                                            <Text style={styles.senderStatusText}>{subCollection.status_label}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.senderInfoRow}>
                                        <View style={[
                                            styles.senderIconContainer,
                                            { backgroundColor: colors.primary }
                                        ]}>
                                            <Feather name="phone" size={16} color="#ffffff" />
                                        </View>
                                        <Text style={[
                                            styles.senderInfoText,
                                            { color: colors.textSecondary }
                                        ]}>
                                            {collection.delivery_type === "package" 
                                                ? subCollection.business_phone 
                                                : subCollection.sender_phone}
                                        </Text>
                                        
                                        {/* Phone call and WhatsApp buttons */}
                                        <View style={styles.contactButtonsContainer}>
                                            <TouchableOpacity 
                                                style={[styles.contactButton, styles.callButton]}
                                                onPress={() => handlePhoneCall(collection.delivery_type === "package" 
                                                    ? subCollection.business_phone 
                                                    : subCollection.sender_phone)}
                                            >
                                                <FontAwesome name="phone" size={16} color="#ffffff" />
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                style={[styles.contactButton, styles.whatsappButton]}
                                                onPress={() => {
                                                    setCurrentPhone(collection.delivery_type === "package" 
                                                        ? subCollection.business_phone 
                                                        : subCollection.sender_phone);
                                                    setShowPhoneOptions(true);
                                                }}
                                            >
                                                <FontAwesome name="whatsapp" size={16} color="#ffffff" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.senderInfoRow}>
                                        <View style={[
                                            styles.senderIconContainer,
                                            { backgroundColor: '#10B981' }
                                        ]}>
                                            <Ionicons name="location-outline" size={16} color="#ffffff" />
                                        </View>
                                        <Text style={[
                                            styles.senderInfoText,
                                            { color: colors.textSecondary }
                                        ]}>
                                            {collection.delivery_type === "package" 
                                                ? subCollection.business_city 
                                                : subCollection.sender_city}
                                        </Text>
                                    </View>
                                    
                                    {(collection.delivery_type === "package" 
                                        ? subCollection.business_address 
                                        : subCollection.sender_address) && (
                                        <View style={styles.senderInfoRow}>
                                            <View style={[
                                                styles.senderIconContainer,
                                                { backgroundColor: '#8B5CF6' }
                                            ]}>
                                                <Ionicons name="home-outline" size={16} color="#ffffff" />
                                            </View>
                                            <Text style={[
                                                styles.senderInfoText,
                                                { color: colors.textSecondary }
                                            ]}>
                                                {collection.delivery_type === "package" 
                                                    ? subCollection.business_address 
                                                    : subCollection.sender_address}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    <View style={styles.senderInfoRow}>
                                        <View style={[
                                            styles.senderIconContainer,
                                            { backgroundColor: '#F72585' }
                                        ]}>
                                            <MaterialIcons name="attach-money" size={16} color="#ffffff" />
                                        </View>
                                        <Text style={[
                                            styles.senderInfoText,
                                            { color: colors.textSecondary }
                                        ]}>
                                            {collection.delivery_type === "package" 
                                                ? subCollection.total_cod_value 
                                                : subCollection.sender_amount}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.senderInfoRow}>
                                        <View style={[
                                            styles.senderIconContainer,
                                            { backgroundColor: '#4CC9F0' }
                                        ]}>
                                            <Feather name="package" size={16} color="#ffffff" />
                                        </View>
                                        <Text style={[
                                            styles.senderInfoText,
                                            { color: colors.textSecondary }
                                        ]}>
                                            {translations[language]?.collections?.collection?.orderCount || "Order Count"}: {subCollection.order_count}
                                        </Text>
                                    </View>
                                    
                                    {collection.delivery_type === "package" && (
                                        <View style={styles.senderInfoRow}>
                                            <View style={[
                                                styles.senderIconContainer,
                                                { backgroundColor: '#3A0CA3' }
                                            ]}>
                                                <MaterialCommunityIcons name="identifier" size={16} color="#ffffff" />
                                            </View>
                                            <Text style={[
                                                styles.senderInfoText,
                                                { color: colors.textSecondary }
                                            ]}>
                                                {translations[language]?.collections?.collection?.orderIds || "Order IDs"}: {collection.order_ids}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    </ModalPresentation>
                )}
                
                {/* WhatsApp Options Modal */}
                <ModalPresentation
                    showModal={showPhoneOptions}
                    setShowModal={setShowPhoneOptions}
                    customStyles={{ bottom: 15 }}
                    position="bottom"
                >
                    <View style={[
                        styles.modalHeader,
                        { borderBottomColor: colors.border }
                    ]}>
                        <Text style={[
                            styles.modalHeaderText,
                            { color: colors.text }
                        ]}>
                            {translations[language]?.collections?.collection?.whatsappOptions || "WhatsApp Options"}
                        </Text>
                    </View>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={[
                                styles.modalOption,
                                { borderBottomColor: colors.border }
                            ]}
                            onPress={() => {
                                handleWhatsApp972(currentPhone);
                                setShowPhoneOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                            </View>
                            <Text style={[
                                styles.modalOptionText,
                                { color: colors.text }
                            ]}>
                                {translations[language]?.collections?.collection?.whatsapp || "WhatsApp"} (972)
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[
                                styles.modalOption, 
                                styles.noBorder
                            ]}
                            onPress={() => {
                                handleWhatsApp970(currentPhone);
                                setShowPhoneOptions(false);
                            }}
                        >
                            <View style={[styles.modalIconContainer, styles.whatsappIcon]}>
                                <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                            </View>
                            <Text style={[
                                styles.modalOptionText,
                                { color: colors.text }
                            ]}>
                                {translations[language]?.collections?.collection?.whatsapp || "WhatsApp"} (970)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
                
                {/* Business package request */}
                {(user.role === "business" && collection.status_key === "returned_in_branch") && (
                    <>
                        <TouchableOpacity 
                            style={[
                                styles.actionButton,
                                { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.1)' }
                            ]}
                            onPress={() => setShowModal(true)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.actionIconContainer,
                                { backgroundColor: '#F72585' }
                            ]}>
                                <FontAwesome6 name="money-bill-trend-up" size={18} color="#ffffff" />
                            </View>
                            <Text style={[
                                styles.actionText,
                                { color: colors.primary }
                            ]}>
                                {translations[language].collections.collection.request_package}
                            </Text>
                        </TouchableOpacity>
                        
                        <ModalPresentation 
                            customStyles={{bottom: 15}} 
                            showModal={showModal} 
                            setShowModal={setShowModal}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalHeaderText]}>
                                    {translations[language]?.collections?.collection?.actions}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.modalOption]}
                                onPress={() => handleCollectNotification("package", "prepare")}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#4361EE" size="small" />
                                ) : (
                                    <>
                                        <View style={[
                                            styles.modalIconContainer,
                                            { backgroundColor: '#4361EE' }
                                        ]}>
                                            <MaterialIcons name="inventory" size={18} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.modalOptionText]}>
                                            {translations[language].collections.collection.prepare_package}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, styles.noBorder]}
                                onPress={() => handleCollectNotification("package", "send")}
                                disabled={isLoading}
                            >
                                <View style={[
                                    styles.modalIconContainer,
                                    { backgroundColor: '#F72585' }
                                ]}>
                                    <Feather name="send" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.modalOptionText]}>
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
                            style={[styles.actionButton]}
                            onPress={() => setShowModal(true)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.actionIconContainer,
                                { backgroundColor: '#F72585' }
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
                                <Text style={[styles.modalHeaderText]}>
                                    {translations[language]?.collections?.collection?.actions}
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.modalOption]}
                                onPress={() => handleCollectNotification("money", "prepare")}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#4361EE" size="small" />
                                ) : (
                                    <>
                                        <View style={[
                                            styles.modalIconContainer,
                                            { backgroundColor: '#4361EE' }
                                        ]}>
                                            <MaterialIcons name="payments" size={18} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.modalOptionText]}>
                                            {translations[language].collections.collection.prepare_money}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalOption, styles.noBorder]}
                                onPress={() => handleCollectNotification("money", "send")}
                                disabled={isLoading}
                            >
                                <View style={[
                                    styles.modalIconContainer,
                                    { backgroundColor: '#F72585' }
                                ]}>
                                    <Feather name="send" size={18} color="#ffffff" />
                                </View>
                                <Text style={[styles.modalOptionText]}>
                                    {translations[language].collections.collection.send_money}
                                </Text>
                            </TouchableOpacity>
                        </ModalPresentation>
                    </>
                )}
            </View>
            
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
        gap: 12
    },
    idLabel: {
        fontSize: 14,
        color: '#64748B'
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
        gap: 12
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
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
        gap: 12
    },
    actionIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
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
    modalContent: {
        padding: 16,
    },
    modalOption: {
        flexDirection: 'row',
        gap:12,
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
        alignItems: 'center'
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    // New styles for senders modal
    sendersScrollView: {
        maxHeight: '80%',
    },
    senderCard: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    senderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    senderName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    senderStatusBadge: {
        borderRadius: 30,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    senderStatusText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    senderInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
        gap: 12,
    },
    senderIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    senderInfoText: {
        fontSize: 14,
        color: '#4B5563',
        flex: 1,
    },
    // Contact button styles
    contactButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    contactButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        backgroundColor: '#4361EE',
    },
    whatsappButton: {
        backgroundColor: '#25D366',
    },
    whatsappIcon: {
        backgroundColor: '#25D366',
    },
});