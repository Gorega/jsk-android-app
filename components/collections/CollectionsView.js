import { View,Text,StyleSheet, ActivityIndicator } from 'react-native';
import Collection from './Collection';
import FlatListData from '../FlatListData';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function OrdersView({data,type,loadMoreData,loadingMore,refreshControl, isLoading}){
    const { language } = useLanguage();
    const isRTL = ["he", "ar"].includes(language);


    if (isLoading) {
        return (
            <View style={styles.overlay}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#4361EE" />
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
        children={(item)=> (
            <View style={styles.order}>
                <Collection type={type} collection={item} />
            </View>
        )}
        refreshControl={refreshControl}
    />
    :
    <View style={styles.empty}>
        <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="package-variant" size={40} color="#4361EE" />
        </View>
        <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
})