import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../_layout';

const SubmitComplaint = () => {
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submitComplaint = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints`, {
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
        Alert.alert("Success", "Complaint submitted successfully.");
        setSubject('');
        setDescription('');
      } else {
        console.error("Error from backend:", result);
        Alert.alert("Error", "Failed to submit complaint.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Open a Complaint for order #{orderId}</Text>

      {/* Subject Input */}
      <TextInput
        style={styles.input}
        placeholder="Subject"
        value={subject}
        onChangeText={setSubject}
      />

      {/* Description Input */}
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your complaint..."
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
            <Text style={styles.buttonText}>Submit</Text>
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
