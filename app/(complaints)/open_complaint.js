import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, router } from 'expo-router';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { getToken } from '../../utils/secureStore';
import { LinearGradient } from 'expo-linear-gradient';

const SubmitComplaint = () => {
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submitComplaint = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert(
        translations[language].complaints.error, 
        translations[language].complaints.errorValidationMsg,
        [{ text: translations[language].complaints.ok || 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken("userToken");
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints?language_code=${language}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": token ? `token=${token}` : ""
        },
        body: JSON.stringify({
          order_id: orderId,
          subject,
          description,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert(
          translations[language].complaints.success, 
          translations[language].complaints.successMsg,
          [{ 
            text: translations[language].complaints.ok || 'OK',
            onPress: () => router.back()
          }]
        );
        setSubject('');
        setDescription('');
      } else {
        Alert.alert(
          translations[language].complaints.error,
          translations[language].complaints.errorMsg,
          [{ text: translations[language].complaints.ok || 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        translations[language].complaints.error, 
        translations[language].complaints.errorFailed,
        [{ text: translations[language].complaints.ok || 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Order ID Card */}
        <LinearGradient
          colors={['#4361EE', '#3A0CA3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orderCard}
        >
          <View style={[styles.orderCardContent]}>
            <View style={styles.orderIconContainer}>
              <Feather name="package" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.orderLabel}>
                {translations[language].complaints.order || 'Order'}
              </Text>
              <Text style={styles.orderIdText}>#{orderId}</Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={[styles.title]}>
          {translations[language].complaints.openComplaint}
        </Text>

        <View style={styles.formContainer}>
          {/* Subject Input */}
          <View style={styles.inputWrapper}>
            <View style={[styles.inputLabelContainer]}>
              <MaterialIcons name="subject" size={18} color="#4361EE" />
              <Text style={[styles.inputLabel]}>
                {translations[language].complaints.subject}
              </Text>
            </View>
            <TextInput
              style={[styles.input]}
              placeholder={translations[language].complaints.subjectPlaceholder || 'Enter subject'}
              placeholderTextColor="#94A3B8"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputWrapper}>
            <View style={[styles.inputLabelContainer]}>
              <MaterialIcons name="description" size={18} color="#4361EE" />
              <Text style={[styles.inputLabel]}>
                {translations[language].complaints.describe}
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={translations[language].complaints.describePlaceholder || 'Describe your issue'}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.buttonContainer} 
            onPress={submitComplaint} 
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4361EE', '#3A0CA3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={[styles.buttonContent]}>
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.buttonText}>{translations[language].complaints.submit}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    padding: 20,
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  orderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap:10
  },
  orderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  orderLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  orderIdText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#1F2937",
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  input: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: "#1F2937",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    paddingVertical: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: 'center',
  },
});

export default SubmitComplaint;
