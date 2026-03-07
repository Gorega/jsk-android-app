import { FlatList, ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import React, { forwardRef } from 'react';

const FlatListDataComponent = forwardRef(({ 
    list, 
    data, // Support both 'list' and 'data' props
    loadMoreData, 
    loadingMore, 
    loading, // Support both 'loadingMore' and 'loading' props
    children, 
    refreshControl,
    renderItem,
    keyExtractor,
    getItemLayout,
    maintainVisibleContentPosition,
    onEndReached, // Support direct onEndReached prop
    ...props 
}, ref) => {
    // Use data or list prop (data takes precedence for new API)
    const listData = data || list || [];
    
    // Use loading or loadingMore prop
    const isLoadingMore = loadingMore || false;
    const isLoading = loading || false;
    
    // Handle both function children and renderItem prop for backwards compatibility
    const renderItemFunction = React.useCallback(
        renderItem || (({ item }) => children(item)),
        [renderItem, children]
    );
    
    // Improved key extractor with better fallback strategy
    const extractKey = React.useCallback(
        keyExtractor || ((item, index) => {
            // Try multiple common ID fields
            const id = item.id || item.collection_id || item.order_id || item._id || item.city_id;
            // Include index to ensure uniqueness even if IDs are duplicated or missing
            return `${id || 'item'}-${index}`;
        }),
        [keyExtractor]
    );

    // Memoize the onEndReached callback to prevent recreating it on each render
    const handleEndReached = React.useCallback(() => {
        
        // Use direct onEndReached prop if provided, otherwise use loadMoreData
        if (onEndReached) {
            onEndReached();
        } else if (loadMoreData && !isLoadingMore) {
            loadMoreData();
        }
    }, [onEndReached, loadMoreData, isLoadingMore, listData?.length]);

    // Create safe position config - ensure all values are valid types
    const positionConfig = Platform.OS === 'ios' ? {
        minIndexForVisible: 0,
        // Explicitly set to a number instead of null
        autoscrollToTopThreshold: 0
    } : undefined;

    return (
        <FlatList
            ref={ref}
            data={listData}
            renderItem={renderItemFunction}
            keyExtractor={extractKey}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={refreshControl}
            getItemLayout={getItemLayout}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            removeClippedSubviews={true}
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
    if (prevProps.loading !== nextProps.loading) return false;
    if (prevProps.list !== nextProps.list) return false;
    if (prevProps.data !== nextProps.data) return false;
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