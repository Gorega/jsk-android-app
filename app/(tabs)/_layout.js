import { Tabs, router, usePathname } from 'expo-router';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import React, { useState, useCallback } from 'react';
import { Text, TouchableOpacity, View, Platform, Animated, DeviceEventEmitter } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Header from "../../components/Header";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Collections from './collections';
import { useAuth } from "../../RootLayout";
import FixedHeader from "../../components/FixedHeader";
import { LinearGradient } from 'expo-linear-gradient';
import { RTLWrapper, useRTLStyles } from '../../utils/RTLWrapper';
import AddOptionsModal from '../../components/AddOptionsModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


export default function TabLayout() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);
  const { user } = useAuth();
  const addButtonScale = new Animated.Value(1);
  const rtl = useRTLStyles();

  // Shared navigation handler for orders tab
  const handleOrdersPress = useCallback(() => {
    // Always navigate using replace to ensure a fresh state
    router.replace({
      pathname: "/(tabs)/orders",
      params: {
        reset: Date.now() // Force a reset by adding a timestamp
      }
    });
  }, []);

  // Animation for the add button
  const animateAddButton = () => {
    Animated.sequence([
      Animated.timing(addButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScale, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddPress = () => {
    animateAddButton();
    // Reduce timeout to minimize potential timing issues
    setTimeout(() => {
      if (["driver", "delivery_company"].includes(user.role)) {
        // Show options modal for driver or delivery_company
        setShowAddOptionsModal(true);
      } else {
        router.push("/(create)/");
      }
    }, 100); // Reduced from 200ms to 100ms
  };

  const handleCollectionsPress = () => {
    animateAddButton();
    setTimeout(() => {
      setShowModal(true);
    }, 150);
  };

  // First, let's create a complete TabLabel component for better organization
  const TabLabel = ({ focused, label }) => (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%', 
      paddingHorizontal: 4,
      marginTop: -4,
    }}>
      <Text 
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          fontSize: 11,
          color: focused ? "#4361EE" : "#94A3B8",
          fontWeight: focused ? '600' : '400', // Ensure these are strings, not booleans
          textAlign: 'center',
          maxWidth: '100%',
          ...rtl.text, // Apply RTL text styling
        }}
      >
        {label}
      </Text>
    </View>
  );

  // Update the createTabBarIcon function for better spacing
  const createTabBarIcon = (Component, name, focused) => {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        height: 28,
        marginBottom: 3,
      }}>
        <Component 
          name={name} 
          size={focused ? 24 : 22} 
          color={focused ? "#4361EE" : "#94A3B8"} 
        />
      </View>
    );
  };

  // Update the tab array with these changes
  const tabs = [
    {
      name: "index",
      options: {
        header: () => <Header />,
        tabBarLabel: ({focused}) => (
          <TabLabel
            focused={focused}
            label={translations[language].tabs.index.title}
          />
        ),
        tabBarIcon: ({focused}) => createTabBarIcon(Ionicons, "home-outline", focused),
      },
    },
    {
      name: "orders",
      options: {
        tabBarLabel: ({focused}) => (
          <TabLabel
            focused={focused}
            label={translations[language].tabs.orders.title}
          />
        ),
        headerShown: false,
        tabBarIcon: ({focused}) => createTabBarIcon(Feather, "package", focused),
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={handleOrdersPress}
          />
        ),
      },
    },
    {
      name: "fixed",
      options: {
        tabBarButton: () => (
          <TouchableOpacity
            style={[
              styles.addButtonContainer,
              { marginHorizontal: Platform.OS === 'ios' ? 20 : 12 }
            ]}
            onPress={handleAddPress}
            activeOpacity={0.85}
          >
            <Animated.View
              style={[
                styles.addButtonWrapper,
                { transform: [{ scale: addButtonScale }] }
              ]}
            >
              <LinearGradient
                colors={['#4361EE', '#3A0CA3']}
                style={styles.addButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
               {["driver","delivery_company"].includes(user.role) ? <MaterialIcons name="route" size={24} color="#FFFFFF" /> : <FontAwesome6 name="plus" size={22} color="#FFFFFF" />}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        ),
      },
    },
    {
      name: "collections",
      options: {
        tabBarLabel: ({focused}) => (
          <TabLabel
            focused={focused}
            label={translations[language].tabs.collections.title}
          />
        ),
        headerShown: false,
        tabBarIcon: ({focused}) => createTabBarIcon(MaterialCommunityIcons, "text-box-outline", focused),
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={handleCollectionsPress}
          />
        ),
      },
    },
    {
      name: "settings",
      options: {
        header: () => <FixedHeader title={translations[language].tabs.settings.title} showBackButton={false} />,
        tabBarLabel: ({focused}) => (
          <TabLabel
            focused={focused}
            label={translations[language].tabs.settings.title}
          />
        ),
        tabBarIcon: ({focused}) => createTabBarIcon(AntDesign, "setting", focused),
      },
    },
  ];
  
  // Use RTL-aware styles for the tab bar
  const tabBarStyles = rtl.createStyles({
    tabBar: {
      backgroundColor: '#FFFFFF',
      flexDirection: 'row', // This will be transformed to row-reverse in RTL
      height: Platform.OS === 'ios' ? 88 : 72,
      paddingTop: Platform.OS === 'ios' ? 10 : 8,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
      elevation: 10,
    }
  });
  
  return (
    <RTLWrapper>
      <Tabs
        screenOptions={{
          tabBarStyle: tabBarStyles.tabBar,
          tabBarItemStyle: {
            paddingHorizontal: 0,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 5,
            flex: 1,
          },
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          headerShown: true,
        }}
      >
        {/* No need to reverse the tabs manually, RTLWrapper will handle it */}
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={tab.options}
          />
        ))}
      </Tabs>
      {showModal && <Collections showModal={showModal} setShowModal={setShowModal} />}
      <AddOptionsModal 
        visible={showAddOptionsModal} 
        onClose={() => setShowAddOptionsModal(false)} 
        userRole={user.role} 
      />
    </RTLWrapper>
  );
}

const styles = {
  addButtonContainer: {
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: Platform.OS === 'ios' ? 70 : 60,
  },
  addButtonWrapper: {
    borderRadius: 30,
    shadowColor: '#4361EE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4361EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
};