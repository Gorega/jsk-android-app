import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import FlatListData from '../FlatListData';
import Order from './Order';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RTLWrapper } from '@/utils/RTLWrapper';

export default function OrdersView({ data, metadata, loadMoreData, loadingMore, refreshControl, isLoading }) {
    const { language } = useLanguage();

    if (isLoading) {
        return (
            <View style={styles.overlay}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#4361EE" />
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
            children={(item) => (
                <View style={styles.orderContainer}>
                    <Order user={metadata} order={item} />
                </View>
            )}
            refreshControl={refreshControl}
        />
    ) : (
        <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="package-variant" size={40} color="#4361EE" />
            </View>
            <Text style={[styles.emptyText]}>
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