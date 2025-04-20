import { Tabs, router } from 'expo-router';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import React, { useState } from 'react';
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import Header from "../../components/Header";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Collections from './collections';
import { useAuth } from '../_layout';
import FixedHeader from "../../components/FixedHeader";

export default function TabLayout() {
  const { language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const isRTL = ["he", "ar"].includes(language);

  const tabs = [
    {
      name: "index",
      options: {
        header: () => <Header />,
        tabBarLabel: translations[language].tabs.index.title,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        ),
        tabBarActiveTintColor: "#F8C332",
        tabBarInactiveTintColor: "#6c757d",
      },
    },
    {
      name: "orders",
      options: {
        tabBarLabel: translations[language].tabs.orders.title,
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Feather name="package" size={size} color={color} />
        ),
        tabBarActiveTintColor: "#F8C332",
        tabBarInactiveTintColor: "#6c757d",
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/orders",
                params: { fromTab: true }
              });
            }}
          />
        ),
      },
    },
    {
      name: "fixed",
      options: {
        tabBarButton: () => (
          <TouchableOpacity
            style={{
              marginLeft: isRTL ? 0 : 12,
              marginRight: isRTL ? 12 : 0,
              marginTop: 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "row",
              borderColor: "#F8C332",
              borderWidth: 1,
              width: 44,
              height: 44,
              borderRadius: 50,
            }}
            onPress={() =>
              user.role === "driver"
                ? router.push("/(camera)/assignOrdersDriver")
                : router.push("(create)")
            }
          >
            <FontAwesome6 name="add" size={24} color={"black"} />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: "#F8C332",
        tabBarInactiveTintColor: "#6c757d",
      },
    },
    {
      name: "collections",
      options: {
        tabBarLabel: translations[language].tabs.collections.title,
        headerShown: false,
        tabBarButton: () => (
          <TouchableOpacity
            style={{
              marginLeft: isRTL ? 0 : 12,
              marginRight: isRTL ? 12 : 0,
              marginTop: 5,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 44,
              height: 44,
            }}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="newspaper-outline" size={24} color={"black"} />
            <Text style={{ fontSize: 9 }}>
              {translations[language].tabs.collections.title}
            </Text>
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: "#F8C332",
        tabBarInactiveTintColor: "#6c757d",
      },
    },
    {
      name: "settings",
      options: {
        header:()=>{
          return <FixedHeader title={translations[language].tabs.settings.title} showBackButton={false} />
        },
        tabBarLabel: translations[language].tabs.settings.title,
        tabBarIcon: ({ color, size }) => (
          <AntDesign name="setting" size={size} color={color} />
        ),
        tabBarActiveTintColor: "#F8C332",
        tabBarInactiveTintColor: "#6c757d",
      },
    },
  ];
  
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "#f8f9fa",
            flexDirection: isRTL ? "row-reverse" : "row",
          },
          tabBarItemStyle: {
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        }}
      >
        {isRTL
          ? tabs.slice().reverse().map((tab) => (
              <Tabs.Screen
                key={tab.name}
                name={tab.name}
                options={tab.options}
              />
            ))
          : tabs.map((tab) => (
              <Tabs.Screen
                key={tab.name}
                name={tab.name}
                options={tab.options}
              />
            ))}
      </Tabs>
      {showModal && <Collections showModal={showModal} setShowModal={setShowModal} />}
    </>
  );
}