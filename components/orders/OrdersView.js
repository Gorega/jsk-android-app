import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import FlatListData from '../FlatListData';
import Order from './Order';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RTLWrapper } from '@/utils/RTLWrapper';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import React from 'react';

// Create a memoized OrderItem component to prevent unnecessary re-renders
const OrderItem = React.memo(function OrderItem({ item, metadata, onStatusChange }) {
    return (
        <View style={styles.orderContainer}>
            <Order user={metadata} order={item} onStatusChange={onStatusChange} />
        </View>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if the order ID changes or if metadata changes
    return prevProps.item.order_id === nextProps.item.order_id && 
           prevProps.item.status_key === nextProps.item.status_key &&
           JSON.stringify(prevProps.metadata) === JSON.stringify(nextProps.metadata);
});

export default function OrdersView({ data, metadata, loadMoreData, loadingMore, refreshControl, isLoading, onStatusChange }) {
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    // Memoize the renderOrderItem function to prevent recreating it on each render
    const renderOrderItem = React.useCallback(({ item }) => {
        return <OrderItem item={item} metadata={metadata} onStatusChange={onStatusChange} />;
    }, [metadata, onStatusChange]);

    // Memoize the keyExtractor function
    const keyExtractor = React.useCallback((item) => item.order_id.toString(), []);

    if (isLoading) {
        return (
            <View style={[styles.overlay,{
                backgroundColor: colors.background + 'E6'
            }]}>
                <View style={[styles.spinnerContainer,{
                    backgroundColor: colors.card
                }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    return <RTLWrapper>
         {data.length > 0 ? (
        <FlatListData
            list={data || []}
            loadMoreData={loadMoreData}
            loadingMore={loadingMore}
            renderItem={renderOrderItem}
            keyExtractor={keyExtractor}
            refreshControl={refreshControl}
            // Add these props to optimize FlatList performance
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={8}
        />
    ) : (
        <View style={[styles.empty, { backgroundColor: colors.background }]}>
            <View style={[styles.emptyIconContainer,{
                backgroundColor: colors.primary + '1A'
            }]}>
                <MaterialCommunityIcons name="package-variant" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText,{
                color: colors.text
            }]}>
                {translations[language].tabs.orders.emptyArray}
            </Text>
        </View>
    )}
    </RTLWrapper>
}

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
    }
});