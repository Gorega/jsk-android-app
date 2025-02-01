import { View,StyleSheet} from 'react-native';
import Search from '../../components/search/Search';
import CollectionsView from '../../components/collections/CollectionsView';

export default function HomeScreen(){
    return <View style={styles.main}>
    <Search />
    <View style={styles.section}>
        <CollectionsView />
    </View>
</View>
}

const styles = StyleSheet.create({
    main:{
        height:"100%"
    },
    section:{
        marginTop:15,
        flex:1
    }

})