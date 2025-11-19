import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import FlatListData from '../FlatListData';
import Order from './Order';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RTLWrapper } from '@/utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../../RootLayout";

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

// Memoize the entire OrdersView component for better performance
const OrdersView = React.memo(function OrdersView({ 
    data, 
    metadata, 
    loadMoreData, 
    loadingMore, 
    refreshControl, 
    isLoading, 
    onStatusChange 
}) {
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { user: authUser } = useAuth(); // Get user directly from auth context
    const userRole = authUser?.role || "user"; // Use authUser role instead of metadata


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


    // Memoize the renderOrderItem function to prevent recreating it on each render
    const renderOrderItem = React.useCallback(({ item }) => {
        return <OrderItem item={item} metadata={metadata} onStatusChange={onStatusChange} />;
    }, [metadata, onStatusChange]);

    // Memoize the keyExtractor function
    const keyExtractor = React.useCallback((item, index) => {
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
                <Text style={[styles.emptyText, {
                    color: colors.text
                }]}>
                    {translations[language].tabs.orders.emptyArray}
                </Text>
            </View>
        );
    }

    // Data state
    return (
        <RTLWrapper>
            <FlatListData
                list={data}
                loadMoreData={loadMoreData}
                loadingMore={loadingMore}
                renderItem={renderOrderItem}
                keyExtractor={keyExtractor}
                refreshControl={refreshControl}
                {...flatListProps}
            />
            
            {/* Onboarding overlay */}
            <OrdersOnboarding 
                isVisible={showOnboarding} 
                onClose={handleOnboardingClose}
                userRole={userRole}
            />
        </RTLWrapper>
    );
});

// Add display name for better debugging
OrdersView.displayName = 'OrdersView';

const styles = StyleSheet.create({
    orderContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    empty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
        textAlign: "center",
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    spinnerContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        alignItems: 'center',
        minWidth: 150,
    },
    loadingText: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    // Onboarding styles
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
    }
});

export default OrdersView;