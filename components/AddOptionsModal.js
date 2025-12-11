import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../utils/themeContext';
import { Colors } from '../constants/Colors';
import { useAuth } from '../RootLayout';
import { getUserData, saveUserData } from '../utils/secureStore';

export default function AddOptionsModal({ visible, onClose, userRole }) {
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  // State for onboarding tutorial
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Initialize onboarding state when component mounts
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (!user) return;

      // Fix: use userId instead of id
      const userId = user.id || user.userId;
      if (!userId) return;

      try {
        const hasSeenTutorial = await getUserData(userId, 'has_seen_add_options_tutorial');

        // If the user hasn't seen the tutorial and has the right role, mark it for showing
        if (hasSeenTutorial !== 'true' && ["driver", "delivery_company", "admin", "manager", "entery", "warehouse_admin", "warehouse_staff"].includes(userRole)) {
          // We don't set showOnboarding here, we'll do that when the modal becomes visible
        }
      } catch (error) {
      }
    };

    initializeOnboarding();
  }, []);

  // Onboarding content based on step with fallbacks and user role
  const onboardingContent = [
    {
      title: translations[language]?.onboarding?.assignOrdersTitle || "Assign Orders",
      message: translations[language]?.onboarding?.assignOrdersMessage || "Use this option to scan order QR codes and assign them to your route.",
      icon: <Feather name="camera" size={32} color="#FFFFFF" />
    },
    ["driver", "delivery_company"].includes(userRole) ?
      {
        title: translations[language]?.onboarding?.routesTitle || "Manage Routes",
        message: translations[language]?.onboarding?.routesMessage || "Create and manage delivery routes to optimize your deliveries.",
        icon: <MaterialIcons name="route" size={32} color="#FFFFFF" />
      } :
      {
        title: translations[language]?.onboarding?.createOrdersTitle || "Create Orders",
        message: translations[language]?.onboarding?.createOrdersMessage || "Create new orders quickly and efficiently.",
        icon: <Feather name="plus" size={32} color="#FFFFFF" />
      }
  ];

  // Reset onboarding state when modal is closed
  useEffect(() => {
    if (!visible) {
      setShowOnboarding(false);
      setCurrentStep(0);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  // Check if this is the first time opening the modal
  useEffect(() => {
    const checkFirstTimeUser = async () => {

      // Use userId instead of id
      const userId = user.id || user.userId;

      try {
        const hasSeenTutorial = await getUserData(userId, 'has_seen_add_options_tutorial');

        // Fix: explicitly check if hasSeenTutorial is null, undefined, or not equal to 'true'
        const shouldShowOnboarding = hasSeenTutorial !== 'true' && ["driver", "delivery_company", "admin", "manager", "entery", "warehouse_admin", "warehouse_staff"].includes(userRole);

        if (shouldShowOnboarding) {
          setShowOnboarding(true);

          // Use a short timeout to ensure state is updated before animation
          setTimeout(() => {
            animateOnboarding();
          }, 200);
        }
      } catch (error) {
      }
    };

    if (visible) {
      checkFirstTimeUser();
    }
  }, [visible, user, userRole]);

  const animateOnboarding = () => {
    // Make sure we're starting from the correct values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);

    // Use a short timeout to ensure the component is ready
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
      });
    }, 50);
  };

  const handleNextStep = () => {
    if (currentStep < 1) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);

      // Move to next step
      setCurrentStep(currentStep + 1);

      // Start animations again
      animateOnboarding();
    } else {
      handleFinishOnboarding();
    }
  };

  const handleFinishOnboarding = async () => {
    if (!user) return;

    // Fix: use userId instead of id
    const userId = user.id || user.userId;
    if (userId) {
      await saveUserData(userId, 'has_seen_add_options_tutorial', 'true');
    }
    setShowOnboarding(false);
  };

  const handleSkipTutorial = async () => {
    if (!user) return;

    // Fix: use userId instead of id
    const userId = user.id || user.userId;
    if (userId) {
      await saveUserData(userId, 'has_seen_add_options_tutorial', 'true');
    }
    setShowOnboarding(false);
  };

  const handleOptionPress = (path) => {
    onClose();
    router.push(path);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? "dark" : "light"}
        style={styles.modalOverlay}
      >
        {showOnboarding ? (
          <Animated.View
            style={[
              styles.onboardingContainer,
              {
                backgroundColor: colors.card,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.onboardingIconContainer}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.onboardingIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {onboardingContent[currentStep].icon}
              </LinearGradient>
            </View>

            <Text style={[styles.onboardingTitle, { color: colors.text }]}>
              {onboardingContent[currentStep].title}
            </Text>

            <Text style={[styles.onboardingMessage, { color: colors.textSecondary }]}>
              {onboardingContent[currentStep].message}
            </Text>

            <View style={styles.onboardingStepIndicator}>
              {onboardingContent.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stepDot,
                    index === currentStep ?
                      { backgroundColor: colors.primary, width: 10, height: 10 } :
                      { backgroundColor: colors.border }
                  ]}
                />
              ))}
            </View>

            <View style={styles.onboardingButtonsContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipTutorial}
              >
                <Text style={[styles.skipButtonText, { color: colors.textTertiary }]}>
                  {translations[language]?.common?.skip}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: colors.primary }]}
                onPress={handleNextStep}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep < onboardingContent.length - 1 ?
                    (translations[language]?.common?.next) :
                    (translations[language]?.common?.gotIt)}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <View style={[
            styles.modalContainer,
            { backgroundColor: colors.card }
          ]}>
            <View style={[
              styles.modalHeader
            ]}>
              <Text style={[
                styles.modalTitle,
                { color: colors.text }
              ]}>
                {translations[language]?.common?.selectOption || "Select Option"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {["driver", "delivery_company", "admin", "manager", "entery", "warehouse_admin", "warehouse_staff"].includes(userRole) ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      { backgroundColor: colors.surface }
                    ]}
                    onPress={() => handleOptionPress("/(camera)/assignOrdersDriver")}
                  >
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientEnd]}
                      style={styles.optionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Feather name="camera" size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[
                      styles.optionText,
                      { color: colors.text }
                    ]}>
                      {translations[language]?.common?.assignOrders || "Assign Orders"}
                    </Text>
                  </TouchableOpacity>

                 {!["driver","delivery_company"].includes(userRole) && <TouchableOpacity
                    style={[
                      styles.optionButton,
                      { backgroundColor: colors.surface }
                    ]}
                    onPress={() => handleOptionPress(["driver", "delivery_company"].includes(userRole) ? "/(routes)/" : "/(create)/")}
                  >
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientEnd]}
                      style={styles.optionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {["driver", "delivery_company"].includes(userRole) ? (
                        <MaterialIcons name="route" size={24} color="#FFFFFF" />
                      ) : (
                        <Feather name="plus" size={24} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                    <Text style={[
                      styles.optionText,
                      { color: colors.text }
                    ]}>
                      {["driver", "delivery_company"].includes(userRole)
                        ? (translations[language]?.routes?.title || "Routes")
                        : (translations[language]?.common?.createNew || "Create New")}
                    </Text>
                  </TouchableOpacity>}

                  {/* Ready Orders for Drivers */}
                  {["driver", "delivery_company"].includes(userRole) && (
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        { backgroundColor: colors.surface }
                      ]}
                      onPress={() => handleOptionPress("/(orders)/readyOrders")}
                    >
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        style={styles.optionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Feather name="package" size={24} color="#FFFFFF" />
                      </LinearGradient>
                      <Text style={[
                        styles.optionText,
                        { color: colors.text }
                      ]}>
                        {translations[language]?.common?.readyOrders || "Ready Orders"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => handleOptionPress("/(create)/")}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.optionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Feather name="plus" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[
                    styles.optionText,
                    { color: colors.text }
                  ]}>
                    {translations[language]?.common?.createNew || "Create New"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  optionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Onboarding styles
  onboardingContainer: {
    width: '90%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  onboardingIconContainer: {
    marginBottom: 24,
  },
  onboardingIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  onboardingMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  onboardingStepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onboardingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    fontSize: 14,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 