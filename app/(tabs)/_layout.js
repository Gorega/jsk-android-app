import { Tabs,router } from 'expo-router';
import React, { useState } from 'react';
import {Text, TouchableOpacity} from "react-native"
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import Header from "../../components/Header";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Collections from './collections';

export default function TabLayout() {

  const [showModal,setShowModal] = useState(false);

  return (
    <>
      <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          header:()=> <Header />,
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          tabBarStyle: { backgroundColor: "#f8f9fa" },
          tabBarActiveTintColor: "#F8C332",
          tabBarInactiveTintColor: "#6c757d",
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: "Orders",
          headerShown:false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={size} color={color} />
          ),
          tabBarStyle: { backgroundColor: "#f8f9fa" },
          tabBarActiveTintColor: "#F8C332",
          tabBarInactiveTintColor: "#6c757d",
        }}
      />

      <Tabs.Screen
        name="fixed"
        options={{
          tabBarStyle: { backgroundColor: "#f8f9fa" },
          tabBarButton:()=> (
            <TouchableOpacity style={{marginLeft:12,marginTop:3,display:"flex",justifyContent:"center",alignItems:"center",flexDirection:"row",borderColor:"rgba(0,0,0,.1)",borderWidth:1,width:44,height:44,borderRadius:50}} onPress={()=> router.push("(create)")}>
               <FontAwesome6 name="add" size={24} color={"black"} />
            </TouchableOpacity>
          ),
          tabBarActiveTintColor: "#F8C332",
          tabBarInactiveTintColor: "#6c757d",
        }}
      />

    <Tabs.Screen
        name="collections"
        options={{
          tabBarLabel: "Collections",
          headerShown:false,
          tabBarButton:()=> (
            <TouchableOpacity style={{marginLeft:12,marginTop:5,display:"flex",justifyContent:"center",alignItems:"center",width:44,height:44}} onPress={()=> setShowModal(true)}>
               <Ionicons name="newspaper-outline" size={24} color={"black"} />
               <Text style={{fontSize:9}}>Collections</Text>
            </TouchableOpacity>
          ),
          tabBarStyle: { backgroundColor: "#f8f9fa" },
          tabBarActiveTintColor: "#F8C332",
          tabBarInactiveTintColor: "#6c757d",
        }}
      />

    <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="setting" size={size} color={color} />
          ),
          tabBarStyle: { backgroundColor: "#f8f9fa" },
          tabBarActiveTintColor: "#F8C332",
          tabBarInactiveTintColor: "#6c757d",
        }}
      />
    </Tabs>
    {showModal && <Collections showModal={showModal} setShowModal={setShowModal} />}
    </>
  );
}
