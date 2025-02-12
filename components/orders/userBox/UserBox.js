import { View,Text } from "react-native";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Contact from "./Contact";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';

export default function BusinessBox({styles,box}){
    const { language } = useLanguage();

    return (
        <View style={styles.sec}>
            <View style={[styles.in,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                <View style={[styles.flexIn,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <SimpleLineIcons name="user" size={24} color="#F8C332" />
                    <View style={styles.info}>
                        <Text style={[styles.h2,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{box.label}</Text>
                        <Text style={[styles.p,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{box.userName}</Text>
                    </View>
                </View>
                <View style={[styles.icons,{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row"}]}>
                    <Contact
                        contact={{
                            type:"phone",
                            label:translations[language].tabs.orders.order.userBoxPhoneContactLabel,
                            phone:box.phone,
                            msg:""
                        }}
                    />
                    <Contact
                        contact={{
                            type:"msg",
                            label:translations[language].tabs.orders.order.userBoxMessageContactLabel,
                            phone:box.phone,
                            msg:""
                        }}
                    />
                </View>
             </View>
        </View>
    )
}