import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';

export default function AddOptionsModal({ visible, onClose, userRole }) {
  const { language } = useLanguage();

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
      <BlurView intensity={80} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader]}>
            <Text style={styles.modalTitle}>
              {translations[language]?.common?.selectOption || "Select Option"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {["driver", "delivery_company"].includes(userRole) ? (
              <>
                <TouchableOpacity
                  style={[styles.optionButton]}
                  onPress={() => handleOptionPress("/(camera)/assignOrdersDriver")}
                >
                  <LinearGradient
                    colors={['#4361EE', '#3A0CA3']}
                    style={styles.optionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Feather name="camera" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.optionText}>
                    {translations[language]?.common?.assignOrders || "Assign Orders"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton]}
                  onPress={() => handleOptionPress("/(routes)/")}
                >
                  <LinearGradient
                    colors={['#4361EE', '#3A0CA3']}
                    style={styles.optionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="route" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.optionText}>
                    {translations[language]?.routes?.title || "Routes"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleOptionPress("/(create)/")}
              >
                <LinearGradient
                  colors={['#4361EE', '#3A0CA3']}
                  style={styles.optionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="plus" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.optionText}>
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
    backgroundColor: '#FFFFFF',
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
    color: '#1E293B',
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
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
    color: '#1E293B',
  },
}); 