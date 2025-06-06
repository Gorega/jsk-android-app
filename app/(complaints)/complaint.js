import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList, 
  TextInput, 
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useSocket } from '../../utils/socketContext';
import { getToken } from "../../utils/secureStore";
import { LinearGradient } from 'expo-linear-gradient';
import { useRTLStyles } from '../../utils/RTLWrapper';

export default function ComplaintDetails() {
  const socket = useSocket();
  const { language } = useLanguage();
  const { complaintId } = useLocalSearchParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const rtl = useRTLStyles();

  // Fetch complaint details along with its messages
  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken("userToken");
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${complaintId}?language_code=${language}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cookie": token ? `token=${token}` : ""
        }
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
  }, [complaintId, language]);

  // Pull-to-refresh functionality
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaintDetails().then(() => setRefreshing(false));
  }, [complaintId]);

  // Map complaint status to colors and gradients
  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return { 
          color: "#FF9800", 
          icon: "timer-outline",
          gradient: ['#FF9800', '#F57C00']
        };
      case "in_progress":
        return { 
          color: "#3F51B5", 
          icon: "trending-up",
          gradient: ['#3F51B5', '#303F9F']
        };
      case "closed":
        return { 
          color: "#4CAF50", 
          icon: "checkmark-circle-outline",
          gradient: ['#4CAF50', '#388E3C']
        };
      default:
        return { 
          color: "#9E9E9E", 
          icon: "help-circle-outline",
          gradient: ['#9E9E9E', '#757575']
        };
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

  // Format date in a user-friendly way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date and time
    return date.toLocaleDateString(language, { day: 'numeric', month: 'short' }) + ' ' + 
           date.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
  };

  // Send a new message (uses the complaintMessageSchema defined in your backend)
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = await getToken("userToken");
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/${complaintId}/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cookie": token ? `token=${token}` : ""
        },
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
      } else {
        const errorData = await response.json();
      }
    } catch (error) {
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ActivityIndicator size="large" color="#4361EE" />
        <Text style={styles.loadingText}>
          {translations[language]?.complaints.loading || 'Loading...'}
        </Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Image 
          source={""} 
          style={styles.errorImage}
          resizeMode="contain"
        />
        <Text style={styles.errorTitle}>
          {translations[language]?.complaints?.notFoundTitle || 'Not Found'}
        </Text>
        <Text style={styles.errorText}>
          {translations[language]?.complaints?.notFound || 'Complaint not found'}
        </Text>
        <TouchableOpacity 
          style={styles.errorButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4361EE', '#3A0CA3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.errorButtonGradient}
          >
            <Feather name="arrow-left" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.errorButtonText}>
              {translations[language]?.complaints?.goBack || 'Go Back'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(complaint.status);

  return (
    <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        {/* Complaint Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.complaintHeader}>
            <LinearGradient
              colors={statusInfo.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusBadge}
            >
              <Ionicons name={statusInfo.icon} size={14} color="white" />
              <Text style={styles.statusText}>{complaint.status}</Text>
            </LinearGradient>
            
            <View style={styles.complaintId}>
              <Text style={styles.complaintIdText}>
                #{complaintId}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.subject,{
                  ...Platform.select({
                      ios: {
                          flexDirection:"column",
                          textAlign:rtl.isRTL ? "left" : "right"
                      }
                  }),
              }]}>
            {complaint.subject}
          </Text>
          
          <View style={[styles.descriptionContainer,{
                  ...Platform.select({
                      ios: {
                          flexDirection:"column",
                          alignItems:rtl.isRTL ? "flex-start" : "flex-end"
                      }
                  }),
              }]}>
            <Text style={[styles.descriptionLabel]}>
              {translations[language]?.complaints?.issue || 'Issue'}
            </Text>
            <Text style={[styles.description]}>
              {complaint.description}
            </Text>
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={[styles.detailRow]}>
              <View style={[styles.detailIconContainer]}>
                <Feather name="package" size={16} color="#4361EE" />
              </View>
              <Text style={styles.detailLabel}>
                {translations[language]?.complaints?.orderId || 'Order ID'}:
              </Text>
              <Text style={styles.detailValue}>#{complaint.order_id}</Text>
            </View>
            
            <View style={[styles.detailRow]}>
              <View style={[styles.detailIconContainer]}>
                <Feather name="calendar" size={16} color="#4361EE" />
              </View>
              <Text style={styles.detailLabel}>
                {translations[language]?.complaints?.createdAt || 'Created'}:
              </Text>
              <Text style={styles.detailValue}>{formatDate(complaint.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Messages Section */}
        <View style={styles.messagesContainer}>
          <View style={[styles.sectionHeader]}>
            <Feather name="message-circle" size={18} color="#4361EE" />
            <Text style={styles.sectionTitle}>
              {translations[language]?.complaints?.conversation || 'Conversation'}
            </Text>
          </View>
          
          {messages.length === 0 ? (
            <View style={styles.noMessagesContainer}>
              <Feather name="message-square" size={40} color="#CBD5E1" />
              <Text style={styles.noMessagesText}>
                {translations[language]?.complaints?.noMessages || 'No messages yet'}
              </Text>
              <Text style={styles.noMessagesSubtext}>
                {translations[language]?.complaints?.startConversation || 'Start the conversation by sending a message'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.message_id.toString()}
              renderItem={({ item }) => {
                const isUserMessage = item.sender_type === "business_user";
                return (
                  <View style={[
                    styles.messageContainer,
                    isUserMessage ? styles.userMessage : styles.agentMessage,
                    isUserMessage ? { alignSelf: 'flex-start' } : null,
                    !isUserMessage ? { alignSelf: 'flex-end' } : null
                  ]}>
                    <View style={[
                      styles.messageBubble,
                      isUserMessage ? styles.userBubble : styles.agentBubble
                    ]}>
                      <Text style={styles.messageSender}>
                        {item.sender_name || (isUserMessage ? (translations[language]?.complaints?.you || 'You') : (translations[language]?.complaints?.supportAgent || 'Support Agent'))}
                      </Text>
                      <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                    <Text style={[
                      styles.messageTime,
                      { textAlign: rtl.isRTL ? (isUserMessage ? 'left' : 'right') : (isUserMessage ? 'right' : 'left') }
                    ]}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                );
              }}
              contentContainerStyle={styles.messagesList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4361EE"]} />
              }
              inverted={false}
            />
          )}
        </View>

        {/* Send New Message */}
        <View style={[styles.inputContainer]}>
          <TextInput
            style={[styles.input]}
            placeholder={translations[language]?.complaints?.messagePlaceholder || 'Type a message...'}
            placeholderTextColor="#94A3B8"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={styles.sendButton} 
            disabled={sending || !newMessage.trim()}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Feather name={rtl.isRTL ? "arrow-left" : "arrow-right"} size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4B5563",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  errorImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
  },
  errorButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  errorButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  errorButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  complaintHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap:10
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 10,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12
  },
  complaintId: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  complaintIdText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  subject: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  descriptionContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  detailIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center"
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  messagesContainer: {
    flex: 1,
    margin: 16,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  noMessagesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  noMessagesSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  agentMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    paddingBottom: 10,
  },
  userBubble: {
    backgroundColor: "#EFF6FF",
    borderTopRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#64748B",
  },
  messageText: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 10,
    // Add bottom padding for extra space
    paddingBottom: Platform.OS === 'ios' ? 25 : 12
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4361EE",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10,
  },
});