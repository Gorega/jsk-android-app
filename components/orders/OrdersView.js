import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import FlatListData from '../FlatListData';
import Order from './Order';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RTLWrapper } from '@/utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../../RootLayout";
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from 'axios';

// Create an Onboarding component for first-time users
const OrdersOnboarding = ({ isVisible, onClose, userRole }) => {
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [currentStep, setCurrentStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Define tutorial steps based on user role
    const tutorialSteps = useMemo(() => {
        const commonSteps = [
            {
                title: translations[language]?.onboarding?.orders?.welcome?.title,
                description: translations[language]?.onboarding?.orders?.welcome?.description,
                icon: "package-variant"
            },
            {
                title: translations[language]?.onboarding?.orders?.expand?.title,
                description: translations[language]?.onboarding?.orders?.expand?.description,
                icon: "arrow-expand-vertical"
            },
            {
                title: translations[language]?.onboarding?.orders?.track?.title,
                description: translations[language]?.onboarding?.orders?.track?.description,
                icon: "map-marker-path"
            }
        ];

        // Business users can't change status but can open complaints
        if (userRole === "business") {
            return [
                ...commonSteps,
                {
                    title: translations[language]?.onboarding?.orders?.edit?.title,
                    description: translations[language]?.onboarding?.orders?.edit?.description,
                    icon: "pencil"
                },
                {
                    title: translations[language]?.onboarding?.orders?.complaint?.title,
                    description: translations[language]?.onboarding?.orders?.complaint?.description,
                    icon: "alert-circle"
                }
            ];
        }
        // Driver and delivery company roles
        else if (["driver", "delivery_company"].includes(userRole)) {
            return [
                ...commonSteps,
                {
                    title: translations[language]?.onboarding?.orders?.status?.title,
                    description: translations[language]?.onboarding?.orders?.status?.description,
                    icon: "refresh"
                },
                {
                    title: translations[language]?.onboarding?.orders?.phone?.title,
                    description: translations[language]?.onboarding?.orders?.phone?.description,
                    icon: "phone-edit"
                }
            ];
        }
        // Admin and other roles
        else {
            return [
                ...commonSteps,
                {
                    title: translations[language]?.onboarding?.orders?.status?.title,
                    description: translations[language]?.onboarding?.orders?.status?.description,
                    icon: "refresh"
                },
                {
                    title: translations[language]?.onboarding?.orders?.edit?.title,
                    description: translations[language]?.onboarding?.orders?.edit?.description,
                    icon: "pencil"
                }
            ];
        }
    }, [language, userRole]);

    useEffect(() => {
        if (isVisible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    }, [isVisible, fadeAnim]);

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isVisible) return null;

    return (
        <Animated.View
            style={[
                styles.onboardingOverlay,
                { opacity: fadeAnim, backgroundColor: colors.background + 'E6' }
            ]}
        >
            <View style={[styles.onboardingCard, { backgroundColor: colors.card }]}>
                <View style={styles.onboardingIconContainer}>
                    <MaterialCommunityIcons
                        name={tutorialSteps[currentStep].icon}
                        size={40}
                        color={colors.primary}
                    />
                </View>
                <Text style={[styles.onboardingTitle, { color: colors.text }]}>
                    {tutorialSteps[currentStep].title}
                </Text>
                <Text style={[styles.onboardingDescription, { color: colors.textSecondary }]}>
                    {tutorialSteps[currentStep].description}
                </Text>

                <View style={styles.onboardingStepIndicators}>
                    {tutorialSteps.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.stepIndicator,
                                {
                                    backgroundColor: index === currentStep
                                        ? colors.primary
                                        : colors.border
                                }
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.onboardingButtons}>
                    <TouchableOpacity
                        style={[styles.onboardingButton, styles.skipButton]}
                        onPress={handleSkip}
                    >
                        <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                            {translations[language]?.common?.skip || "Skip"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.onboardingButton,
                            styles.nextButton,
                            { backgroundColor: colors.primary }
                        ]}
                        onPress={handleNext}
                    >
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                            {currentStep < tutorialSteps.length - 1
                                ? (translations[language]?.common?.next || "Next")
                                : (translations[language]?.common?.finish || "Finish")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

// Create a memoized OrderItem component to prevent unnecessary re-renders
const OrderItem = React.memo(function OrderItem({ item, metadata, onStatusChange }) {
    return (
        <View style={styles.orderContainer}>
            <Order user={metadata} order={item} onStatusChange={onStatusChange} />
        </View>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if the order ID changes, status changes, or if metadata changes
    return prevProps.item.order_id === nextProps.item.order_id &&
        prevProps.item.status_key === nextProps.item.status_key &&
        prevProps.item.status === nextProps.item.status &&
        JSON.stringify(prevProps.metadata) === JSON.stringify(nextProps.metadata);
});

const CategorySection = React.memo(({ item, drag, isActive, toggleCategory, isExpanded, renderOrderItem, colors, styles, language }) => {
    return (
        <ScaleDecorator>
            <View>
                <TouchableOpacity
                    onLongPress={drag}
                    onPress={() => toggleCategory(item.category_name)}
                    disabled={isActive}
                    style={[
                        styles.categoryHeader,
                        isActive && { backgroundColor: colors.primary + '10', borderColor: colors.primary }
                    ]}
                >
                    <View style={styles.categoryHeaderLeft}>
                        <MaterialCommunityIcons name="folder" size={20} color={colors.primary} />
                        <Text style={[styles.categoryTitle, { color: colors.text }]}>
                            {item.category_name === '__UNCATEGORIZED__'
                                ? (translations[language]?.common?.uncategorized || "Uncategorized")
                                : item.category_name}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.badgeText}>{item.count}</Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
                {isExpanded && (
                    <View>
                        {item.orders.map((order, index) => (
                            <View key={order.order_id || `order-${index}`}>
                                {renderOrderItem({ item: order, index })}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ScaleDecorator>
    );
});

// Memoize the entire OrdersView component for better performance
const OrdersView = React.memo(function OrdersView({
    data,
    metadata,
    loadMoreData,
    loadingMore,
    refreshControl,
    isLoading,
    onStatusChange,
    onCategoryReorder
}) {
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { user: authUser } = useAuth(); // Get user directly from auth context
    const userRole = authUser?.role || "user"; // Use authUser role instead of metadata
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    // Toggle category expansion
    const toggleCategory = React.useCallback((categoryName) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryName)) {
                newSet.delete(categoryName);
            } else {
                newSet.add(categoryName);
            }
            return newSet;
        });
    }, []);

    const [groupedData, setGroupedData] = useState([]);
    const [isReordering, setIsReordering] = useState(false);
    const [localCategoryOrder, setLocalCategoryOrder] = useState([]);

    // Update groupedData when data changes, but preserve custom order
    useEffect(() => {
        if (!["driver", "delivery_company"].includes(userRole)) {
            setGroupedData([]);
            return;
        }

        if (!data || data.length === 0) {
            setGroupedData([]);
            return;
        }

        const UNCATEGORIZED_KEY = '__UNCATEGORIZED__';
        const groups = {};
        data.forEach(item => {
            const cat = item.category_name || UNCATEGORIZED_KEY;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });

        const categoryNames = Object.keys(groups);

        // If we have a local order, use it; otherwise use backend order
        let orderedCategories;
        if (localCategoryOrder.length > 0) {
            // Preserve local order, add new categories at the end
            orderedCategories = [...localCategoryOrder];
            categoryNames.forEach(cat => {
                if (!orderedCategories.includes(cat)) {
                    orderedCategories.push(cat);
                }
            });
            // Remove categories that no longer exist
            orderedCategories = orderedCategories.filter(cat => categoryNames.includes(cat));
        } else {
            // First load: use order from data (backend order)
            // Backend already sorted by driver_category_sort.sort_order
            const seenCategories = new Set();
            orderedCategories = [];
            data.forEach(item => {
                const cat = item.category_name || UNCATEGORIZED_KEY;
                if (!seenCategories.has(cat)) {
                    seenCategories.add(cat);
                    orderedCategories.push(cat);
                }
            });
            setLocalCategoryOrder(orderedCategories);
        }

        const newGroupedData = orderedCategories.map(cat => ({
            category_name: cat,
            count: groups[cat].length,
            orders: groups[cat],
            key: `cat-${cat}`
        }));

        setGroupedData(newGroupedData);
    }, [data, userRole, language]);

    const handleDragEnd = async ({ data: newData }) => {
        const newOrder = newData.map(item => item.category_name);

        // Update local state immediately
        setGroupedData(newData);
        setLocalCategoryOrder(newOrder);
        setIsReordering(true);

        try {
            await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/orders/categories/reorder`,
                { categories: newOrder },
                { withCredentials: true }
            );
            try {
                const userId = authUser?.userId || authUser?.id || 'anonymous';
                await AsyncStorage.setItem(`orders_category_order_${userId}`, JSON.stringify(newOrder));
            } catch (e) {}
            // Don't refresh - local state is already correct
        } catch (error) {
            console.error('[OrdersView] Error reordering categories:', error);
            // On error, refresh to get backend state
            if (onCategoryReorder) {
                setLocalCategoryOrder([]);
                onCategoryReorder();
            }
        } finally {
            setIsReordering(false);
        }
    };

    // Check if this is the user's first time viewing orders
    useEffect(() => {
        const checkFirstTimeUser = async () => {
            try {
                const hasSeenOnboarding = await AsyncStorage.getItem('orders_onboarding_seen');
                if (!hasSeenOnboarding) {
                    setShowOnboarding(true);
                }
            } catch (error) {
                // If there's an error reading from storage, default to showing onboarding
                setShowOnboarding(true);
            }
        };

        checkFirstTimeUser();
    }, []);

    // Handle onboarding completion
    const handleOnboardingClose = async () => {
        setShowOnboarding(false);
        try {
            await AsyncStorage.setItem('orders_onboarding_seen', 'true');
        } catch (error) {
            // Silent fail for AsyncStorage errors
        }
    };

    useEffect(() => {
        const loadSavedOrder = async () => {
            try {
                const userId = authUser?.userId || authUser?.id || 'anonymous';
                const saved = await AsyncStorage.getItem(`orders_category_order_${userId}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setLocalCategoryOrder(parsed);
                    }
                }
            } catch (e) {}
        };
        loadSavedOrder();
    }, [authUser]);

    // Memoize the renderOrderItem function to prevent recreating it on each render
    const renderOrderItem = React.useCallback(({ item }) => {
        if (item.type === 'category_header') {
            return (
                <TouchableOpacity
                    style={[styles.categoryHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                    onPress={() => toggleCategory(item.category_name)}
                    activeOpacity={0.7}
                >
                    <View style={styles.categoryHeaderLeft}>
                        <MaterialCommunityIcons
                            name={item.isExpanded ? "folder-open" : "folder"}
                            size={24}
                            color={colors.primary}
                        />
                        <Text style={[styles.categoryHeaderText, { color: colors.text }]}>
                            {item.category_name === 'Uncategorized'
                                ? (translations[language]?.tabs?.orders?.uncategorized || 'Uncategorized')
                                : item.category_name}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.badgeText, { color: colors.primary }]}>
                                {item.count}
                            </Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons
                        name={item.isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
            );
        }

        return <OrderItem item={item} metadata={metadata} onStatusChange={onStatusChange} />;
    }, [metadata, onStatusChange, toggleCategory, colors, language]);

    // Memoize the keyExtractor function
    const keyExtractor = React.useCallback((item, index) => {
        if (item.type === 'category_header') {
            return item.id;
        }
        const id = item?.order_id;
        return id != null ? `order-${id}-${index}` : `idx-${index}`;
    }, []);

    // Memoize FlatList optimization props
    const flatListProps = useMemo(() => ({
        removeClippedSubviews: false,
        maxToRenderPerBatch: 10,
        updateCellsBatchingPeriod: 50,
        windowSize: 5,
        initialNumToRender: 10,
        refreshing: refreshControl?.props?.refreshing || false,
        onRefresh: refreshControl?.props?.onRefresh,
    }), [refreshControl?.props?.refreshing, refreshControl?.props?.onRefresh]);

    const renderCategoryItem = useCallback(({ item, drag, isActive }) => {
        return (
            <CategorySection
                item={item}
                drag={drag}
                isActive={isActive}
                toggleCategory={toggleCategory}
                isExpanded={expandedCategories.has(item.category_name)}
                renderOrderItem={renderOrderItem}
                colors={colors}
                styles={styles}
                language={language}
            />
        );
    }, [toggleCategory, expandedCategories, renderOrderItem, colors, styles, language]);

    // Loading state - show loading indicator when isLoading is true
    if (isLoading) {
        return (
            <View style={[styles.overlay, {
                backgroundColor: colors.background + 'E6'
            }]}>
                <View style={[styles.spinnerContainer, {
                    backgroundColor: colors.card
                }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        {translations[language].common.loading || "Loading..."}
                    </Text>
                </View>
            </View>
        );
    }

    // Empty state - only show when not loading and data is empty
    if (!data || data.length === 0) {
        return (
            <View style={[styles.empty, { backgroundColor: colors.background }]}>
                <View style={[styles.emptyIconContainer, {
                    backgroundColor: colors.primary + '1A'
                }]}>
                    <MaterialCommunityIcons name="package-variant" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                    {translations[language].tabs.orders.empty || "No orders found"}
                </Text>
            </View>
        );
    }


    if (["driver", "delivery_company"].includes(userRole) && groupedData.length > 0) {
        return (
            <GestureHandlerRootView style={{ flex: 1 }}>
            <RTLWrapper>
                <View style={{ flex: 1 }}>
                    <DraggableFlatList
                        data={groupedData}
                        onDragEnd={handleDragEnd}
                        keyExtractor={(item) => item.key}
                        renderItem={renderCategoryItem}
                        refreshControl={refreshControl}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        onEndReached={loadMoreData}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={loadingMore ? (
                            <View style={styles.loadingMore}>
                                <View style={[styles.loadingMoreContainer, { backgroundColor: colors.card }]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[styles.loadingText, { color: colors.text }]}>
                                        {translations[language]?.common?.loading || "Loading..."}
                                    </Text>
                                </View>
                            </View>
                        ) : null}
                    />
                    <OrdersOnboarding
                        isVisible={showOnboarding}
                        onClose={handleOnboardingClose}
                        userRole={userRole}
                    />
                </View>
            </RTLWrapper>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
        <RTLWrapper>
            <View style={{ flex: 1 }}>
                <FlatListData
                    data={data}
                    loadMoreData={loadMoreData}
                    loadingMore={loadingMore}
                    refreshControl={refreshControl}
                    loading={isLoading}
                    keyExtractor={keyExtractor}
                    renderItem={renderOrderItem}
                />
                <OrdersOnboarding
                    isVisible={showOnboarding}
                    onClose={handleOnboardingClose}
                    userRole={userRole}
                />
            </View>
        </RTLWrapper>
        </GestureHandlerRootView>
    );
});

// Add display name for better debugging
OrdersView.displayName = 'OrdersView';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    spinnerContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    orderContainer: {
        marginBottom: 12,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: '80%',
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    loadingMoreContainer: {
        flexDirection: 'row',
        padding: 8,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    // Onboarding styles (kept from original as they were not explicitly removed)
    onboardingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    onboardingCard: {
        width: '85%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    onboardingIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    onboardingTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    onboardingDescription: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    onboardingStepIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    stepIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    onboardingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    onboardingButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    skipButton: {
        backgroundColor: 'transparent',
    },
    nextButton: {
        backgroundColor: '#4361EE',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Category Header Styles
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
        marginTop: 8,
        justifyContent: 'space-between',
    },
    categoryHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    categoryHeaderText: {
        fontSize: 16,
        fontWeight: '700',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
});

export default OrdersView;
