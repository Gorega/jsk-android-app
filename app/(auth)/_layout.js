import FixedHeader from "@/components/FixedHeader";
import { Stack } from "expo-router";
import { TouchableOpacity,Text,StyleSheet, View } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import ModalPresentation from "@/components/ModalPresentation";
import { useLanguage,translations } from '../../utils/languageContext';



export default function RootLayout(){
  const { language, setLanguage } = useLanguage();
  const [showLanguageModal,setShowLanguageModal] = useState(false);
  const isRTL = language === 'ar' || language === 'he';

  const handleLanguageChange = async (newLang) => {
    await setLanguage(newLang);
    setShowLanguageModal(false);
};

return <>
    <Stack>
  <Stack.Screen
    name="index"
    options={{
      title:translations[language]?.auth.login,
      header:()=>{
        return <FixedHeader title={translations[language]?.auth.login} showBackButton={false}>
          <TouchableOpacity onPress={()=> setShowLanguageModal(true)}>
            <MaterialIcons name="language" size={24} color="#4361EE" />
          </TouchableOpacity>
        </FixedHeader>
      }
      }}
    />
  <Stack.Screen
    name="sign-up"
    options={{
      title:translations[language]?.auth.register,
      header:()=>{
        return <FixedHeader title={translations[language]?.auth.register} showBackButton={true}>
          <TouchableOpacity onPress={()=> setShowLanguageModal(true)}>
            <MaterialIcons name="language" size={24} color="#4361EE" />
          </TouchableOpacity>
        </FixedHeader>
      }
      }}
     />
</Stack>
        {showLanguageModal
        &&
        <ModalPresentation 
                    showModal={showLanguageModal} 
                    setShowModal={setShowLanguageModal}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {translations[language]?.tabs.settings.options.language.title}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            language === 'ar' && styles.activeLanguage
                        ]}
                        onPress={() => handleLanguageChange('ar')}
                    >
                        <Text style={[
                            styles.languageText, 
                            language === 'ar' && styles.activeLanguageText,
                            { textAlign: isRTL ? "right" : "left" }
                        ]}>
                            {translations[language]?.tabs.settings.options.language.options.ar}
                        </Text>
                        {language === 'ar' && (
                            <Ionicons name="checkmark-circle" size={20} color="#4361EE" />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            language === 'en' && styles.activeLanguage
                        ]}
                        onPress={() => handleLanguageChange('en')}
                    >
                        <Text style={[
                            styles.languageText,
                            language === 'en' && styles.activeLanguageText,
                            { textAlign: isRTL ? "right" : "left" }
                        ]}>
                            {translations[language]?.tabs.settings.options.language.options.en}
                        </Text>
                        {language === 'en' && (
                            <Ionicons name="checkmark-circle" size={20} color="#4361EE" />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            language === 'he' && styles.activeLanguage,
                            { borderBottomWidth: 0 }
                        ]}
                        onPress={() => handleLanguageChange('he')}
                    >
                        <Text style={[
                            styles.languageText,
                            language === 'he' && styles.activeLanguageText,
                            { textAlign: isRTL ? "right" : "left" }
                        ]}>
                            {translations[language]?.tabs.settings.options.language.options.he}
                        </Text>
                        {language === 'he' && (
                            <Ionicons name="checkmark-circle" size={20} color="#4361EE" />
                        )}
                    </TouchableOpacity>
                </ModalPresentation>}
</>

}

const styles = StyleSheet.create({
  lang:{
    padding:15,
    borderBottomColor:"rgba(0,0,0,.1)",
    borderBottomWidth:1,
    fontWeight:"500"
},
modalHeader: {
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
},
modalTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1E293B',
  textAlign: 'center',
},
languageOption: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
},
activeLanguage: {
  backgroundColor: '#F0F9FF',
},
languageText: {
  fontSize: 16,
  color: '#334155',
},
activeLanguageText: {
  color: '#4361EE',
  fontWeight: '600',
}
})