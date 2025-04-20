import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../_layout';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';

const SubmitComplaint = () => {
  const socket = useSocket();
  const { language } = useLanguage();
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submitComplaint = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert(translations[language].complaints.error, translations[language].complaints.errorValidationMsg);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints?language_code=${language}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          subject,
          description,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        if (socket) {
          socket.emit('complaintUpdate', {
            type: 'COMPLAINT_CREATED',
            complaintId: result.complaint_id
          });
        }
        Alert.alert(translations[language].complaints.success, translations[language].complaints.successMsg);
        setSubject('');
        setDescription('');
      } else {
        Alert.alert(translations[language].complaints.error,translations[language].complaints.errorMsg);
      }
    } catch (error) {
      Alert.alert(translations[language].complaints.error, translations[language].complaints.errorFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title,{textAlign:["ar","he"].includes(language) ? "right" : "left"}]}>{translations[language].complaints.openComplaint} #{orderId}</Text>

      {/* Subject Input */}
      <TextInput
        style={styles.input}
        placeholder={translations[language].complaints.subject}
        value={subject}
        onChangeText={setSubject}
      />

      {/* Description Input */}
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={translations[language].complaints.describe}
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={submitComplaint} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#F8C332" />
        ) : (
          <>
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.buttonText}>{translations[language].complaints.submit}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#F8C332",
    padding: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default SubmitComplaint;
