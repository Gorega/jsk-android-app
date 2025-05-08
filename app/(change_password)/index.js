import { useState, useRef, useEffect } from "react";
import { 
  TextInput, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Platform,
  Keyboard
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useAuth } from "../_layout";
import { getToken } from "../../utils/secureStore";

export default function ChangePasswordScreen() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureCurrentPassword, setSecureCurrentPassword] = useState(true);
  const [secureNewPassword, setSecureNewPassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const strengthAnimation = useRef(new Animated.Value(0)).current;
  
  // RTL support
  const isRTL = ["he", "ar"].includes(language);
  
  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };
  
  const strength = getPasswordStrength(newPassword);
  
  // Animate password strength
  useEffect(() => {
    Animated.timing(strengthAnimation, {
      toValue: strength / 4,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [strength]);
  
  const getStrengthColor = () => {
    if (strength <= 1) return "#EF4444"; // Weak - Red
    if (strength === 2) return "#F59E0B"; // Medium - Amber
    if (strength === 3) return "#10B981"; // Strong - Green
    if (strength >= 4) return "#3B82F6"; // Very Strong - Blue
    return "#E5E5E5"; // Default
  };
  
  const getStrengthText = () => {
    if (!newPassword) return "";
    if (strength <= 1) return translations[language].tabs.settings.options.changePasswordFields?.weak || "Weak";
    if (strength === 2) return translations[language].tabs.settings.options.changePasswordFields?.medium || "Medium";
    if (strength === 3) return translations[language].tabs.settings.options.changePasswordFields?.strong || "Strong";
    if (strength >= 4) return translations[language].tabs.settings.options.changePasswordFields?.veryStrong || "Very Strong";
    return "";
  };
  
  const getStrengthIcon = () => {
    if (strength <= 1) return "alert-circle";
    if (strength === 2) return "alert-triangle";
    if (strength === 3) return "check-circle";
    if (strength >= 4) return "shield";
    return "";
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = translations[language].tabs.settings.options.changePasswordFields?.currentPasswordRequired;
      isValid = false;
    }
    
    if (!newPassword) {
      newErrors.newPassword = translations[language].tabs.settings.options.changePasswordFields?.newPasswordRequired;
      isValid = false;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = translations[language].tabs.settings.options.changePasswordFields?.passwordValidationRequired;
      isValid = false;
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = translations[language].tabs.settings.options.changePasswordFields?.confirmPasswordRequired;
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = translations[language].tabs.settings.options.changePasswordFields?.passwordMatchValidation;
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (validateForm()) {
      setLoading(true);
      
      try {
        const token = await getToken("userToken");
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${user.userId}/update-password`, {
          method: "PUT",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': language,
            "Cookie": token ? `token=${token}` : ""
          },
          credentials: "include",
          body: JSON.stringify({
            newPassword: newPassword,
            confirmNewPass: confirmPassword
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (data.type === 'VALIDATION_ERROR' && data.details) {
            const validationErrors = {};
            data.details.forEach(error => {
              if (error.field === 'newPassword') {
                validationErrors.newPassword = error.message;
              } else if (error.field === 'confirmNewPass') {
                validationErrors.confirmPassword = error.message;
              }
            });
            setErrors(prev => ({...prev, ...validationErrors}));
          }
          throw new Error(data.message || "Failed to update password");
        }
        
        // Reset form fields on success
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        Alert.alert(
          translations[language].tabs.settings.options.changePasswordFields?.success || "Success",
          data.message || translations[language].tabs.settings.options.changePasswordFields?.successMsg || "Password updated successfully",
          [{ text: translations[language].tabs.settings.options.changePasswordFields?.ok || "OK" }]
        );
      } catch (error) {
        Alert.alert(
          translations[language].tabs.settings.options.changePasswordFields?.error || "Error",
          error.message || translations[language].tabs.settings.options.changePasswordFields?.errorMsg || "Failed to update password",
          [{ text: translations[language].tabs.settings.options.changePasswordFields?.ok || "OK" }]
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={[styles.container]}>
        {/* Header */}
        <View style={[styles.header,{flexDirection:isRTL ? "row-reverse" : "row"}]}>
          <View style={[styles.headerContent,{flexDirection:isRTL ? "row-reverse" : "row"}]}>
            <Feather name="lock" size={22} color="#4361EE" />
            <Text style={styles.headerText}>
              {translations[language].tabs.settings.options.changePasswordFields?.changePass || "Change Password"}
            </Text>
          </View>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Security Tips */}
          {!keyboardVisible && (
            <View style={styles.securityTipsContainer}>
              <View style={[styles.securityTipsHeader,{flexDirection:isRTL ? "row-reverse" : "row"}]}>
                <Feather name="shield" size={18} color="#4361EE" />
                <Text style={styles.securityTipsTitle}>{translations[language].tabs.settings.options.changePasswordFields?.tips}</Text>
              </View>
              <View style={styles.securityTipsList}>
                <View style={[styles.securityTipItem,{flexDirection:isRTL ? "row-reverse" : "row"}]}>
                  <Feather name="check" size={14} color="#10B981" style={styles.tipIcon} />
                  <Text style={styles.tipText}>{translations[language].tabs.settings.options.changePasswordFields?.usage}</Text>
                </View>
                <View style={[styles.securityTipItem,{flexDirection:isRTL ? "row-reverse" : "row"}]}>
                  <Feather name="check" size={14} color="#10B981" style={styles.tipIcon} />
                  <Text style={styles.tipText}>{translations[language].tabs.settings.options.changePasswordFields?.letterInclusion}</Text>
                </View>
                <View style={[styles.securityTipItem,{flexDirection:isRTL ? "row-reverse" : "row"}]}>
                  <Feather name="check" size={14} color="#10B981" style={styles.tipIcon} />
                  <Text style={styles.tipText}>{translations[language].tabs.settings.options.changePasswordFields?.numbersInclusion}</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Form */}
          <View style={styles.formContainer}>
            
            {/* New Password Field */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { textAlign: isRTL ? "right" : "left" }]}>
                {translations[language].tabs.settings.options.changePasswordFields?.newPass || "New Password"}
              </Text>
              <View style={[
                styles.inputContainer, 
                errors.newPassword && styles.inputError,
                { flexDirection: isRTL ? "row-reverse" : "row" }
              ]}>
                <View style={[
                  styles.inputIconContainer, 
                  { [isRTL ? "right" : "left"]: 12 }
                ]}>
                  <Feather name="lock" size={18} color="#94A3B8" />
                </View>
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      textAlign: isRTL ? "right" : "left",
                      [isRTL ? "paddingRight" : "paddingLeft"]: 40
                    }
                  ]} 
                  secureTextEntry={secureNewPassword} 
                  value={newPassword} 
                  onChangeText={(input) => {
                    setNewPassword(input);
                    if (errors.newPassword) {
                      setErrors({...errors, newPassword: null});
                    }
                  }}
                  placeholder={translations[language].tabs.settings.options.changePasswordFields?.newPassHint || "Enter new password"}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity 
                  style={[
                    styles.eyeIcon,
                    { [isRTL ? "left" : "right"]: 12 }
                  ]} 
                  onPress={() => setSecureNewPassword(!secureNewPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather 
                    name={secureNewPassword ? "eye-off" : "eye"} 
                    size={18} 
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword ? (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              ) : newPassword ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarContainer}>
                    <Animated.View 
                      style={[
                        styles.strengthBar, 
                        { 
                          width: strengthAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                          }),
                          backgroundColor: getStrengthColor()
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.strengthTextContainer}>
                    <Feather name={getStrengthIcon()} size={14} color={getStrengthColor()} />
                    <Text style={[styles.strengthText, {color: getStrengthColor()}]}>
                      {getStrengthText()}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
            
            {/* Confirm Password Field */}
            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { textAlign: isRTL ? "right" : "left" }]}>
               {translations[language].tabs.settings.options.changePasswordFields?.confirmPassword}
              </Text>
              <View style={[
                styles.inputContainer, 
                errors.confirmPassword && styles.inputError,
                { flexDirection: isRTL ? "row-reverse" : "row" }
              ]}>
                <View style={[
                  styles.inputIconContainer, 
                  { [isRTL ? "right" : "left"]: 12 }
                ]}>
                  <Feather name="check-circle" size={18} color="#94A3B8" />
                </View>
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      textAlign: isRTL ? "right" : "left",
                      [isRTL ? "paddingRight" : "paddingLeft"]: 40
                    }
                  ]} 
                  secureTextEntry={secureConfirmPassword} 
                  value={confirmPassword} 
                  onChangeText={(input) => {
                    setConfirmPassword(input);
                    if (errors.confirmPassword) {
                      setErrors({...errors, confirmPassword: null});
                    }
                  }}
                  placeholder={translations[language].tabs.settings.options.changePasswordFields?.confirmPassword}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity 
                  style={[
                    styles.eyeIcon,
                    { [isRTL ? "left" : "right"]: 12 }
                  ]} 
                  onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather 
                    name={secureConfirmPassword ? "eye-off" : "eye"} 
                    size={18} 
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (loading || !(currentPassword && newPassword && confirmPassword)) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={loading || !(currentPassword && newPassword && confirmPassword)}
          >
            {loading ? (
              <Text style={styles.submitText}>{translations[language].tabs.settings.options.changePasswordFields?.updating}</Text>
            ) : (
              <Text style={styles.submitText}>
                {translations[language].tabs.settings.options.changePasswordFields?.changePass || "Change Password"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB"
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:7
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 10
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  securityTipsContainer: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#4361EE",
  },
  securityTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap:7
  },
  securityTipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  securityTipsList: {
    paddingLeft: 6,
  },
  securityTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap:7
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#4B5563",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputField: {
    marginBottom: 20,
  },
  inputLabel: {
    fontWeight: "500",
    fontSize: 15,
    marginBottom: 8,
    color: "#374151",
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.8)",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputError: {
    borderColor: "#EF4444",
  },
  inputIconContainer: {
    position: 'absolute',
    top: 14,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1F2937",
  },
  eyeIcon: {
    position: 'absolute',
    top: 14,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  strengthContainer: {
    marginTop: 10,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  strengthBar: {
    height: "100%",
  },
  strengthTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthText: {
    fontSize: 13,
    marginLeft: 6,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  },
  submitButton: {
    backgroundColor: "#4361EE",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  disabledButton: {
    backgroundColor: "#A5B4FC",
  },
  submitText: {
    fontWeight: "600",
    color: "#FFFFFF",
    fontSize: 16,
  }
});