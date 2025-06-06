import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLanguage } from './languageContext';

// This component wraps content and forces RTL direction
export function RTLWrapper({ children, style }) {
  const { language } = useLanguage();
  const shouldBeRTL = language === 'ar' || language === 'he';
  
  return (
    <View 
      style={[
        styles.container,
        shouldBeRTL && styles.rtlContainer,
        style
      ]}
    >
      {children}
    </View>
  );
}

// This hook provides RTL-aware styles
export function useRTLStyles() {
  const { language } = useLanguage();
  const shouldBeRTL = language === 'ar' || language === 'he';
  
  return {
    // Helper function to create RTL-aware styles
    createStyles: (baseStyles) => {
      const rtlTransformedStyles = {};
      
      // Transform styles to support RTL
      Object.keys(baseStyles).forEach(key => {
        const style = baseStyles[key];
        rtlTransformedStyles[key] = { ...style };
        
        // Transform specific properties for RTL
        if (shouldBeRTL) {
          // Handle flexDirection
          if (style.flexDirection === 'row') {
            rtlTransformedStyles[key].flexDirection = 'row-reverse';
          }
          
          // Swap left/right properties
          if (style.left !== undefined) {
            rtlTransformedStyles[key].right = style.left;
            delete rtlTransformedStyles[key].left;
          }
          if (style.right !== undefined) {
            rtlTransformedStyles[key].left = style.right;
            delete rtlTransformedStyles[key].right;
          }
          
          // Swap padding/margin left/right
          if (style.paddingLeft !== undefined) {
            rtlTransformedStyles[key].paddingRight = style.paddingLeft;
            delete rtlTransformedStyles[key].paddingLeft;
          }
          if (style.paddingRight !== undefined) {
            rtlTransformedStyles[key].paddingLeft = style.paddingRight;
            delete rtlTransformedStyles[key].paddingRight;
          }
          if (style.marginLeft !== undefined) {
            rtlTransformedStyles[key].marginRight = style.marginLeft;
            delete rtlTransformedStyles[key].marginLeft;
          }
          if (style.marginRight !== undefined) {
            rtlTransformedStyles[key].marginLeft = style.marginRight;
            delete rtlTransformedStyles[key].marginRight;
          }
          
          // Adjust text alignment
          if (style.textAlign === 'left') {
            rtlTransformedStyles[key].textAlign = 'keft';
          } else if (style.textAlign === 'right') {
            rtlTransformedStyles[key].textAlign = 'left';
          }
        }
      });
      
      return rtlTransformedStyles;
    },
    
    isRTL: shouldBeRTL,
    
    // Common RTL-aware styles
    text: shouldBeRTL ? { textAlign: 'right', writingDirection: 'rtl' } : {},
    row: shouldBeRTL ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' },
    rowReverse: shouldBeRTL ? { flexDirection: 'row' } : { flexDirection: 'row-reverse' },
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rtlContainer: {
    // Force RTL layout direction
    direction: 'rtl',
  },
});