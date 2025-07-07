import { FlatList, ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import React from 'react';

function FlatListDataComponent({ 
    list, 
    loadMoreData, 
    loadingMore, 
    children, 
    refreshControl,
    renderItem,
    keyExtractor,
    getItemLayout,
    ...props 
}) {
    // Handle both function children and renderItem prop for backwards compatibility
    const renderItemFunction = React.useCallback(
        renderItem || (({ item }) => children(item)),
        [renderItem, children]
    );
    
    const extractKey = React.useCallback(
        keyExtractor || (item => String(item.id || Math.random())),
        [keyExtractor]
    );

    // Memoize the onEndReached callback to prevent recreating it on each render
    const handleEndReached = React.useCallback(() => {
        if (loadMoreData && !loadingMore) {
            loadMoreData();
        }
    }, [loadMoreData, loadingMore]);

    // No need to memoize the list data again, as it should already be memoized by the parent component

    return (
        <FlatList
            data={list}
            renderItem={renderItemFunction}
            keyExtractor={extractKey}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2} // Lower threshold to reduce frequency of load more events
            refreshControl={refreshControl}
            getItemLayout={getItemLayout}
            initialNumToRender={5}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={50}
            windowSize={3}
            removeClippedSubviews={Platform.OS !== 'ios'} // Conditionally apply for non-iOS
            showsVerticalScrollIndicator={false}
            // Conditionally apply for non-iOS
            {...(Platform.OS !== 'ios' && {
                maintainVisibleContentPosition: {
                    minIndexForVisible: 0,
                }
            })}
            {...props}
        />
    );
}

// Use a more efficient comparison function for the memo
const FlatListData = React.memo(FlatListDataComponent, (prevProps, nextProps) => {
    // Only re-render if the list data or loading state changes
    if (prevProps.loadingMore !== nextProps.loadingMore) return false;
    if (prevProps.list !== nextProps.list) return false;
    if (prevProps.renderItem !== nextProps.renderItem) return false;
    
    // If we got here, the components are equal
    return true;
});

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