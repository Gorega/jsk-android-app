import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLanguage } from '../utils/languageContext';
import { translations } from '../utils/languageContext';

const ReferenceModalContext = createContext();

export const useReferenceModal = () => {
    const context = useContext(ReferenceModalContext);
    if (!context) {
        throw new Error('useReferenceModal must be used within a ReferenceModalProvider');
    }
    return context;
};

export const ReferenceModalProvider = ({ children }) => {
    const { language } = useLanguage();
    const [referenceModalState, setReferenceModalState] = useState({
        isVisible: false,
        orderId: null,
        orderData: null,
        referenceIdInput: '',
        isUpdating: false,
        onSuccess: null,
        onError: null
    });

    // The event-based approach in GlobalReferenceModal.js now handles scanned references

    const showReferenceModal = useCallback((orderId, orderData, callbacks = {}) => {
        setReferenceModalState({
            isVisible: true,
            orderId,
            orderData,
            referenceIdInput: '',
            isUpdating: false,
            onSuccess: callbacks.onSuccess || null,
            onError: callbacks.onError || null
        });
    }, []);

    const hideReferenceModal = useCallback(() => {
        setReferenceModalState(prev => ({
            ...prev,
            isVisible: false,
            orderId: null,
            orderData: null,
            referenceIdInput: '',
            isUpdating: false,
            onSuccess: null,
            onError: null
        }));
    }, []);

    const updateReferenceInput = useCallback((value) => {
        setReferenceModalState(prev => ({
            ...prev,
            referenceIdInput: value
        }));
    }, []);

    const clearReferenceInput = useCallback(() => {
        setReferenceModalState(prev => ({
            ...prev,
            referenceIdInput: ''
        }));
    }, []);

    const submitReferenceId = useCallback(async () => {
        const { orderId, orderData: currentOrder, referenceIdInput, onSuccess, onError, isUpdating } = referenceModalState;

        // Prevent multiple simultaneous API calls
        if (isUpdating) {
            return;
        }

        if (!referenceIdInput || !referenceIdInput) {
            const errorMessage = translations[language]?.tabs?.orders?.order?.states?.referenceIdRequired || 
                'Reference ID is required';
            if (onError) {
                onError(errorMessage);
            } else {
                Alert.alert('Error', errorMessage);
            }
            return;
        }

        try {
            setReferenceModalState(prev => ({ ...prev, isUpdating: true }));

            // Ensure the order_id always has a suffix
            let modifiedOrderId = orderId;
            if (currentOrder && currentOrder.order_type_key) {
                if (currentOrder.order_type_key === 'receive' && !orderId.endsWith('-B')) {
                    modifiedOrderId = orderId + '-B';
                } else if (currentOrder.order_type_key === 'delivery/receive' && !orderId.endsWith('-R')) {
                    modifiedOrderId = orderId + '-R';
                }
            }
            
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${modifiedOrderId}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language,
                },
                credentials: 'include',
                body: JSON.stringify({ reference_id: referenceIdInput })
            });

            const data = await response.json();

            if (response.ok) {
                const successMessage = translations[language]?.tabs?.orders?.order?.states?.referenceIdUpdated || 
                    'Reference ID updated successfully';
                

                if (onSuccess) {
                    // The API response structure has order data under 'data' property
                    // We need to construct the order object with the updated reference_id
                    const updatedOrder = {
                        ...currentOrder,
                        order_id: data.data.order_id,
                        reference_id: referenceIdInput
                    };
                    onSuccess(updatedOrder, successMessage);
                }
                
                hideReferenceModal();
            } else {
                const errorMessage = data.message || 
                    (translations[language]?.tabs?.orders?.order?.states?.referenceIdUpdateError || 
                    'Failed to update Reference ID');
                

                if (onError) {
                    onError(errorMessage);
                } else {
                    Alert.alert('Error', errorMessage);
                }
            }
        } catch (error) {
            const errorMessage = translations[language]?.tabs?.orders?.order?.states?.referenceIdUpdateError || 
                'Failed to update Reference ID';
            if (onError) {
                onError(errorMessage);
            } else {
                Alert.alert('Error', errorMessage);
            }
        } finally {
            setReferenceModalState(prev => ({ ...prev, isUpdating: false }));
        }
    }, [referenceModalState, language, hideReferenceModal]);

    // Handle scanned reference ID from camera
    const handleScannedReference = useCallback((scannedValue) => {
        if (referenceModalState.isVisible && scannedValue) {
            updateReferenceInput(scannedValue);
        }
    }, [referenceModalState.isVisible, updateReferenceInput]);

    const value = {
        // State
        isVisible: referenceModalState.isVisible,
        orderId: referenceModalState.orderId,
        orderData: referenceModalState.orderData,
        referenceIdInput: referenceModalState.referenceIdInput,
        isUpdating: referenceModalState.isUpdating,
        
        // Actions
        showReferenceModal,
        hideReferenceModal,
        updateReferenceInput,
        clearReferenceInput,
        submitReferenceId,
        handleScannedReference
    };

    return (
        <ReferenceModalContext.Provider value={value}>
            {children}
        </ReferenceModalContext.Provider>
    );
};

export default ReferenceModalProvider;