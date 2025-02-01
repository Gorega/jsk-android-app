import { View,Text,StyleSheet, FlatList,ActivityIndicator} from 'react-native';
import Order from './Order';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function OrdersView({data,metadata,loadMoreData,loadingMore}){

    return data.length > 0
    ?
    <FlatList
        style={styles.scrollView}
        data={data || []} 
        keyExtractor={(item,index) => index}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        renderItem={({ item }) => (
        <View style={styles.orders}>
            <Order user={metadata} order={item} />
        </View>
      )}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator size="small" color="#F8C332" /> : null
      }
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