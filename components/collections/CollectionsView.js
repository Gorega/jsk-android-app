import { View,StyleSheet, ScrollView} from 'react-native';
import Collection from './Collection';

export default function OrdersView(){
    return <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.collections}>
            {Array.from({length:6}).map((_,index)=>{
                return <Collection key={index} />
        })}
    </View>
</ScrollView>
}


const styles = StyleSheet.create({
    scrollView:{
        flex:1
    },
    collections:{
        padding:15,
    }

})