import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  RefreshControl 
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "../_layout";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';

export default function ComplaintDetails() {
  const socket = useSocket();
  const { language } = useLanguage();
  const { complaintId } = useLocalSearchParams();
  const {user} = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch complaint details along with its messages
  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${complaintId}?language_code=${language}`, {
        credentials: "include"
      });
      const data = await response.json();
      // The backend returns the complaint details and an array of messages.
      setComplaint(data);
      setMessages(data.messages || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaintId,language]);

  // Pull-to-refresh functionality
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaintDetails().then(() => setRefreshing(false));
  }, [complaintId]);

  // Map complaint status to colors
  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "#FF9800";
      case "in_progress": return "#3F51B5";
      case "closed": return "#4CAF50";
      default: return "#9E9E9E";
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleComplaintUpdate = (notification) => {
      if (notification.complaintId === complaintId) {
        switch (notification.type) {
          case 'COMPLAINT_UPDATED':
          case 'COMPLAINT_MESSAGE_CREATED':
            fetchComplaintDetails();
            break;
        }
      }
    };

    socket.on('complaintUpdate', handleComplaintUpdate);

    return () => {
      socket.off('complaintUpdate', handleComplaintUpdate);
    };
  }, [socket, complaintId]);

  // Send a new message (uses the complaintMessageSchema defined in your backend)
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${complaintId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: newMessage,
          sender_type: user.role === "business" ? "business_user" : "support_agent"
        })
      });
      if (response.ok) {
        const newMsg = await response.json();
        // Append the new message to the current list
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage("");
        if (socket) {
          socket.emit('complaintUpdate', {
            type: 'COMPLAINT_MESSAGE_CREATED',
            complaintId: complaintId,
            messageId: newMsg.message_id
          });
        }
      } else {
        const errorData = await response.json();
        console.error("Error sending message:", errorData);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading){
    return <View style={styles.overlay}>
        <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#F8C332" />
        </View>
    </View>
  }

  if (!complaint) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{translations[language].complaints.notFound}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Complaint Information Card */}
      <View style={styles.card}>
        <Text style={[styles.subject,{textAlign:["ar","he"].includes(language) ? "right" : "left"}]}>{complaint.subject}</Text>
        <Text style={[styles.description,{textAlign:["ar","he"].includes(language) ? "right" : "left"}]}>{complaint.description}</Text>
        <View style={[styles.row,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
          <Text style={styles.label}>{translations[language].complaints.orderId}:</Text>
          <Text style={styles.value}>#{complaint.order_id}</Text>
        </View>
        <View style={[styles.row,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
          <Text style={styles.label}>{translations[language].complaints.status.title}:</Text>
          <Text style={[styles.status, { color: getStatusColor(complaint.status) }]}>{complaint.status}</Text>
        </View>
        <View style={[styles.row,{flexDirection:["ar","he"].includes(language) ? "row-reverse" : "row"}]}>
          <Text style={styles.label}>{translations[language].complaints.createdAt}:</Text>
          <Text style={styles.value}>{new Date(complaint.created_at).toLocaleString()}</Text>
        </View>
      </View>

      {/* Messages Section */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.message_id.toString()}
        renderItem={({ item }) => (
          <View 
            style={[
              styles.messageContainer, 
              item.sender_type === "business_user" ? styles.userMessage : styles.agentMessage
            ]}
          >
            <Text style={styles.messageSender}>
              {item.sender_name || (item.sender_type === 'business_user' ? 'Customer' : 'Support Agent')}
            </Text>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Send New Message */}
      <View style={[styles.inputContainer]}>
        <TextInput
          style={styles.input}
          placeholder={translations[language].complaints.messagePlaceholder}
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={sending}>
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    textAlign: "center",
    color: "#F44336",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  subject: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  messagesList: {
    paddingBottom: 20,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  agentMessage: {
    backgroundColor: "#E0E0E0",
    alignSelf: "flex-start",
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#555",
  },
  messageText: {
    fontSize: 14,
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#F8C332",
    padding: 10,
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
},
spinnerContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
}
});
