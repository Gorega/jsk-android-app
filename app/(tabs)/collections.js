import { View,Text,StyleSheet, TouchableOpacity } from "react-native";
import ModalPresentation from "../../components/ModalPresentation";
import {router} from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function Collections({showModal,setShowModal}) {

  const collections = [{
    label:"Money Collection",
    link:"(collection)?type=Money",
    icon:<FontAwesome name="money" size={24} color="black" />
  },{
    label:"Driver Collection",
    link:"(collection)?type=Driver",
    icon:<FontAwesome6 name="money-bill-trend-up" size={24} color="black" />
  },{
    label:"Returned Collection",
    link:"(collection)?type=Returned",
    icon:<Octicons name="package-dependencies" size={24} color="black" />
  },{
    label:"Runsheet Collection",
    link:"(collection)?type=Runsheet",
    icon:<Feather name="truck" size={24} color="black" />
  }]

  return <ModalPresentation
  showModal={showModal}
  setShowModal={setShowModal}
  customStyles={{
    bottom:15,
  }}>
      <View style={styles.list}>
        <TouchableOpacity style={[styles.item,styles.active]}>
          <Text style={{color:"white",fontWeight:"600"}}>Collect Your Money</Text>
        </TouchableOpacity>
        {collections?.map((collection,index)=>{
          return <TouchableOpacity style={styles.item} key={index} onPress={()=> {
            router.push(collection.link)
            setShowModal(false)
          }}>
          <Text>{collection.label}</Text>
        </TouchableOpacity>
        })}
      </View>
  </ModalPresentation>
}


const styles = StyleSheet.create({
  item:{
    borderBottomColor:"rgba(0,0,0,.1)",
    borderBottomWidth:1,
    padding:15
  },
  active:{
    backgroundColor:"#F9AF39",
    borderRadius:15,
    marginBottom:10
  }
})