import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../utils/themeContext';
import { Colors } from '../constants/Colors';

export default function AddOptionsModal({ visible, onClose, userRole }) {
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const handleOptionPress = (path) => {
    onClose();
    router.push(path);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView 
        intensity={isDark ? 60 : 80} 
        tint={isDark ? "dark" : "light"}
        style={styles.modalOverlay}
      >
        <View style={[
          styles.modalContainer,
          { backgroundColor: colors.card }
        ]}>
          <View style={[
            styles.modalHeader
          ]}>
            <Text style={[
              styles.modalTitle,
              { color: colors.text }
            ]}>
              {translations[language]?.common?.selectOption || "Select Option"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {["driver", "delivery_company"].includes(userRole) ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => handleOptionPress("/(camera)/assignOrdersDriver")}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.optionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Feather name="camera" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[
                    styles.optionText,
                    { color: colors.text }
                  ]}>
                    {translations[language]?.common?.assignOrders || "Assign Orders"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => handleOptionPress("/(routes)/")}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.optionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="route" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[
                    styles.optionText,
                    { color: colors.text }
                  ]}>
                    {translations[language]?.routes?.title || "Routes"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.surface }
                ]}
                onPress={() => handleOptionPress("/(create)/")}
              >
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.optionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="plus" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[
                  styles.optionText,
                  { color: colors.text }
                ]}>
                  {translations[language]?.common?.createNew || "Create New"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  optionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 