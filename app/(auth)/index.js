import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  ScrollView
} from "react-native";
import { Link, useRouter, Redirect } from "expo-router";
import { Feather, MaterialIcons } from '@expo/vector-icons';
import TayarLogo from "../../assets/images/tayar_logo.png";
import Field from "../../components/sign/Field";
import { useAuth } from "../../RootLayout";
import { saveToken, getToken, setMasterAccountId, addAccountToMaster, setDirectLogin } from "../../utils/secureStore";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import * as LocalAuthentication from 'expo-local-authentication';

// Get screen dimensions
const { height } = Dimensions.get('window');

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [error, setError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [biometricType, setBiometricType] = useState(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [previousLoginInfo, setPreviousLoginInfo] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const scrollViewRef = useRef(null);
  
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated, setIsAuthenticated, setUserId } = useAuth();

  const [loginForm, setLoginForm] = useState({
    phone: "",
    password: ""
  });

  const [formErrors, setFormErrors] = useState({
    phone: "",
    password: ""
  });

  // Add state to track keyboard height
  const [footerHeight, setFooterHeight] = useState(0);

  // Add a new state to track the current active field's position
  const [activeFieldPosition, setActiveFieldPosition] = useState(0);

  // Handle keyboard appearance
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        // Store keyboard height for positioning
        const keyboardHeight = event.endCoordinates.height;
        setFooterHeight(keyboardHeight);
        
        // If we have an active field, ensure it's visible above the keyboard
        if (activeField && scrollViewRef.current && activeFieldPosition > 0) {
          // Calculate the screen height
          const screenHeight = Dimensions.get('window').height;
          
          // Calculate if the active field is hidden by the keyboard
          const fieldBottomPosition = activeFieldPosition + 80; // Field height + some padding
          const visibleAreaBottom = screenHeight - keyboardHeight - 120; // Account for footer height
          
          if (fieldBottomPosition > visibleAreaBottom) {
            // Calculate how much we need to scroll to make the field visible
            const scrollAmount = fieldBottomPosition - visibleAreaBottom + 50; // Extra padding
            
            // Scroll to make the field visible
            setTimeout(() => {
              scrollViewRef.current.scrollTo({ 
                y: scrollAmount,
                animated: true 
              });
            }, 100);
          }
        }
        
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setFooterHeight(0);
        setActiveFieldPosition(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [activeField, activeFieldPosition]);

  // Handle field focus to scroll to the active field
  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
    
    // Find the field's index
    const fieldIndex = fields.findIndex(field => field.name === fieldName);
    
    // Calculate the field's position based on its index
    // This is an approximation, adjust based on your actual layout
    const fieldPosition = fieldIndex * 70 + 250; // Base offset + field height * index
    setActiveFieldPosition(fieldPosition);
    
    // No need to manually scroll here, the keyboard listener will handle it
  };

  // Check for biometric support and previous login info
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
          return;
        }

        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
          return;
        }

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.length === 0) {
          return;
        }

        // Determine which biometric is available
        let biometricTypeLabel = '';
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricTypeLabel = 'face';
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricTypeLabel = 'fingerprint';
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometricTypeLabel = 'iris';
        }
        
        setBiometricType(biometricTypeLabel);
        setIsBiometricAvailable(true);

        // Check for saved credentials
        const savedPhone = await getToken("lastLoginPhone");
        if (savedPhone) {
          setPreviousLoginInfo({
            phone: savedPhone
          });
        }
      } catch (error) {
      }
    };

    checkBiometricSupport();
  }, []);

  const fields = [
    {
      name: "phone",
      label: translations[language]?.auth.mobileNumber,
      type: "input",
      value: loginForm.phone,
      error: formErrors.phone || "",
      placeholder: translations[language]?.auth.phonePlaceholder,
      keyboardType: "phone-pad",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, phone: ""}));
        setLoginForm(prev => ({...prev, phone: value}));
      }
    }, 
    {
      name: "password",
      label: translations[language]?.auth.password,
      type: "input",
      value: loginForm.password,
      error: formErrors.password || "",
      placeholder: translations[language]?.auth.passwordPlaceholder,
      secureTextEntry: true,
      onChange: (value) => {
        setFormErrors(prev => ({...prev, password: ""}));
        setLoginForm(prev => ({...prev, password: value}));
      }
    }
  ];

  const biometricAuthHandler = async () => {
    try {
      setLoading(true);
      setError('');

      // Only proceed if previous login info exists
      if (!previousLoginInfo) {
        Alert.alert(
          translations[language]?.auth.biometricLoginFailed || "Biometric Login Failed",
          translations[language]?.auth.noPreviousLogin || "Please login with your credentials first to enable biometric login"
        );
        setLoading(false);
        return;
      }

      // First use local authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: translations[language]?.auth.biometricPrompt || "Login with biometrics",
        cancelLabel: translations[language]?.auth.cancel || "Cancel",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error(translations[language]?.auth.biometricFailed || "Authentication failed");
      }

      // Get stored credentials
      const savedPhone = await getToken("lastLoginPhone");
      const savedPassword = await getToken("lastLoginPassword");

      if (!savedPhone || !savedPassword) {
        throw new Error(translations[language]?.auth.credentialsNotFound || "Saved credentials not found");
      }

      // Make API call with saved credentials
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
        method: "POST",
        body: JSON.stringify({
          phone: savedPhone,
          password: savedPassword
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.userId) {
        await saveToken("userId", data.userId.toString());
        setUserId(data.userId);
      }

      if (data.token) {
        await saveToken("userToken", data.token);
        setIsAuthenticated(true);
        router.replace("/(tabs)");
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      Alert.alert(
        translations[language]?.auth.biometricLoginFailed || "Biometric Login Failed",
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const loginHandler = async () => {
    Keyboard.dismiss();
    
    try {
      setFormErrors({});
      setError('');
      setLoading(true);
      
      // Basic validation
      let hasError = false;
      if (!loginForm.phone) {
        setFormErrors(prev => ({...prev, phone:translations[language]?.auth.phoneRequired}));
        hasError = true;
      }
      if (!loginForm.password) {
        setFormErrors(prev => ({...prev, password:translations[language]?.auth.passwordRequired}));
        hasError = true;
      }
      
      if (hasError) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
        method: "POST",
        body: JSON.stringify({
          phone: loginForm.phone,
          password: loginForm.password
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.type === 'VALIDATION_ERROR') {
          const errors = {};
          data.details.forEach(error => {
            errors[error.field] = error.message;
          });
          setFormErrors(errors);
        }
        throw new Error(data.message);
      }

      // Save credentials for biometric login if login is successful
      if (isBiometricAvailable) {
        await saveToken("lastLoginPhone", loginForm.phone);
        await saveToken("lastLoginPassword", loginForm.password);
      }

      if (data.userId) {
        await saveToken("userId", data.userId.toString());
        setUserId(data.userId);
        
        // This is a direct login
        await setDirectLogin(true);
        
        // Set this user as the master account
        await setMasterAccountId(data.userId.toString());
        
        // Create account object
        const account = {
          userId: data.userId.toString(),
          name: data.name || data.username || loginForm.phone,
          phone: loginForm.phone,
          role: data.role,
          token: data.token,
          lastLoginPhone: loginForm.phone,
          lastLoginPassword: loginForm.password,
          isMasterAccount: true
        };
        
        // Add to master's accounts registry
        await addAccountToMaster(data.userId.toString(), account);
      }

      if (data.token) {
        await saveToken("userToken", data.token);
        setIsAuthenticated(true);
        router.replace("/(tabs)");
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      Alert.alert(
        translations[language].auth.loginFailed,
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken("userToken");
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
      } finally {
        setAuthCheckComplete(true);
      }
    };
    
    checkAuth();
  }, [setIsAuthenticated]);
  
  if (!authCheckComplete) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={Platform.OS === 'ios'}
      >
        {/* Fixed Header - Make it smaller when keyboard is shown */}
        <View style={[styles.header, keyboardVisible && styles.headerSmall]}>
          <Image 
            style={[styles.logo, keyboardVisible && styles.logoSmall]} 
            source={TayarLogo} 
            resizeMode="contain" 
          />
          
          {/* Hide welcome text when keyboard is visible */}
          {!keyboardVisible && (
            <View>
              <Text style={styles.title}>{translations[language]?.auth.welcome}</Text>
              <Text style={styles.subtitle}>{translations[language]?.auth.signMessage}</Text>
            </View>
          )}
        </View>
        
        {/* Main content area */}
        <View style={styles.mainContent}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.contentContainer}
            contentContainerStyle={[
              styles.scrollContent,
              // Add extra padding at the bottom to ensure content is scrollable above the footer
              {paddingBottom: keyboardVisible ? 200 : 100} // Increased padding
            ]}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {/* Biometric Login Button - Only show if available */}
            {isBiometricAvailable && previousLoginInfo && (
              <View style={styles.biometricContainer}>
                <TouchableOpacity
                  style={[styles.biometricButton]}
                  onPress={biometricAuthHandler}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="fingerprint" size={28} color="#4361EE" />
                  <Text style={styles.biometricText}>
                    {translations[language]?.auth?.loginWithBiometric || 
                      `Login with ${biometricType === 'face' ? 'Face ID' : 'Fingerprint'}`}
                  </Text>
                </TouchableOpacity>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>
                    {translations[language]?.auth?.or || 'OR'}
                  </Text>
                  <View style={styles.divider} />
                </View>
              </View>
            )}

            {/* Error alert */}
            {error ? (
              <View style={styles.errorAlert}>
                <Feather name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {/* Fields */}
            <View style={styles.formFields}>
              {fields.map((field, index) => (
                <View key={index} style={styles.fieldContainer}>
                  <Field 
                    field={field} 
                    multiline={false} 
                    onFocus={handleFieldFocus}
                  />
                </View>
              ))}
            </View>
            
            {/* Forgot password */}
            <TouchableOpacity 
              style={[styles.forgotPassword]}
              activeOpacity={0.7}
              onPress={() => router.push("https://wa.me/972566150002")}
            >
              <Text style={styles.forgotPasswordText}>
                {translations[language]?.auth?.forgotPassword || 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          {/* Always visible footer */}
          <View style={[
            styles.footer,
            // Adjust position when keyboard is visible
            keyboardVisible && Platform.OS === 'ios' ? {
              position: 'absolute',
              bottom: footerHeight,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              paddingBottom: 10,
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.1)',
              zIndex: 999,
            } : keyboardVisible && Platform.OS === 'android' ? {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              paddingBottom: 10,
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.1)',
              zIndex: 999,
            } : {}
          ]}>
            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={loginHandler}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {translations[language]?.auth.login}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Register link */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerText}>
                {translations[language]?.auth.dontHaveAccount}
              </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity style={styles.registerLink}>
                  <Text style={styles.registerLinkText}>
                    {translations[language]?.auth.register}
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    alignItems: 'center',
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 1,
  },
  headerSmall: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoSmall: {
    width: 50, 
    height: 50,
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 226, 226, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    marginLeft: 10,
    color: '#B91C1C',
    fontSize: 14,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
  },
  forgotPasswordRtl: {
    alignSelf: 'flex-start',
  },
  forgotPasswordText: {
    color: '#4361EE',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
    zIndex: 10,
  },
  loginButton: {
    backgroundColor: '#4361EE',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  loginButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  registerText: {
    color: '#64748B',
    fontSize: 14,
  },
  registerLink: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  registerLinkRtl: {
    marginLeft: 0,
    marginRight: 8,
  },
  registerLinkText: {
    color: '#4361EE',
    fontSize: 14,
    fontWeight: '600',
  },
  biometricContainer: {
    marginBottom: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(67, 97, 238, 0.08)',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.2)',
  },
  biometricButtonRtl: {
    flexDirection: 'row-reverse',
  },
  biometricText: {
    color: '#4361EE',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#64748B',
  },
  formFields: {
    marginBottom: 20,
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
});