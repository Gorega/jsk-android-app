import FixedHeader from "@/components/FixedHeader";
import { Stack } from "expo-router";
import { TouchableOpacity,Text,StyleSheet } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import ModalPresentation from "@/components/ModalPresentation";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';

export default function RootLayout(){
  const { language, setLanguage } = useLanguage();
  const [showLanguageModal,setShowLanguageModal] = useState(false);

  const handleLanguageChange = async (newLang) => {
    await setLanguage(newLang);
    setShowLanguageModal(false);
};

return <>
    <Stack>
  <Stack.Screen
    name="index"
    options={{
      title:translations[language].auth.login,
      header:()=>{
        return <FixedHeader title={translations[language].auth.login} showBackButton={false}>
          <TouchableOpacity onPress={()=> setShowLanguageModal(true)}>
            <MaterialIcons name="language" size={24} color="#F8C332" />
          </TouchableOpacity>
        </FixedHeader>
      }
      }}
    />
  <Stack.Screen
    name="sign-up"
    options={{
      title:translations[language].auth.register,
      header:()=>{
        return <FixedHeader title={translations[language].auth.register} showBackButton={true}>
          <TouchableOpacity onPress={()=> setShowLanguageModal(true)}>
            <MaterialIcons name="language" size={24} color="#F8C332" />
          </TouchableOpacity>
        </FixedHeader>
      }
      }}
     />
</Stack>
{showLanguageModal
&&
<ModalPresentation showModal={showLanguageModal} setShowModal={setShowLanguageModal} customStyles={{bottom:15}}>
      <TouchableOpacity onPress={() => handleLanguageChange('ar')}>
          <Text style={[styles.lang,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].tabs.settings.options.language.options.ar}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleLanguageChange('en')}>
          <Text style={[styles.lang,{textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].tabs.settings.options.language.options.en}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleLanguageChange('he')}>
          <Text style={[styles.lang,{borderBottomWidth:0,textAlign:["he", "ar"].includes(language) ? "right" : "left"}]}>{translations[language].tabs.settings.options.language.options.he}</Text>
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
}
})