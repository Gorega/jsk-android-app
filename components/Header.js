import { View,StyleSheet,SafeAreaView,Image,Text, TouchableOpacity } from "react-native";
import avatar from "../assets/images/avatar2.jpg"
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from "@/app/_layout";
import { useEffect, useState } from "react";
import { translations } from '../utils/languageContext';
import { useLanguage } from '../utils/languageContext';
import { router } from "expo-router";
import { useSocket } from '../utils/socketContext';

export default function Header(){
    const socket = useSocket();
    const {user} = useAuth();
    const { language } = useLanguage();
    const [greetingMsg, setGreetingMsg] = useState("");
    const [notificationsCount,setNotificationsCount] = useState(0);

    const fetchNotificationsCount = async () => {
        try {
            console.log('Fetching notifications count for user:', user.userId);
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/count?user_id=${user.userId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            });
    
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
    
            const data = await res.json();
            console.log('Raw notification response:', data);
            setNotificationsCount(prevCount => {
                console.log('Updating count from', prevCount, 'to', data.unread_count);
                return data.unread_count;
            });
        } catch (error) {
            console.error('Error fetching notifications count:', error);
        }
    };

    const handleNotificationIcon = async () => {
        // Navigate first to ensure good UX
        router.push("/(notifications)");
    
        try {
            // Reset count on server
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/notifications/count`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: user.userId
                })
            });
    
            if (!response.ok) {
                throw new Error(await response.text());
            }
    
            // Reset local count
            setNotificationsCount(0);
    
            // Emit socket event
            socket.emit('notification', {
                type: 'NOTIFICATIONS_RESET',
                user_id: Number(user.userId),
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error resetting notifications:', error);
            // Refetch count to ensure UI is in sync
            fetchNotificationsCount();
        }
    };

    useEffect(() => {
        const currentHour = new Date().getHours();
    
        if (currentHour >= 5 && currentHour < 12) {
            setGreetingMsg(translations[language].greeting.morning);
        } else if (currentHour >= 12 && currentHour < 18) {
            setGreetingMsg(translations[language].greeting.afternoon);
        } else {
            setGreetingMsg(translations[language].greeting.evening);
        }
    }, [language,user]);

    useEffect(() => {
        if (!socket || !user) return;
    
        const handleNotification = (notification) => {
            console.log('Received socket notification:', notification);
            if (!notification || Number(user.userId) !== Number(notification.user_id)) {
                console.log('Notification skipped - user mismatch or invalid notification');
                return;
            }
    
            console.log('Processing notification type:', notification.type);
            switch (notification.type) {
                case 'NEW_NOTIFICATION':
                case 'UPDATE_COUNT':
                    console.log('Fetching new count due to:', notification.type);
                    fetchNotificationsCount();
                    break;
                case 'NOTIFICATIONS_RESET':
                    console.log('Resetting count to 0');
                    setNotificationsCount(0);
                    break;
                case 'NOTIFICATION_DELETED':
                case 'NOTIFICATION_UPDATED':
                case 'ALL_NOTIFICATIONS_DELETED':
                    console.log('Fetching updated count due to:', notification.type);
                    fetchNotificationsCount();
                    break;
            }
        };
    
        socket.off('notification').on('notification', handleNotification);
        
        // Initial fetch
        fetchNotificationsCount();
    
        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, user]);

    return <SafeAreaView style={[styles.main,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
        <View style={{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",alignItems:"center",gap:5}}>
            <TouchableOpacity
                style={styles.avatarContainer}
                onPress={()=> router.push({pathname: "(create_user)",params: { userId: user.userId }})}>
                <Image style={styles.avatar} source={avatar} />
            </TouchableOpacity>
            {["business","driver"].includes(user.role) && <TouchableOpacity style>
                <Text style={{color:"green",fontSize:13,fontWeight:"bold"}}>{user.total_amount}₪</Text>
            </TouchableOpacity>}
        </View>
        <View style={styles.welcome}>
          <Text style={styles.h2}>{greetingMsg}</Text>
          <Text style={styles.p}>{user?.name}</Text>
        </View>
        <TouchableOpacity 
            style={[styles.notification]}
            onPress={handleNotificationIcon}
        >
            <Ionicons 
                name="notifications" 
                size={26} 
                color={"#F8C332"} 
            />
            {notificationsCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificationsCount}</Text>
                </View>
            )}
        </TouchableOpacity>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    main:{
        backgroundColor:"white",
        height:100,
        boxShadow:"rgba(0, 0, 0, 0.16) 0px 1px 4px",
        display:"flex",
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"flex-end",
        padding:15
    },
    avatar:{
        borderColor:"rgba(0,0,0,.1)",
        borderWidth:1,
        borderRadius:50,
        width:40,
        height:40,
    },
    notification:{
        position:"relative",
        top:-7,
    },
    badge: {
        position: 'absolute',
        right: -7,
        top: -11,
        backgroundColor: 'red',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    h2:{
        fontWeight:"500"
    },
    p:{
      textTransform:"capitalize"
    },
    welcome:{
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
    }
})