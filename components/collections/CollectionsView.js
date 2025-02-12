import { View,Text,StyleSheet} from 'react-native';
import Collection from './Collection';
import FlatListData from '../FlatListData';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function OrdersView({data,type,loadMoreData,loadingMore}){
    const { language } = useLanguage();

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
    order:{
        padding:15,
    }

})