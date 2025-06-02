import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  FlatList,
  StatusBar,
  Platform,
  SafeAreaView,
  Dimensions,
  Alert,
  Keyboard,
  ActivityIndicator,
  Animated
} from "react-native";
import TayarLogo from "../../assets/images/tayar_logo.png";
import { Feather } from '@expo/vector-icons';
import Field from "../../components/sign/Field";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import { router } from "expo-router";
import { useRTLStyles } from '../../utils/RTLWrapper';
const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);
  const rtl = useRTLStyles();
  
  const { language } = useLanguage();

  const [formErrors, setFormErrors] = useState({});

  const [registerForm, setRegisterForm] = useState({
    username: "",
    comercial_name: "",
    comercial_activity: "",
    phone: "",
    second_phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    city_id: "",
    address: "",
    website: "",
    tiktok: "",
    facebook: "",
    instagram: ""
  });

  const [selectedValue, setSelectedValue] = useState({
    role: "",
    city: ""
  });

  // Handle keyboard appearance
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
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
  }, []);
  
  // Step 1: Personal Information
  const step1Fields = [
    {
      name: "username",
      label: translations[language].auth.username,
      type: "input",
      value: registerForm.username,
      error: formErrors.username || "",
      placeholder: translations[language].auth.usernamePlaceholder,
      keyboardType: "default",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, username: ""}));
        setRegisterForm(prev => ({...prev, username: value}));
      }
    },
    {
      name: "email",
      label: translations[language].auth.email,
      type: "input",
      value: registerForm.email,
      error: formErrors.email || "",
      placeholder: translations[language].auth.emailPlaceholder,
      keyboardType: "email-address",
      autoCapitalize: "none",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, email: ""}));
        setRegisterForm(prev => ({...prev, email: value}));
      }
    },
    {
      name: "phone",
      label: translations[language].auth.mobileNumber,
      type: "input",
      value: registerForm.phone,
      error: formErrors.phone || "",
      placeholder: translations[language].auth.phonePlaceholder,
      keyboardType: "phone-pad",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, phone: ""}));
        setRegisterForm(prev => ({...prev, phone: value}));
      }
    },
    {
      name: "password",
      label: translations[language].auth.password,
      type: "input",
      value: registerForm.password,
      error: formErrors.password || "",
      placeholder: translations[language].auth.passwordPlaceholder,
      secureTextEntry: true,
      onChange: (value) => {
        setFormErrors(prev => ({...prev, password: ""}));
        setRegisterForm(prev => ({...prev, password: value}));
      }
    },
    {
      name: "confirmPassword",
      label: translations[language].auth.confirmPasswordPlaceholder,
      type: "input",
      value: registerForm.confirmPassword,
      error: formErrors.confirmPassword || "",
      placeholder: translations[language].auth.confirmPasswordPlaceholder,
      secureTextEntry: true,
      onChange: (value) => {
        setFormErrors(prev => ({...prev, confirmPassword: ""}));
        setRegisterForm(prev => ({...prev, confirmPassword: value}));
      }
    },
  ];

  // Step 2: Business Information
  const step2Fields = [
    {
      name: "comercial_name",
      label: translations[language].auth.comercialName,
      type: "input",
      value: registerForm.comercial_name,
      error: formErrors.comercial_name || "",
      placeholder: translations[language].auth.comercialNamePlaceholder,
      keyboardType: "default",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, comercial_name: ""}));
        setRegisterForm(prev => ({...prev, comercial_name: value}));
      }
    },
    {
      name: "comercial_activity",
      label: translations[language].auth.businessActivity,
      type: "input",
      value: registerForm.comercial_activity,
      error: formErrors.comercial_activity || "",
      placeholder: translations[language].auth.businessActivityPlaceholder,
      keyboardType: "default",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, comercial_activity: ""}));
        setRegisterForm(prev => ({...prev, comercial_activity: value}));
      }
    },
    {
      name: "city",
      label: translations[language].auth.city,
      type: "select",
      value: selectedValue.city?.label || "",
      error: formErrors.city_id || "",
      placeholder: translations[language].auth.cityPlaceHolder,
      list: cities?.map(city => ({
        label: city.name,
        value: city.city_id
      })) || [],
      onSelect: () => setFormErrors(prev => ({...prev, city_id: ""}))
    },
    {
      name: "address",
      label: translations[language].auth.address,
      type: "input",
      value: registerForm.address,
      error: formErrors.address || "",
      placeholder:translations[language].auth.addressPlaceholder,
      keyboardType: "default",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, address: ""}));
        setRegisterForm(prev => ({...prev, address: value}));
      }
    },
    {
      name: "second_phone",
      label: translations[language].auth.secondPhone,
      type: "input",
      value: registerForm.second_phone,
      error: formErrors.second_phone || "",
      placeholder: translations[language].auth.secondPhonePlaceholder,
      keyboardType: "phone-pad",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, second_phone: ""}));
        setRegisterForm(prev => ({...prev, second_phone: value}));
      }
    }
  ];

  // Step 3: Social Media Information
  const step3Fields = [
    {
      name: "website",
      label: translations[language].auth.website,
      type: "input",
      value: registerForm.website,
      error: formErrors.website || "",
      placeholder: translations[language].auth.websitePlaceholder,
      keyboardType: "url",
      autoCapitalize: "none",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, website: ""}));
        setRegisterForm(prev => ({...prev, website: value}));
      }
    },
    {
      name: "tiktok",
      label: translations[language].auth.tiktok,
      type: "input",
      value: registerForm.tiktok,
      error: formErrors.tiktok || "",
      placeholder: translations[language].auth.tiktokPlaceholder,
      autoCapitalize: "none",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, tiktok: ""}));
        setRegisterForm(prev => ({...prev, tiktok: value}));
      }
    },
    {
      name: "facebook",
      label: translations[language].auth.facebook,
      type: "input",
      value: registerForm.facebook,
      error: formErrors.facebook || "",
      placeholder: translations[language].auth.facebookPlaceholder,
      autoCapitalize: "none",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, facebook: ""}));
        setRegisterForm(prev => ({...prev, facebook: value}));
      }
    },
    {
      name: "instagram",
      label: translations[language].auth.instagram,
      type: "input",
      value: registerForm.instagram,
      error: formErrors.instagram || "",
      placeholder: translations[language].auth.instagramPlaceholder,
      autoCapitalize: "none",
      onChange: (value) => {
        setFormErrors(prev => ({...prev, instagram: ""}));
        setRegisterForm(prev => ({...prev, instagram: value}));
      }
    }
  ];

  // All steps together
  const allStepFields = [
    { title: translations[language].auth.personalInfo, fields: step1Fields },
    { title: translations[language].auth.businessDetails, fields: step2Fields },
    { title: translations[language].auth.socialMedia, fields: step3Fields },
  ];

  const handleNextStep = () => {
    // Validate current step
    const isValid = validateStep(currentStep);
    
    if (!isValid) {
      return;
    }

    if (currentStep < 3) {
      const nextStep = currentStep + 1;      
      // Set the new step first, before scrolling
      setCurrentStep(nextStep);
      
      // Use setTimeout to ensure state update before scrolling
      setTimeout(() => {
        // Ensure we're scrolling to the right index (currentStep - 1 → nextStep - 1)
        flatListRef.current?.scrollToIndex({
          index: nextStep - 1,
          animated: true,
          viewPosition: 0
        });
      }, 50);
    } else {
      // Submit form
      registerHandler();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      flatListRef.current?.scrollToIndex({
        index: currentStep - 2,
        animated: true,
        viewPosition: 0
      });
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    let newErrors = {};
    
    // Only validate the current step's fields
    if (step === 1) {
      // Step 1 validation - Personal Information
      if (!registerForm.username || registerForm.username.trim() === '') {
        newErrors.username = translations[language].auth.nameRequired;
        isValid = false;
      }
      
      if (!registerForm.phone || registerForm.phone.trim() === '') {
        newErrors.phone = translations[language].auth.phoneRequired;
        isValid = false;
      }
      
      if (!registerForm.password || registerForm.password.trim() === '') {
        newErrors.password = translations[language].auth.passowrdRequired;
        isValid = false;
      } else if (registerForm.password.length < 6) {
        newErrors.password = translations[language].auth.passwordValidation;
        isValid = false;
      }
      
      if (!registerForm.confirmPassword || registerForm.confirmPassword.trim() === '') {
        newErrors.confirmPassword = translations[language].auth.passwordConfirmation;
        isValid = false;
      } else if (registerForm.password !== registerForm.confirmPassword) {
        newErrors.confirmPassword = translations[language].auth.passwordMismatch;
        isValid = false;
      }
    }
    
    else if (step === 2) {
      // Step 2 validation - Business Information
      if (!registerForm.comercial_name || registerForm.comercial_name.trim() === '') {
        newErrors.comercial_name = translations[language].auth.businessNameRequired;
        isValid = false;
      }
      
      if (!selectedValue.city) {
        newErrors.city_id = translations[language].auth.cityRequired;
        isValid = false;
      }
    }
    
    // Only update errors for the current step
    const filteredErrors = { ...formErrors };
    
    // Clear previous errors for this step's fields to prevent old errors persisting
    if (step === 1) {
      delete filteredErrors.username;
      delete filteredErrors.phone;
      delete filteredErrors.password;
      delete filteredErrors.confirmPassword;
    } else if (step === 2) {
      delete filteredErrors.comercial_name;
      delete filteredErrors.city_id;
    }
    
    // Set new errors for this step
    setFormErrors({ ...filteredErrors, ...newErrors });
    
    return isValid;
  };

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/addresses/cities?language_code=${language}`, {
          credentials: "include",
          method: "GET",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        setCities(data.data);
      } catch (err) {
      }
    };
    fetchCities();
  }, [language]);

  const getStepIcon = (step) => {
    if (step === 1) return "user";
    if (step === 2) return "briefcase";
    if (step === 3) return "globe";
  };

  // Render each step form
  const renderStepForm = ({ item, index }) => {
    const stepFields = item.fields;
        
    if (!stepFields || stepFields.length === 0) {
      // Render a message if no fields are available
      return (
        <View style={styles.emptyFieldsContainer}>
          <Text style={styles.emptyFieldsText}>{translations[language].auth.noFields}</Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.stepContainer, { width }]}>
        <FlatList
          data={stepFields}
          keyExtractor={(field, i) => `field-${index}-${i}`}
          renderItem={({ item: field }) => (
            <View style={styles.fieldContainer}>
              <Field field={field} setSelectedValue={setSelectedValue} />
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.fieldsList}
          contentContainerStyle={styles.fieldsListContent}
          initialNumToRender={stepFields.length}
          maxToRenderPerBatch={stepFields.length}
          removeClippedSubviews={false}
        />
      </View>
    );
  };

  const registerHandler = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    
    try {
      // Final validation of all required fields
      const isStepValid = validateStep(currentStep);
      if (!isStepValid) {
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/register/business`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          "Content-Type": "application/json",
          'Accept-Language': language
        },
        body: JSON.stringify({
          name: registerForm.username,
          comercial_name: registerForm.comercial_name,
          email: registerForm.email || "",
          phone: registerForm.phone,
          password: registerForm.password,
          country: "palestine",
          city_id: selectedValue?.city?.value,
          address: registerForm.address,
          website: registerForm.website,
          tiktok: registerForm.tiktok,
          facebook: registerForm.facebook,
          instagram: registerForm.instagram
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.type === 'VALIDATION_ERROR') {
          const errors = {};
          data.details.forEach(error => {
            errors[error.field] = error.message;
          });
          setFormErrors(errors);
          console.log(errors)
          throw new Error(data.message || 'Validation error');
        }
        throw new Error(data.message || 'Registration failed');
      }

      // Handle successful registration
      Alert.alert(
        translations[language].auth.successRegiser,
        translations[language].auth.registerSuccess,
        [{ text: "OK", onPress: () => router.replace("/") }]
      );
    } catch (err) {
      setError(err.message);
      Alert.alert(
        translations[language].auth.registrationFailed,
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.container}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <Image 
            style={[styles.logo, keyboardVisible && styles.logoSmall]} 
            source={TayarLogo} 
            resizeMode="contain" 
          />
          
          <Animated.View 
            style={[
              styles.headerContent,
              { opacity: fadeAnim }
            ]}
          >
            {/* Step Indicators */}
            <View style={styles.stepsIndicator}>
              {[1, 2, 3].map((step) => (
                <View key={step} style={styles.stepIndicatorWrapper}>
                  <View style={[
                    styles.stepDot,
                    currentStep >= step ? styles.activeDot : styles.inactiveDot
                  ]}>
                    <Text style={[
                      styles.stepNumber,
                      currentStep >= step ? styles.activeStepText : styles.inactiveStepText
                    ]}>{step}</Text>
                  </View>
                  {step < 3 && (
                    <View style={[
                      styles.connector,
                      currentStep > step ? styles.activeConnector : styles.inactiveConnector
                    ]} />
                  )}
                </View>
              ))}
            </View>
            
            {/* Step Title */}
            <View style={styles.stepTitleRow}>
              <View style={styles.stepIconCircle}>
                <Feather name={getStepIcon(currentStep)} size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepTitle}>{allStepFields[currentStep-1].title}</Text>
            </View>
          </Animated.View>
        </View>
        
        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Step Forms */}
        <FlatList
          ref={flatListRef}
          data={allStepFields}
          renderItem={renderStepForm}
          keyExtractor={(item, index) => `step-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          scrollEventThrottle={16}
          style={styles.stepsContainer}
          initialNumToRender={3}
          onScrollToIndexFailed={(info) => {
            // Try again with a delay
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({
                  offset: info.index * width,
                  animated: false
                });
              }
            }, 100);
          }}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />
        
        {/* Navigation Buttons */}
        <View style={styles.footer}>
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handlePrevStep}
                activeOpacity={0.7}
              >
                <Feather 
                  name={rtl.isRTL ? "arrow-right" : "arrow-left"} 
                  size={18} 
                  color="#4361EE" 
                />
                <Text style={styles.backButtonText}>{translations[language].auth.back}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.nextButton,
                currentStep === 1 && !currentStep > 1 && styles.fullWidthButton,
                loading && styles.loadingButton
              ]} 
              onPress={() => {
                // Dismiss keyboard but use a small delay to prevent any race conditions
                Keyboard.dismiss();
                setTimeout(() => {
                  handleNextStep();
                }, 50);
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === 3 ?  translations[language].auth.createAccount :  translations[language].auth.next}
                  </Text>
                  {currentStep < 3 && (
                    <Feather 
                      name={rtl.isRTL ? "arrow-left" : "arrow-right"} 
                      size={18} 
                      color="#FFF" 
                      style={{marginLeft: 8}}
                    />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Step Indicator Text */}
          <Animated.View style={{opacity: fadeAnim}}>
            <Text style={styles.stepIndicatorText}>
              {translations[language].auth.step} {currentStep} {translations[language].auth.of} 3
            </Text>
          </Animated.View>
        </View>
      </View>
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
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  logoSmall: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  headerContent: {
    width: '100%',
    paddingHorizontal: 20,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    backgroundColor: '#4361EE',
  },
  inactiveDot: {
    backgroundColor: '#E5E7EB',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeStepText: {
    color: '#FFFFFF',
  },
  inactiveStepText: {
    color: '#6B7280',
  },
  connector: {
    height: 2,
    width: 40,
    marginHorizontal: 5,
  },
  activeConnector: {
    backgroundColor: '#4361EE',
  },
  inactiveConnector: {
    backgroundColor: '#E5E7EB',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10
  },
  stepIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4361EE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 226, 226, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    marginLeft: 10,
    color: '#B91C1C',
    fontSize: 14,
    flex: 1,
  },
  stepsContainer: {
    flex: 1,
    width: width,
    backgroundColor: '#F9FAFB',
  },
  stepContainer: {
    width: width,
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  fieldsList: {
    flex: 1,
  },
  fieldsListContent: {
    paddingTop: 20,
    paddingBottom: 40,
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
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#4361EE',
    borderRadius: 12,
    backgroundColor: 'transparent',
    minWidth: 100,
    gap: 10
  },
  backButtonText: {
    color: '#4361EE',
    fontSize: 16,
    fontWeight: '500'
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#4361EE',
    borderRadius: 12,
    flex: 1,
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
  fullWidthButton: {
    marginLeft: 0,
  },
  loadingButton: {
    backgroundColor: '#6B7BD1',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepIndicatorText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
  },
  emptyFieldsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyFieldsText: {
    color: '#64748B',
    fontSize: 14,
  }
});