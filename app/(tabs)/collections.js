import { View,Text,StyleSheet, TouchableOpacity } from "react-native";
import ModalPresentation from "../../components/ModalPresentation";
import {router} from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from "../_layout";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';

export default function Collections({showModal,setShowModal}) {

  const {user} = useAuth()
  const { language } = useLanguage();

  const collections = [user.role === "business" ? {visibility:"hidden"} : {
    label:translations[language].tabs.collections.options.driver_money_collections,
    link:"(collection)?type=driver_money",
    icon:<FontAwesome name="money" size={24} color="#F8C332" />
  },user.role === "driver" ? {visibility:"hidden"} : {
    label:user.role === "business" ? translations[language].tabs.collections.options.my_money_collections : translations[language].tabs.collections.options.business_money_collections,
    link:"(collection)?type=business_money",
    icon:<FontAwesome name="money" size={24} color="#F8C332" />
  },user.role !== "business" ?{
    label:translations[language].tabs.collections.options.sent_collections,
    link:"(collection)?type=sent",
    icon:<FontAwesome6 name="money-bill-trend-up" size={24} color="#F8C332" />
  } : {visibility:"hidden"},
  user.role === "driver" ? {visibility:"hidden"} : {
    label:translations[language].tabs.collections.options.driver_returned_collections,
    link:"(collection)?type=driver_returned",
    icon:<Octicons name="package-dependencies" size={24} color="#F8C332" />
  },user.role === "business" ? {visibility:"hidden"} : {
    label:user.role === "business" ? translations[language].tabs.collections.options.my_returned_collections : translations[language].tabs.collections.options.business_returned_collections,
    link:"(collection)?type=business_returned",
    icon:<Octicons name="package-dependencies" size={24} color="#F8C332" />
  },user.role !== "business" ? {
    label:translations[language].tabs.collections.options.runsheet_collections,
    link:"(collection)?type=dispatched",
    icon:<Feather name="truck" size={24} color="#F8C332" />
  } : {visibility:"hidden"}]

  return <ModalPresentation
  showModal={showModal}
  setShowModal={setShowModal}
  customStyles={{
    bottom:15,
  }}>
      <View style={styles.list}>
        {collections?.map((collection,index)=>{
          return <TouchableOpacity style={[styles.item,{display:collection.visibility === "hidden" && "none",flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]} key={index} onPress={()=> {
            router.push(collection.link)
            setShowModal(false)
          }}>
          {collection.icon}
          <Text style={{fontWeight:500}}>{collection.label}</Text>
        </TouchableOpacity>
        })}
      </View>
  </ModalPresentation>
}


const styles = StyleSheet.create({
  item:{
    borderBottomColor:"rgba(0,0,0,.1)",
    borderBottomWidth:1,
    paddingHorizontal:7,
    paddingVertical:15,
    flexDirection:"row",
    alignItems:"center",
    gap:5,
  },
  active:{
    backgroundColor:"#F9AF39",
    borderRadius:15,
    marginBottom:10
  }
})