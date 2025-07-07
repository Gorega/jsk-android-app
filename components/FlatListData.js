import { FlatList, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import React from 'react';

function FlatListDataComponent({ 
    list, 
    loadMoreData, 
    loadingMore, 
    children, 
    refreshControl,
    renderItem,
    keyExtractor,
    ...props 
}) {
    // Handle both function children and renderItem prop for backwards compatibility
    const renderItemFunction = renderItem || (({ item }) => children(item));
    const extractKey = keyExtractor || (item => String(item.id || Math.random()));

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#4361EE" />
                <Text style={styles.loadingText}>Loading more...</Text>
            </View>
        );
    };

    return (
        <FlatList
            data={list}
            renderItem={renderItemFunction}
            keyExtractor={extractKey}
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={refreshControl}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            {...props}
        />
    );
}

const FlatListData = React.memo(FlatListDataComponent);

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