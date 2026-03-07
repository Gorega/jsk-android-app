import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    Platform, 
    Animated, 
    Dimensions,
    SafeAreaView,
    KeyboardAvoidingView,
    Alert
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useReferenceModal } from '../contexts/ReferenceModalContext';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import { useTheme } from '../utils/themeContext';
import { Colors } from '../constants/Colors';
import { router } from 'expo-router';
import eventEmitter, { EVENTS } from '../utils/eventEmitter';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const { height: screenHeight } = Dimensions.get('window');

const IOSReferenceOverlay = () => {
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    const {
        isVisible,
        orderId,
        orderData,
        referenceIdInput,
        isUpdating,
        hideReferenceModal,
        updateReferenceInput,
        clearReferenceInput,
        submitReferenceId
    } = useReferenceModal();
    
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    
    // Handle visibility changes
    useEffect(() => {
        if (isVisible && !isTemporarilyHidden) {
            setOverlayVisible(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: screenHeight,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setOverlayVisible(false);
                setErrorMessage('');
                setShowError(false);
            });
        }
    }, [isVisible, isTemporarilyHidden]);

    // Listen for camera events and scanned references
    useEffect(() => {
        const unsubscribeScanned = eventEmitter.on(EVENTS.REFERENCE_SCANNED, (scannedValue) => {
            if (scannedValue) {
                updateReferenceInput(scannedValue);
                setIsTemporarilyHidden(false); // Show modal again after scan
            }
        });

        const unsubscribeCameraOpened = eventEmitter.on(EVENTS.CAMERA_OPENED, () => {
            setIsTemporarilyHidden(true); // Hide modal when camera opens
        });

        const unsubscribeCameraClosed = eventEmitter.on(EVENTS.CAMERA_CLOSED, () => {
            if (isVisible) {
                setIsTemporarilyHidden(false); // Show modal when camera closes
            }
        });
        
        return () => {
            unsubscribeScanned();
            unsubscribeCameraOpened();
            unsubscribeCameraClosed();
        };
    }, [updateReferenceInput, isVisible]);

    // Listen for error events
    useEffect(() => {
        const unsubscribeError = eventEmitter.on(EVENTS.REFERENCE_ERROR, (message) => {
            setErrorMessage(message);
            setShowError(true);
        });
        
        return () => {
            unsubscribeError();
        };
    }, []);

    const handleScanReference = () => {
        setIsTemporarilyHidden(true); // Hide modal before navigating
        router.push('/(camera)/scanReference');
    };

    const handleClose = () => {
        hideReferenceModal();
    };

    const handleSubmit = async () => {
        try {
            // Clear any previous errors
            setErrorMessage('');
            setShowError(false);
            
            // Call the submit function from context
            await submitReferenceId();
        } catch (error) {
            // Handle error locally
            setErrorMessage(error.message || translations[language]?.tabs?.orders?.order?.states?.referenceIdUpdateError || 
                'Failed to update Reference ID');
            setShowError(true);
        }
    };

    const closeErrorMessage = () => {
        setShowError(false);
        setErrorMessage('');
    };

    if (!overlayVisible || isTemporarilyHidden) {
        return null;
    }

    return (
        <View style={styles.overlayContainer}>
            <Animated.View 
                style={[
                    styles.backdrop,
                    { opacity: opacityAnim }
                ]}
            >
                <TouchableOpacity 
                    style={StyleSheet.absoluteFill} 
                    onPress={handleClose}
                    activeOpacity={1}
                />
            </Animated.View>
            
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView 
                    behavior="padding" 
                    style={styles.keyboardAvoid}
                >
                    <Animated.View 
                        style={[
                            styles.modalContent,
                            { 
                                backgroundColor: colors.modalBg,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {showError && (
                            <View style={styles.errorContainer}>
                                <View style={styles.errorIconContainer}>
                                    <FontAwesome5 name="exclamation-circle" size={16} color="#FFFFFF" />
                                </View>
                                <Text style={styles.errorText}>{errorMessage}</Text>
                                <TouchableOpacity 
                                    style={styles.errorCloseButton}
                                    onPress={closeErrorMessage}
                                >
                                    <MaterialIcons name="close" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        <View style={styles.referenceModalContainer}>
                            <View style={styles.referenceHeader}>
                                <View style={styles.referenceIconBubble}>
                                    <MaterialIcons name="tag" size={18} color="#FFFFFF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        styles.referenceTitle, 
                                        { color: colors.text },
                                        Platform.OS === 'ios' && isRTL && { textAlign: 'left' }
                                    ]}>
                                        {translations[language]?.tabs?.orders?.order?.enterReferenceId}
                                    </Text>
                                    <Text style={[
                                        styles.referenceSubtitle, 
                                        { color: colors.textSecondary },
                                        Platform.OS === 'ios' && isRTL && { textAlign: 'left' }
                                    ]}>
                                        {translations[language]?.tabs?.orders?.order?.referenceIdHelper}
                                    </Text>
                                    {orderId && (
                                        <Text style={[
                                            styles.orderIdText, 
                                            { color: colors.textSecondary },
                                            Platform.OS === 'ios' && isRTL && { textAlign: 'left' }
                                        ]}>
                                            Order: {orderId}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity 
                                    onPress={handleClose}
                                    style={styles.closeButton}
                                >
                                    <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.referenceInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <MaterialIcons name="confirmation-number" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={[
                                        styles.referenceInput, 
                                        { color: colors.text },
                                        Platform.OS === 'ios' && isRTL && { textAlign: 'right' }
                                    ]}
                                    placeholder={translations[language]?.tabs?.orders?.order?.referenceIdPlaceholder}
                                    placeholderTextColor={colors.textSecondary}
                                    value={referenceIdInput}
                                    onChangeText={updateReferenceInput}
                                    autoFocus
                                />
                                <TouchableOpacity
                                    onPress={clearReferenceInput}
                                    style={styles.clearInputBtn}
                                >
                                    <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.referenceActionsRow}>
                                <TouchableOpacity 
                                    style={styles.scanActionButton}
                                    onPress={handleScanReference}
                                    disabled={isUpdating}
                                >
                                    <MaterialIcons name="qr-code-scanner" size={18} color="#4361EE" />
                                    <Text style={styles.scanActionText}>
                                        {translations[language]?.tabs?.orders?.order?.scan}
                                    </Text>
                                </TouchableOpacity>

                                <View style={{ flex: 1 }} />

                                <TouchableOpacity 
                                    style={[styles.primaryButton, isUpdating && styles.primaryButtonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={isUpdating || !referenceIdInput.trim()}
                                >
                                    {isUpdating ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>
                                            {translations[language]?.tabs?.orders?.order?.save}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    keyboardAvoid: {
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        minHeight: 200,
    },
    errorContainer: {
        backgroundColor: '#EF4444',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorIconContainer: {
        marginRight: 10,
    },
    errorText: {
        color: '#FFFFFF',
        flex: 1,
        fontSize: 14,
    },
    errorCloseButton: {
        padding: 4,
    },
    referenceModalContainer: {
        padding: 20,
        paddingBottom: 30,
        gap: 16,
    },
    referenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    referenceIconBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    referenceTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    referenceSubtitle: {
        fontSize: 12,
        opacity: 0.8,
        marginTop: 2,
    },
    orderIdText: {
        fontSize: 11,
        opacity: 0.7,
        marginTop: 4,
        fontWeight: '500',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referenceInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    referenceInput: {
        flex: 1,
        fontSize: 15,
        minHeight: 20,
    },
    clearInputBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    referenceActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    scanActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(67, 97, 238, 0.08)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    scanActionText: {
        color: '#4361EE',
        fontWeight: '600',
    },
    primaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#10B981',
        borderRadius: 10,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonDisabled: {
        backgroundColor: '#6EE7B7',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default IOSReferenceOverlay;
