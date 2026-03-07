import React from 'react';
import { Platform } from 'react-native';
import IOSReferenceOverlay from './IOSReferenceOverlay';
import AndroidReferenceModal from './AndroidReferenceModal';

const GlobalReferenceModal = () => {
    if (Platform.OS === 'ios') {
        return <IOSReferenceOverlay />;
    }

    return <AndroidReferenceModal />;
};

export default GlobalReferenceModal;