import { TouchableOpacity, Text, StyleSheet, ScrollView, View } from "react-native";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from "expo-router";
import ModalPresentation from "../../components/ModalPresentation";
import { useState } from "react";
import { deleteToken } from "../../utils/secureStore";
import { useAuth } from "../_layout";


export default function Settings() {
    const { language, setLanguage } = useLanguage();
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const { setIsAuthenticated, user } = useAuth();

    const settings = [
        (["admin", "manager"].includes(user.role)) ? {
            label: translations[language].tabs.settings.options.users,
            onPress: () => router.push("(users)"),
            icon: <FontAwesome name="user-o" size={24} color="#F8C332" />
        } : null,
        (["manager","admin", "business"].includes(user.role)) ? {
            label: "Complaints",
            onPress: () => router.push("(complaints)"),
            icon:<MaterialIcons name="fmd-bad" size={24} color="#F8C332" />
        } : null,
        {
            label: translations[language].tabs.settings.options.language.title,
            onPress: () => setShowLanguageModal(true),
            icon: <MaterialIcons name="language" size={24} color="#F8C332" />
        },
        {
            label: translations[language].tabs.settings.options.changePassword,
            onPress: () => router.push("(change_password)"),
            icon: <AntDesign name="unlock" size={24} color="#F8C332" />
        },
        {
            label: translations[language].tabs.settings.options.contactUs,
            onPress: () => router.push("(contact_us)"),
            icon: <Entypo name="phone" size={24} color="#F8C332" />
        },
        {
            label: translations[language].tabs.settings.options.aboutUs,
            onPress: () => router.push("(info)"),
            icon: <MaterialCommunityIcons name="vector-arrange-above" size={24} color="#F8C332" />
        },
        {
            label: translations[language].tabs.settings.options.locations,
            onPress: () => router.push("(locations)"),
            icon: <Ionicons name="location-outline" size={24} color="#F8C332" />
        },
        {
            label: translations[language].tabs.settings.options.logout,
            onPress: async () => {
                await deleteToken("userToken");
                setIsAuthenticated(false);
                router.replace("(auth)");
            },
            icon: <MaterialIcons name="logout" size={24} color="#F8C332" />
        }
    ].filter(Boolean); // Remove null values

    const handleLanguageChange = async (newLang) => {
        await setLanguage(newLang);
        setShowLanguageModal(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {settings.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.item,
                            { flexDirection: ["he", "ar"].includes(language) ? "row-reverse" : "row" }
                        ]}
                        onPress={item.onPress}
                    >
                        {item.icon}
                        <Text style={{ fontWeight: "500" }}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {showLanguageModal && (
                <ModalPresentation customStyles={{ bottom: 15 }} showModal={showLanguageModal} setShowModal={setShowLanguageModal}>
                    <TouchableOpacity onPress={() => handleLanguageChange('ar')}>
                        <Text style={[styles.lang, { textAlign: ["he", "ar"].includes(language) ? "right" : "left" }]}>
                            {translations[language].tabs.settings.options.language.options.ar}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleLanguageChange('en')}>
                        <Text style={[styles.lang, { textAlign: ["he", "ar"].includes(language) ? "right" : "left" }]}>
                            {translations[language].tabs.settings.options.language.options.en}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleLanguageChange('he')}>
                        <Text style={[styles.lang, { borderBottomWidth: 0, textAlign: ["he", "ar"].includes(language) ? "right" : "left" }]}>
                            {translations[language].tabs.settings.options.language.options.he}
                        </Text>
                    </TouchableOpacity>
                </ModalPresentation>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    item: {
        borderBottomColor: "rgba(0,0,0,.1)",
        borderBottomWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 25,
        paddingVertical: 32,
    },
    lang: {
        padding: 15,
        borderBottomColor: "rgba(0,0,0,.1)",
        borderBottomWidth: 1,
        fontWeight: "500",
    }
});
