import { TouchableOpacity,Text,Linking } from "react-native";
import ModalPresentation from "../../ModalPresentation";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { useState } from "react";
import { translations } from '../../../utils/languageContext';
import { useLanguage } from '../../../utils/languageContext';

export default function Contact({contact}){
    const { language } = useLanguage();
    const [showContactModal,setShowContactModal] = useState(false);
    const [showWhatsappOptions,setShowWhatsappOptions] = useState(false);

    return <>
        <TouchableOpacity onPress={()=> setShowContactModal(true)}>
            {contact.type === "phone" ? <FontAwesome name="phone" size={24} color="green" /> : <Feather name="message-square" size={24} color="green" />}
        </TouchableOpacity>

        {showContactModal
        &&
        <ModalPresentation
            showModal={showContactModal}
            setShowModal={setShowContactModal}
            customStyles={{bottom:15}}
        >
            <Text style={{fontSize:15,fontWeight:"500",marginBottom:15,textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{contact.label}</Text>
            <TouchableOpacity
            style={{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",
            alignItems:"center",
            gap:15,
            borderBottomColor:"rgba(0,0,0,.1)",
            borderBottomWidth:1,
            padding:15
            }}
            onPress={()=> Linking.openURL(contact.type === "phone" ? `tel:${contact.phone}` : `sms:${contact.phone}?body=${encodeURIComponent(contact.msg)}`)}
            >
                {contact.type === "phone" ? <FontAwesome name="phone" size={24} color="green" /> :  <Feather name="message-square" size={24} color="green" />}
                <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{translations[language].tabs.orders.order.contactPhone} {contact.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
             style={{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",
             alignItems:"center",
             gap:15,
             padding:15}}
             onPress={()=> setShowWhatsappOptions(true)}>
                {contact.type === "phone" ? <FontAwesome name="whatsapp" size={24} color="green" /> :  <FontAwesome name="whatsapp" size={24} color="green" />}
                <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{translations[language].tabs.orders.order.contactWhatsapp} {contact.label}</Text>
            </TouchableOpacity>
        </ModalPresentation>}

        {showWhatsappOptions
        &&
        <ModalPresentation
            showModal={showWhatsappOptions}
            setShowModal={setShowWhatsappOptions}
            customStyles={{bottom:15}}
        >
            <TouchableOpacity
             style={{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",
             alignItems:"center",
             gap:15,
             borderBottomColor:"rgba(0,0,0,.1)",
             borderBottomWidth:1,
             padding:15}}
             onPress={()=> Linking.openURL(`https://wa.me/${`+972${contact.phone}`}?text=${encodeURIComponent(contact.msg)}`)}
             > 
                <FontAwesome name="whatsapp" size={24} color="green" />
                <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{`+972${contact.phone}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity
             style={{flexDirection:["he", "ar"].includes(language) ? "row-reverse" : "row",
             alignItems:"center",
             gap:15,
             padding:15}}
             onPress={()=> Linking.openURL(`https://wa.me/${`+970${contact.phone}`}?text=${encodeURIComponent(contact.msg)}`)}
             >
                <FontAwesome name="whatsapp" size={24} color="green" />
                <Text style={{textAlign:["he", "ar"].includes(language) ? "right" : "left"}}>{`+970${contact.phone}`}</Text>
            </TouchableOpacity>
        </ModalPresentation>
        }
    </>
}