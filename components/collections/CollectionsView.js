import { View,Text,StyleSheet, ActivityIndicator } from 'react-native';
import Collection from './Collection';
import FlatListData from '../FlatListData';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function OrdersView({data,type,loadMoreData,loadingMore,refreshControl, isLoading}){
    const { language } = useLanguage();

    if (isLoading) {
        return (
            <View style={styles.overlay}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#F8C332" />
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
        <MaterialCommunityIcons name="exclamation" size={24} color="black" />
        <Text style={{fontWeight:500}}>{translations[language].collections.emptyArray}</Text>
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
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
})