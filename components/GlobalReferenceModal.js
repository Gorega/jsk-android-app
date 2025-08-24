import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ModalPresentation from './ModalPresentation';
import { useReferenceModal } from '../contexts/ReferenceModalContext';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';
import { useTheme } from '../utils/themeContext';
import { Colors } from '../constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import eventEmitter, { EVENTS } from '../utils/eventEmitter';

const GlobalReferenceModal = () => {
    const { language } = useLanguage();
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
    
    const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);

    // Listen for camera and scanned reference events
    useEffect(() => {
        const unsubscribeScanned = eventEmitter.on(EVENTS.REFERENCE_SCANNED, (scannedValue) => {
            if (scannedValue) {
                updateReferenceInput(scannedValue);
                // Make sure modal is visible after scan
                setIsTemporarilyHidden(false);
            }
        });

        const unsubscribeCameraOpened = eventEmitter.on(EVENTS.CAMERA_OPENED, () => {
            // Hide modal when camera opens
            setIsTemporarilyHidden(true);
        });

        const unsubscribeCameraClosed = eventEmitter.on(EVENTS.CAMERA_CLOSED, () => {
            // Show modal when camera closes (if it was visible before)
            if (isVisible) {
                setIsTemporarilyHidden(false);
            }
        });
        
        // Cleanup listeners on unmount
        return () => {
            unsubscribeScanned();
            unsubscribeCameraOpened();
            unsubscribeCameraClosed();
        };
    }, [updateReferenceInput, isVisible]);

    const handleScanReference = () => {
        // Temporarily hide the modal
        setIsTemporarilyHidden(true);
        
        // Navigate to camera screen
        router.push('/(camera)/scanReference');
    };
    
    // Remove the useFocusEffect since we now handle visibility with camera events

    if (!isVisible) {
        return null;
    }

    return (
        <ModalPresentation
            showModal={isVisible && !isTemporarilyHidden}
            setShowModal={hideReferenceModal}
            customStyles={{ bottom: 15 }}
            closeOnBackdropPress={false}
        >
            <View style={styles.referenceModalContainer}>
                <View style={styles.referenceHeader}>
                    <View style={styles.referenceIconBubble}>
                        <MaterialIcons name="tag" size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.referenceTitle, { color: colors.text }]}>
                            {translations[language]?.tabs?.orders?.order?.enterReferenceId}
                        </Text>
                        <Text style={[styles.referenceSubtitle, { color: colors.textSecondary }]}>
                            {translations[language]?.tabs?.orders?.order?.referenceIdHelper}
                        </Text>
                        {orderId && (
                            <Text style={[styles.orderIdText, { color: colors.textSecondary }]}>
                                Order: {orderId}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={[styles.referenceInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <MaterialIcons name="confirmation-number" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.referenceInput, { color: colors.text }]}
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
                        onPress={submitReferenceId}
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
        </ModalPresentation>
    );
};

const styles = StyleSheet.create({
    referenceModalContainer: {
        padding: 16,
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
    referenceInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    referenceInput: {
        flex: 1,
        fontSize: 15,
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
        paddingVertical: 10,
        paddingHorizontal: 18,
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
    },
});

export default GlobalReferenceModal;