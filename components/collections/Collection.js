import { View,StyleSheet, ScrollView,Text} from 'react-native';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function Order(){
    return <View style={styles.order}>
    <View style={styles.head}>
        <View style={styles.box}>
            <Text>10636386</Text>
        </View>
        <View style={[styles.box,styles.status]}>
            <MaterialIcons name="update" size={24} color="black" />
            <Text>Waiting</Text>
        </View>
    </View>
    <View style={styles.sec}>
        <View style={styles.in}>
            <View style={styles.flexIn}>
                <SimpleLineIcons name="user" size={24} color="black" />
                <View style={styles.info}>
                    <Text style={styles.h2}>Sender</Text>
                    <Text style={styles.p}>Ahmad Khaleel</Text>
                </View>
            </View>
            <View style={styles.icons}>
                <Entypo name="phone" size={24} color="black" />
                <Feather name="message-square" size={24} color="black" />
            </View>
        </View>
    </View>
    <View style={styles.sec}>
        <View style={styles.in}>
            <View style={styles.flexIn}>
                <Feather name="package" size={24} color="black" />
                <View style={styles.info}>
                    <Text style={styles.h2}>Orders</Text>
                    <Text style={styles.p}>4</Text>
                </View>
            </View>
        </View>
    </View>
    <View style={styles.flexSec}>
        <View style={[styles.in,styles.narrow]}>
            <View style={styles.action}>
                 <AntDesign name="printer" size={20} color="black" />
                <Text>Print</Text>
            </View>
            <View>
                <Text>|</Text>
            </View>
            <View style={styles.action}>
                <MaterialCommunityIcons name="package-variant" size={24} color="black" />
                <Text>Orders</Text>
            </View>
        </View>
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
    },
    scrollView:{
        flex:1
    },
    orders:{
        padding:15,
    },
    order:{
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        backgroundColor:"white",
        marginBottom:30,
        padding:15
    },
    control:{
        display:"flex",
        flexDirection:"row-reverse",
        alignItems:"center",
        gap:10,
        marginBottom:15,
    },
    cont:{
        display:"flex",
        flexDirection:"row",
        gap:15
    },
    status:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"center",
        gap:7
    },
    head:{
        display:"flex",
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center"
    },
    box:{
        borderRadius:15,
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        paddingHorizontal:15,
        paddingVertical:10
    },
    sec:{
        marginTop:15,
        paddingVertical:10,
        borderBottomColor:"rgba(0,0,0,.1)",
        borderBottomWidth:1
    },
    in:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:15,
        justifyContent:"space-between"
    },
    narrow:{
        justifyContent:"center",
    },
    flexIn:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:15
    },
    icons:{
        display:"flex",
        flexDirection:"row",
        gap:15
    },
    flexSec:{
        marginTop:20,
    },
    action:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:5,
    }

})