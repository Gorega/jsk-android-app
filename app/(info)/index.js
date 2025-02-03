import { View,StyleSheet,Text } from "react-native";

export default function HomeScreen(){
    return <View style={styles.container}>
        <Text style={styles.h2}>About Tayar Company</Text>
        <Text style={styles.desc}>
            At Tayar, we specialize in high-quality package delivery across the West Bank, Jerusalem, and the land of 48. Our mission is to provide fast, reliable, and secure shipping solutions tailored to your needs. Whether it's business deliveries or personal shipments, we ensure every package reaches its destination safely and on time.
            With a commitment to excellence and customer satisfaction, Tayar is your trusted partner for seamless logistics. Experience hassle-free delivery with a team that prioritizes efficiency and care.
        </Text>
    </View>
}

const styles = StyleSheet.create({
    container:{
        height:"100%",
        backgroundColor:"white",
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        padding:15,
        paddingTop:25
    },
    h2:{
        fontWeight:"600",
        fontSize:17,
        marginBottom:10,
        color:"#F8C332"
    },
    desc:{
        lineHeight:20,
    }
})