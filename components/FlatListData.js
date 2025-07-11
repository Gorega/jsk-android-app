import { FlatList, ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import React, { forwardRef } from 'react';

const FlatListDataComponent = forwardRef(({ 
    list, 
    loadMoreData, 
    loadingMore, 
    children, 
    refreshControl,
    renderItem,
    keyExtractor,
    getItemLayout,
    maintainVisibleContentPosition,
    ...props 
}, ref) => {
    // Handle both function children and renderItem prop for backwards compatibility
    const renderItemFunction = React.useCallback(
        renderItem || (({ item }) => children(item)),
        [renderItem, children]
    );
    
    // Improved key extractor with better fallback strategy
    const extractKey = React.useCallback(
        keyExtractor || ((item, index) => {
            // Try multiple common ID fields
            const id = item.id || item.collection_id || item.order_id || item._id;
            // Include index to ensure uniqueness even if IDs are duplicated or missing
            return `${id || 'item'}-${index}`;
        }),
        [keyExtractor]
    );

    // Memoize the onEndReached callback to prevent recreating it on each render
    const handleEndReached = React.useCallback(() => {
        if (loadMoreData && !loadingMore) {
            loadMoreData();
        }
    }, [loadMoreData, loadingMore]);

    // Create safe position config - ensure all values are valid types
    const positionConfig = Platform.OS === 'ios' ? {
        minIndexForVisible: 0,
        // Explicitly set to a number instead of null
        autoscrollToTopThreshold: 0
    } : undefined;

    return (
        <FlatList
            ref={ref}
            data={list}
            renderItem={renderItemFunction}
            keyExtractor={extractKey}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            refreshControl={refreshControl}
            getItemLayout={getItemLayout}
            initialNumToRender={5}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={50}
            windowSize={3}
            removeClippedSubviews={Platform.OS !== 'ios'}
            showsVerticalScrollIndicator={false}
            // Only apply maintainVisibleContentPosition on iOS
            {...(Platform.OS === 'ios' ? { maintainVisibleContentPosition: positionConfig } : {})}
            {...props}
        />
    );
});

// Use a more efficient comparison function for the memo
const FlatListData = React.memo(FlatListDataComponent, (prevProps, nextProps) => {
    // Only re-render if the list data or loading state changes
    if (prevProps.loadingMore !== nextProps.loadingMore) return false;
    if (prevProps.list !== nextProps.list) return false;
    if (prevProps.renderItem !== nextProps.renderItem) return false;
    
    // If we got here, the components are equal
    return true;
});

// Add display name for better debugging
FlatListData.displayName = 'FlatListData';

const styles = StyleSheet.create({
    loadingMore: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'transparent',
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4361EE',
    },
});

export default FlatListData;