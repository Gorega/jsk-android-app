import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Modal, ScrollView } from "react-native"
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import { translations } from '../utils/languageContext';
import { useLanguage } from '../utils/languageContext';
import { RTLWrapper } from '@/utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';

export default function CheckReceiver() {
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const searchReceivers = async () => {
        if (!value.trim()) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/receivers?exact_phone=${encodeURIComponent(value)}&language_code=${language}&exact=true`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json",
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch receivers');
            }

            const data = await response.json();
            setSearchResults(data.data || []);
            setShowModal(true);
        } catch (err) {
            setError(translations[language]?.tabs?.orders?.create?.sections?.client?.fields?.search_error || 'Error searching for receiver');
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setValue("");
    };

    return <RTLWrapper>
        <View style={[styles.container, {
            ...Platform.select({
                ios: {
                    flexDirection: "column",
                    alignItems: isRTL ? "flex-start" : ""
                }
            }),
            backgroundColor: isDark ? colors.surface : undefined,
        }]}>
            <Text style={[styles.h2, { color: colors.text }]}>
                {translations[language]?.check?.receiver?.title || 'Check Receiver'}
            </Text>
            <Text style={[styles.onPress, { color: colors.textSecondary }]}>
                {translations[language]?.check?.receiver?.desc || 'Enter phone number to check if receiver exists'}
            </Text>
            <View style={[styles.flex]}>
                <View style={[styles.inputBox, {
                    backgroundColor: colors.card,
                    borderColor: colors.border
                }]}>
                    <Feather name="user" size={24} color={colors.iconDefault} />
                    <TextInput
                        style={[styles.input, {
                            ...Platform.select({
                                ios: {
                                    textAlign: isRTL ? "right" : ""
                                }
                            }),
                            color: colors.text
                        }]}
                        placeholder={translations[language]?.check?.receiver?.placeholder || 'Enter phone number'}
                        placeholderTextColor={colors.textTertiary}
                        value={value}
                        onChangeText={(input) => setValue(input)}
                        keyboardType="phone-pad"
                        returnKeyType="search"
                        onSubmitEditing={searchReceivers}
                    />
                </View>
                <TouchableOpacity 
                    style={[styles.button, {
                        backgroundColor: colors.buttonPrimary
                    }]} 
                    onPress={searchReceivers}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.buttonText} />
                    ) : (
                        <MaterialIcons name="search" size={24} color={colors.buttonText} />
                    )}
                </TouchableOpacity>
            </View>
            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}

            <Modal
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, {
                        backgroundColor: isDark ? colors.card : '#ffffff'
                    }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {translations[language]?.check?.receiver?.results || 'Receiver Results'}
                            </Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.resultsContainer}>
                            {searchResults.length === 0 ? (
                                <View style={styles.noResultsContainer}>
                                    <Feather name="user-x" size={48} color={colors.textSecondary} />
                                    <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                                        {translations[language]?.check?.receiver?.noResults || 'No receiver found with this phone number'}
                                    </Text>
                                </View>
                            ) : (
                                searchResults.map((receiver, index) => (
                                    <View 
                                        key={receiver.id || receiver.receiver_id || index} 
                                        style={[styles.receiverCard, {
                                            backgroundColor: isDark ? colors.surface : '#f8f9fa',
                                            borderColor: colors.border
                                        }]}
                                    >
                                        <View style={styles.receiverHeader}>
                                            <View style={styles.receiverIconContainer}>
                                                <Feather name="user-check" size={20} color="#ffffff" />
                                            </View>
                                            <Text style={[styles.receiverName, { color: colors.text },{
                                                ...Platform.select({
                                                    ios: {
                                                        textAlign:isRTL ? "left" : ""
                                                    }
                                                }),
                                            }]}>
                                                {receiver.name || 'Unknown'}
                                            </Text>
                                            
                                            {receiver.percentage !== undefined && (
                                                <View style={[styles.percentageBadge, {
                                                    backgroundColor: receiver.percentage >= 90 
                                                        ? '#10b981' 
                                                        : receiver.percentage >= 70 
                                                            ? '#f59e0b' 
                                                            : '#ef4444'
                                                }]}>
                                                    <Text style={styles.percentageText}>
                                                        {receiver.percentage}%
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        
                                        <View style={styles.receiverDetails}>
                                            <View style={styles.detailRow}>
                                                <Feather name="phone" size={16} color={colors.iconDefault} />
                                                <Text style={[styles.detailText, { color: colors.text }]}>
                                                    {receiver.phone || '-'}
                                                </Text>
                                            </View>
                                            
                                            {receiver.phone_2 && (
                                                <View style={styles.detailRow}>
                                                    <Feather name="phone-call" size={16} color={colors.iconDefault} />
                                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                                        {receiver.phone_2}
                                                    </Text>
                                                </View>
                                            )}
                                            
                                            {receiver.address && (
                                                <View style={styles.detailRow}>
                                                    <Feather name="map-pin" size={16} color={colors.iconDefault} />
                                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                                        {receiver.address}
                                                    </Text>
                                                </View>
                                            )}
                                            
                                            {receiver.city && (
                                                <View style={styles.detailRow}>
                                                    <Feather name="home" size={16} color={colors.iconDefault} />
                                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                                        {receiver.city}
                                                    </Text>
                                                </View>
                                            )}
                                            
                                            {receiver.orders_count !== undefined && (
                                                <View style={[styles.statsContainer, { borderColor: colors.border }]}>
                                                    <View style={styles.statItem}>
                                                        <Text style={[styles.statValue, { color: colors.text }]}>
                                                            {receiver.orders_count}
                                                        </Text>
                                                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                                            {translations[language]?.check?.receiver?.totalOrders || 'Total Orders'}
                                                        </Text>
                                                    </View>
                                                    
                                                    <View style={styles.statItem}>
                                                        <Text style={[styles.statValue, { color: colors.text }]}>
                                                            {receiver.returned_orders_count}
                                                        </Text>
                                                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                                            {translations[language]?.check?.receiver?.returnedOrders || 'Returned'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                            
                                            {/* Comment section with beautiful design */}
                                            {receiver.comment && (
                                                <View style={[styles.commentContainer, { 
                                                    backgroundColor: isDark ? 'rgba(67, 97, 238, 0.1)' : 'rgba(67, 97, 238, 0.05)',
                                                    borderColor: 'rgba(67, 97, 238, 0.3)'
                                                }]}>
                                                    <View style={styles.commentHeader}>
                                                        <MaterialIcons name="comment" size={16} color="#4361EE" />
                                                        <Text style={styles.commentTitle}>
                                                            {translations[language]?.check?.receiver?.comment || 'Comment'}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.commentText, { color: colors.text },{
                                                        ...Platform.select({
                                                            ios: {
                                                                textAlign:isRTL ? "left" : ""
                                                            }
                                                        }),
                                                    }]}>
                                                        {receiver.comment}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    </RTLWrapper>
}

const styles = StyleSheet.create({
    container: {
        padding: 15,
        borderRadius: 12,
    },
    h2: {
        fontSize: 17,
        fontWeight: "500"
    },
    onPress: {
        fontSize: 13,
        marginTop: 5,
        marginBottom: 5,
    },
    flex: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "nowrap",
        alignItems: "center",
        gap: 15,
        marginTop: 10,
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: "white",
        width: "80%",
        height: 45,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 225, 0.8)",
    },
    input: {
        width: "85%",
        color: "#1F2937",
    },
    button: {
        backgroundColor: "#4361EE",
        padding: 10,
        borderRadius: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#4361EE',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    errorText: {
        color: '#ef4444',
        marginTop: 8,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    resultsContainer: {
        padding: 16,
        maxHeight: 500,
    },
    noResultsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    noResultsText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    receiverCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    receiverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    receiverIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    receiverName: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    percentageBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#10b981',
    },
    percentageText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    receiverDetails: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: '#e5e7eb',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    // New styles for comment section
    commentContainer: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(67, 97, 238, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(67, 97, 238, 0.3)',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    commentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4361EE',
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
}); 