import FixedHeader from "@/components/FixedHeader";
import { Stack } from "expo-router";
import { TouchableOpacity, Text, StyleSheet, View, Platform } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ModalPresentation from "@/components/ModalPresentation";
import { useLanguage, translations } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootLayout(){
  const { language, setLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { theme, setTheme, isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const handleLanguageChange = async (newLang) => {
    // Close modal first to avoid visual glitches during restart
    setShowLanguageModal(false);
    // Change language (this will trigger restart if RTL changes)
    await setLanguage(newLang);
  };

  const handleThemeChange = async (newTheme) => {
    await setTheme(newTheme);
    setShowThemeModal(false);
  };

  return <>
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Stack
      >
        <Stack.Screen
          name="index"
          options={{
            title: translations[language]?.auth.login,
            header: () => {
              return <FixedHeader title={translations[language]?.auth.login} showBackButton={false}>
                <View style={styles.headerButtons}>
                  <TouchableOpacity onPress={() => setShowThemeModal(true)}>
                    <MaterialCommunityIcons 
                      name={isDark ? "moon-waning-crescent" : "white-balance-sunny"} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
                    <MaterialIcons name="language" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </FixedHeader>
            }
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            title: translations[language]?.auth.register,
            header: () => {
              return <FixedHeader title={translations[language]?.auth.register} showBackButton={true}>
                <View style={styles.headerButtons}>
                  <TouchableOpacity onPress={() => setShowThemeModal(true)}>
                    <MaterialCommunityIcons 
                      name={isDark ? "moon-waning-crescent" : "white-balance-sunny"} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
                    <MaterialIcons name="language" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </FixedHeader>
            }
          }}
        />
      </Stack>
    </SafeAreaView>
    {showLanguageModal &&
      <ModalPresentation 
        showModal={showLanguageModal} 
        setShowModal={setShowLanguageModal}
      >
        <View style={[styles.modalHeader, { 
          backgroundColor: colors.card,
          borderBottomColor: colors.border 
        }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {translations[language]?.tabs.settings.options.language.title}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.languageOption,
            { 
              backgroundColor: colors.card,
              borderBottomColor: colors.border
            },
            language === 'ar' && [
              styles.activeLanguage,
              { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
            ]
          ]}
          onPress={() => handleLanguageChange('ar')}
        >
          <Text style={[
            styles.languageText, 
            { color: colors.text },
            language === 'ar' && [
              styles.activeLanguageText,
              { color: colors.primary }
            ]
          ]}>
            {translations[language]?.tabs.settings.options.language.options.ar}
          </Text>
          {language === 'ar' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.languageOption,
            { 
              backgroundColor: colors.card,
              borderBottomColor: colors.border
            },
            language === 'en' && [
              styles.activeLanguage,
              { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
            ]
          ]}
          onPress={() => handleLanguageChange('en')}
        >
          <Text style={[
            styles.languageText,
            { color: colors.text },
            language === 'en' && [
              styles.activeLanguageText,
              { color: colors.primary }
            ]
          ]}>
            {translations[language]?.tabs.settings.options.language.options.en}
          </Text>
          {language === 'en' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.languageOption,
            { 
              backgroundColor: colors.card,
              borderBottomWidth: 0 
            },
            language === 'he' && [
              styles.activeLanguage,
              { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
            ]
          ]}
          onPress={() => handleLanguageChange('he')}
        >
          <Text style={[
            styles.languageText,
            { color: colors.text },
            language === 'he' && [
              styles.activeLanguageText,
              { color: colors.primary }
            ]
          ]}>
            {translations[language]?.tabs.settings.options.language.options.he}
          </Text>
          {language === 'he' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </ModalPresentation>}

    {showThemeModal &&
      <ModalPresentation 
        showModal={showThemeModal} 
        setShowModal={setShowThemeModal}
      >
        <View style={[
          styles.modalHeader, 
          { 
            backgroundColor: colors.card,
            borderBottomColor: colors.border 
          }
        ]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {translations[language]?.tabs.settings.options.theme?.title || 'Choose Theme'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.languageOption,
            { 
              backgroundColor: colors.card,
              borderBottomColor: colors.border 
            },
            theme === 'light' && [
              styles.activeLanguage,
              { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
            ]
          ]}
          onPress={() => handleThemeChange('light')}
        >
          <View style={styles.themeOptionContent}>
            <MaterialCommunityIcons 
              name="white-balance-sunny" 
              size={22} 
              color={theme === 'light' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.languageText, 
              { color: colors.text },
              theme === 'light' && [
                styles.activeLanguageText,
                { color: colors.primary }
              ]
            ]}>
              {translations[language]?.tabs.settings.options.theme?.options?.light || 'Light'}
            </Text>
          </View>
          {theme === 'light' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.languageOption,
            { 
              backgroundColor: colors.card,
              borderBottomColor: colors.border 
            },
            theme === 'dark' && [
              styles.activeLanguage,
              { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
            ]
          ]}
          onPress={() => handleThemeChange('dark')}
        >
          <View style={styles.themeOptionContent}>
            <MaterialCommunityIcons 
              name="moon-waning-crescent" 
              size={22} 
              color={theme === 'dark' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.languageText,
              { color: colors.text },
              theme === 'dark' && [
                styles.activeLanguageText,
                { color: colors.primary }
              ]
            ]}>
              {translations[language]?.tabs.settings.options.theme?.options?.dark || 'Dark'}
            </Text>
          </View>
          {theme === 'dark' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.languageOption,
            { 
              backgroundColor: colors.card,
              borderBottomWidth: 0 
            },
            theme === 'system' && [
              styles.activeLanguage,
              { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
            ]
          ]}
          onPress={() => handleThemeChange('system')}
        >
          <View style={styles.themeOptionContent}>
            <MaterialCommunityIcons 
              name="theme-light-dark" 
              size={22} 
              color={theme === 'system' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.languageText,
              { color: colors.text },
              theme === 'system' && [
                styles.activeLanguageText,
                { color: colors.primary }
              ]
            ]}>
              {translations[language]?.tabs.settings.options.theme?.options?.system || 'System'}
            </Text>
          </View>
          {theme === 'system' && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
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
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:20
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  }
})