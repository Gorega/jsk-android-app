import React, { useRef, useEffect } from "react";
import { StyleSheet, Modal, View, Pressable, Animated, Dimensions, Platform } from "react-native";
import { useLanguage } from '../utils/languageContext';
import { RTLWrapper } from '../utils/RTLWrapper';
import { useTheme } from '../utils/themeContext';
import { Colors } from '../constants/Colors';

export default function ModalPresentation({ 
  children, 
  showModal, 
  setShowModal, 
  customStyles,
  animationType = "fade",
  backdropOpacity = 0.5,
  closeOnBackdropPress = true,
  position = "center"
}) {
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;


  useEffect(() => {
    if (showModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showModal]);

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { justifyContent: 'flex-start', paddingTop: 80 };
      case 'bottom':
        return { justifyContent: 'flex-end', paddingBottom: 80 };
      default:
        return { justifyContent: 'center' };
    }
  };

  const getAnimationStyle = () => {
    if (position === 'bottom') {
      return {
        transform: [
          { translateY: slideAnim },
        ],
      };
    }
    if (position === 'top') {
      return {
        transform: [
          { translateY: Animated.multiply(slideAnim, -1) },
        ],
      };
    }
    return {
      opacity: fadeAnim,
      transform: [
        { scale: scaleAnim },
      ],
    };
  };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      setShowModal(false);
    }
  };

  return (
    <Modal
      visible={showModal}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={() => setShowModal(false)}
    >
      <RTLWrapper>
      <Animated.View 
        style={[
          styles.container,
          getPositionStyle(),
          { backgroundColor: `rgba(0,0,0,${backdropOpacity})`, opacity: fadeAnim }
        ]}
      >
        <Pressable
          style={[StyleSheet.absoluteFill]}
          onPress={handleBackdropPress}
        />
        <Animated.View 
          style={[
            styles.main,
            getAnimationStyle(),
            customStyles,
            position === 'bottom' && styles.bottomModal,
            position === 'top' && styles.topModal,
            { backgroundColor: colors.modalBg }
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
      </RTLWrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  main: {
    width: "90%",
    maxHeight: "90%",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
    overflow: 'hidden',
  },
  bottomModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: '100%',
    paddingBottom: 30 + (Platform.OS === 'ios' ? 10 : 0), // Extra padding for iOS devices with home indicator
  },
  topModal: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    width: '100%',
    paddingTop: 30,
  },
});