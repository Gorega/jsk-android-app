import { View,Text,StyleSheet} from 'react-native';
import FlatListData from '../FlatListData';
import Order from './Order';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function OrdersView({data,metadata,loadMoreData,loadingMore}){

    return data.length > 0
    ?
    <FlatListData
        list={data || []}
        loadMoreData={loadMoreData}
        loadingMore={loadingMore}
        children={(item)=> (
            <View style={styles.orders}>
                 <Order user={metadata} order={item} />
            </View>
        )}
    />
    :
    <View style={styles.empty}>
        <MaterialCommunityIcons name="exclamation" size={24} color="black" />
        <Text style={{fontWeight:500}}>No Orders to show</Text>
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
    }

})