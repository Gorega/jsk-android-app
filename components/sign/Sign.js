import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  StatusBar,
  Platform,
  SafeAreaView,
  Animated,
  Dimensions
} from "react-native";
import TayarLogo from "../../assets/images/tayar_logo.png";
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Field from "./Field";
import { useLanguage } from '../../utils/languageContext';

const { width } = Dimensions.get('window');

export default function SignUp({setSelectedValue, error}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  const { language } = useLanguage();
  const isRTL = ["he", "ar"].includes(language);

  // Translate according to current step
  const handleNextStep = () => {
    // Validate current step
    const isValid = validateStep(currentStep);
    if (!isValid) return;

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({
        x: width * currentStep,
        animated: true
      });
    } else {
      // Submit form
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({
        x: width * (currentStep - 2),
        animated: true
      });
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    let newErrors = {};
    
    if (step === 1) {
      // Step 1 validation
      if (!formData.name) {
        newErrors.name = 'Name is required';
        isValid = false;
      }
      
      if (!formData.phone) {
        newErrors.phone = 'Phone is required';
        isValid = false;
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }
    
    else if (step === 2) {
      // Step 2 validation
      if (!formData.commercial_name) {
        newErrors.commercial_name = 'Commercial name is required';
        isValid = false;
      }
      
      if (!formData.city) {
        newErrors.city = 'City is required';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    // Submit the form data to your backend
    console.log('Form submitted successfully', formData);
    // Add your API call here
  };

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Step 1: Personal Information
  const step1Fields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'input',
      value: formData.name || '',
      onChange: (value) => handleChange('name', value),
      error: errors.name,
      placeholder: 'Enter your full name',
      required: true
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'input',
      value: formData.email || '',
      onChange: (value) => handleChange('email', value),
      error: errors.email,
      placeholder: 'Enter your email (optional)'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'input',
      value: formData.phone || '',
      onChange: (value) => handleChange('phone', value),
      error: errors.phone,
      placeholder: 'Enter your phone number',
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: 'input',
      value: formData.password || '',
      onChange: (value) => handleChange('password', value),
      error: errors.password,
      placeholder: 'Create a password',
      required: true
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'input',
      value: formData.confirmPassword || '',
      onChange: (value) => handleChange('confirmPassword', value),
      error: errors.confirmPassword,
      placeholder: 'Confirm your password',
      required: true
    }
  ];

  // Step 2: Business Information
  const step2Fields = [
    {
      name: 'commercial_name',
      label: 'Business Name',
      type: 'input',
      value: formData.commercial_name || '',
      onChange: (value) => handleChange('commercial_name', value),
      error: errors.commercial_name,
      placeholder: 'Enter your business name',
      required: true
    },
    {
      name: 'commercial_activity',
      label: 'Business Activity',
      type: 'input',
      value: formData.commercial_activity || '',
      onChange: (value) => handleChange('commercial_activity', value),
      error: errors.commercial_activity,
      placeholder: 'What do you sell/provide? (optional)'
    },
    {
      name: 'city',
      label: 'City',
      type: 'input',
      value: formData.city || '',
      onChange: (value) => handleChange('city', value),
      error: errors.city,
      placeholder: 'Enter your city',
      required: true
    },
    {
      name: 'area',
      label: 'Area',
      type: 'input',
      value: formData.area || '',
      onChange: (value) => handleChange('area', value),
      error: errors.area,
      placeholder: 'Enter your area (optional)'
    },
    {
      name: 'second_phone',
      label: 'Alternate Phone',
      type: 'input',
      value: formData.second_phone || '',
      onChange: (value) => handleChange('second_phone', value),
      error: errors.second_phone,
      placeholder: 'Enter alternate phone (optional)'
    }
  ];

  // Step 3: Social Media Information
  const step3Fields = [
    {
      name: 'website',
      label: 'Website',
      type: 'input',
      value: formData.website || '',
      onChange: (value) => handleChange('website', value),
      error: errors.website,
      placeholder: 'Enter your website URL (optional)'
    },
    {
      name: 'tiktok',
      label: 'TikTok',
      type: 'input',
      value: formData.tiktok || '',
      onChange: (value) => handleChange('tiktok', value),
      error: errors.tiktok,
      placeholder: 'Enter your TikTok handle (optional)'
    },
    {
      name: 'facebook',
      label: 'Facebook',
      type: 'input',
      value: formData.facebook || '',
      onChange: (value) => handleChange('facebook', value),
      error: errors.facebook,
      placeholder: 'Enter your Facebook page (optional)'
    },
    {
      name: 'instagram',
      label: 'Instagram',
      type: 'input',
      value: formData.instagram || '',
      onChange: (value) => handleChange('instagram', value),
      error: errors.instagram,
      placeholder: 'Enter your Instagram handle (optional)'
    }
  ];

  const getStepIcon = (step) => {
    if (step === 1) return <Feather name="user" size={22} color="#FFFFFF" />;
    if (step === 2) return <Feather name="briefcase" size={22} color="#FFFFFF" />;
    if (step === 3) return <Feather name="globe" size={22} color="#FFFFFF" />;
  };

  const getStepTitle = (step) => {
    if (step === 1) return "Personal Information";
    if (step === 2) return "Business Details";
    if (step === 3) return "Social Media";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Logo & Header */}
      <View style={styles.headerContainer}>
        <Image style={styles.logo} source={TayarLogo} resizeMode="contain" />
        
        {/* Step Indicators */}
        <View style={styles.stepsContainer}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepIndicatorWrapper}>
              <View style={[
                styles.stepIndicator,
                currentStep >= step ? styles.activeStep : styles.inactiveStep
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
      </View>
      
      {/* Step Title */}
      <View style={styles.stepTitleContainer}>
        <View style={styles.stepIconContainer}>
          {getStepIcon(currentStep)}
        </View>
        <Text style={styles.stepTitle}>{getStepTitle(currentStep)}</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Error Message */}
                    {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Feather name="alert-circle" size={20} color="#FFF" />
            </View>
                        <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}
        
        {/* Form */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          style={styles.horizontalScroll}
        >
          {/* Step 1 */}
          <View style={[styles.formPage, { width: width }]}>
            <ScrollView 
              style={styles.formScroll} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: isRTL ? 'flex-end' : 'flex-start',
                paddingBottom: 20
              }}
            >
              {step1Fields.map((field, index) => (
                <Field key={index} field={field} setSelectedValue={setSelectedValue} />
              ))}
            </ScrollView>
          </View>
          
          {/* Step 2 */}
          <View style={[styles.formPage, { width: width }]}>
            <ScrollView 
              style={styles.formScroll} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: isRTL ? 'flex-end' : 'flex-start',
                paddingBottom: 20
              }}
            >
              {step2Fields.map((field, index) => (
                <Field key={index} field={field} setSelectedValue={setSelectedValue} />
              ))}
            </ScrollView>
          </View>
          
          {/* Step 3 */}
          <View style={[styles.formPage, { width: width }]}>
            <ScrollView 
              style={styles.formScroll} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: isRTL ? 'flex-end' : 'flex-start',
                paddingBottom: 20
              }}
            >
              {step3Fields.map((field, index) => (
                <Field key={index} field={field} setSelectedValue={setSelectedValue} />
              ))}
                </ScrollView>
            </View>
        </Animated.ScrollView>
      </View>
      
      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handlePrevStep}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Feather 
                  name={isRTL ? "arrow-right" : "arrow-left"} 
                  size={18} 
                  color="#4361EE" 
                  style={{marginRight: 8}}
                />
                <Text style={styles.backButtonText}>Back</Text>
              </View>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              currentStep === 1 && styles.fullWidthButton
            ]} 
            onPress={handleNextStep}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'Sign Up' : 'Next'}
              </Text>
              {currentStep < 3 && (
                <Feather 
                  name={isRTL ? "arrow-left" : "arrow-right"} 
                  size={18} 
                  color="#FFF" 
                  style={{marginLeft: 8}}
                />
              )}
            </View>
            </TouchableOpacity>
</View>

        {/* Bottom Note */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            {currentStep === 3 ? 
              "By signing up, you agree to our Terms & Conditions and Privacy Policy" :
              `Step ${currentStep} of 3 - ${
                currentStep === 1 ? 'Personal Information' : 
                currentStep === 2 ? 'Business Details' : 'Social Media'
              }`
            }
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 10,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    paddingVertical: 20,
  },
  stepIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  activeStep: {
    backgroundColor: '#4361EE',
  },
  inactiveStep: {
    backgroundColor: '#E5E7EB',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeStepText: {
    color: '#FFFFFF',
  },
  inactiveStepText: {
    color: '#6B7280',
  },
  connector: {
    height: 3,
    width: 50,
    marginHorizontal: 5,
  },
  activeConnector: {
    backgroundColor: '#4361EE',
  },
  inactiveConnector: {
    backgroundColor: '#E5E7EB',
  },
  stepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  stepIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4361EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    },
    errorMessage: {
    flex: 1,
    color: '#EF4444',
    fontSize: 14,
    fontWeight: "500",
  },
  horizontalScroll: {
    flex: 1,
  },
  formPage: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextButton: {
    backgroundColor: '#4361EE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#4361EE',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#4361EE',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNote: {
    marginTop: 16,
    alignItems: 'center',
  },
  bottomNoteText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  }
});