import { View,Text,StyleSheet, ActivityIndicator} from 'react-native';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import FlatListData from '../FlatListData';
import User from "./User";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function UsersView({data,loadMoreData,loadingMore,refreshControl,isLoading}){
    const { language } = useLanguage();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4361EE" />
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
            <View style={styles.orders}>
                <User user={item} />
            </View>
        )}
        refreshControl={refreshControl}
    />
    :
    <View style={styles.empty}>
        <MaterialCommunityIcons name="exclamation" size={24} color="black" />
        <Text style={{fontWeight:'500'}}>{translations[language].users.emptyArray}</Text>
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
        flex:1
    },
    orders:{
        padding:15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})