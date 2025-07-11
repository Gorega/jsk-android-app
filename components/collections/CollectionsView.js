import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Collection from './Collection';
import FlatListData from '../FlatListData';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import React from 'react';

// Create a memoized CollectionItem component to prevent unnecessary re-renders
const CollectionItem = React.memo(function CollectionItem({ item, type }) {
    return (
        <View style={styles.order}>
            <Collection type={type} collection={item} />
        </View>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if the collection_id or status changes
    return prevProps.item.collection_id === nextProps.item.collection_id && 
           prevProps.item.status_key === nextProps.item.status_key &&
           prevProps.type === nextProps.type;
});

export default function CollectionsView({data, type, loadMoreData, loadingMore, refreshControl, isLoading}){
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const isRTL = ["he", "ar"].includes(language);

    // Memoize the renderCollectionItem function to prevent recreating it on each render
    const renderCollectionItem = React.useCallback(({ item }) => {
        return <CollectionItem item={item} type={type} />;
    }, [type]);

    // Memoize the keyExtractor function with a more reliable unique key strategy
    const keyExtractor = React.useCallback((item, index) => {
        // Use a combination of collection_id and index to ensure uniqueness
        // If collection_id is not available, use a fallback to index
        return `collection-${item.collection_id || ''}-${index}`;
    }, []);

    if (isLoading) {
        return (
            <View style={[
                styles.overlay,
                { backgroundColor: isDark ? 'rgba(26, 26, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
            ]}>
                <View style={[
                    styles.spinnerContainer,
                    { backgroundColor: colors.card }
                ]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    return data.length > 0
    ?
    <FlatListData
        list={data || []}
        loadMoreData={loadMoreData}
        loadingMore={loadingMore}
        renderItem={renderCollectionItem}
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
        <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="package-variant" size={40} color={colors.primary} />
        </View>
        <Text style={[
            styles.emptyText, 
            isRTL && styles.textRTL,
            { color: colors.text }
        ]}>
            {translations[language].collections.emptyArray}
        </Text>
    </View>
}

const styles = StyleSheet.create({
    empty:{
      fontWeight:"600",
      margin:"auto",
      textAlign:"center",
      marginTop:50,
      justifyContent:"center",
      alignItems:"center"
    },
    emptyText: {
      fontSize: 16,
      marginTop: 12,
      fontWeight: "500",
    },
    scrollView:{
        flex:1,
    },
    order:{
        padding:15,
    },
    textRTL: {
        textAlign: 'right',
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
})