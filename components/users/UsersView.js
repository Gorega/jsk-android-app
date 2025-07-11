import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FlatListData from '../FlatListData';
import User from "./User";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import React from 'react';

// Create a memoized UserItem component to prevent unnecessary re-renders
const UserItem = React.memo(function UserItem({ item }) {
    return (
        <View style={styles.orders}>
            <User user={item} />
        </View>
    );
}, (prevProps, nextProps) => {
    // Only re-render if the user_id or active_status changes
    return prevProps.item.user_id === nextProps.item.user_id &&
           prevProps.item.active_status === nextProps.item.active_status;
});

export default function UsersView({data, loadMoreData, loadingMore, refreshControl, isLoading}) {
    const { language } = useLanguage();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    // Memoize the renderUserItem function to prevent recreating it on each render
    const renderUserItem = React.useCallback(({ item }) => {
        return <UserItem item={item} />;
    }, []);

    // Memoize the keyExtractor function with a more reliable unique key strategy
    const keyExtractor = React.useCallback((item, index) => {
        // Use a combination of user_id and index to ensure uniqueness
        return `user-${item.user_id || ''}-${index}`;
    }, []);

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return data.length > 0
    ?
    <FlatListData
        list={data || []}
        loadMoreData={loadMoreData}
        loadingMore={loadingMore}
        renderItem={renderUserItem}
        keyExtractor={keyExtractor}
        refreshControl={refreshControl}
        // Add these props to optimize FlatList performance
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        initialNumToRender={5}
    />
    :
    <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="exclamation" size={24} color={colors.textSecondary} />
        <Text style={{ fontWeight: '500', color: colors.text }}>
            {translations[language].users.emptyArray}
        </Text>
    </View>
}

const styles = StyleSheet.create({
    empty:{
      fontWeight: "600",
      margin: "auto",
      textAlign: "center",
      marginTop: 50,
      justifyContent: "center",
      alignItems: "center"
    },
    scrollView:{
        flex: 1
    },
    orders:{
        padding: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})