import React, { useState, forwardRef } from "react";
import { 
  StyleSheet, 
  TextInput, 
  Text, 
  View, 
  Platform,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback
} from "react-native";
import { Feather } from '@expo/vector-icons';
import PickerModal from "../pickerModal/PickerModal"
import { useLanguage } from "../../utils/languageContext";
import { useTheme } from "../../utils/themeContext";
import { Colors } from "../../constants/Colors";

const Field = forwardRef(function Field({field, setSelectedValue, multiline, onFocus, isDark, colors}, ref) {
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const animatedOpacity = useState(new Animated.Value(0))[0];
    const animatedScale = useState(new Animated.Value(0.95))[0];
    const { language } = useLanguage();
    const isRTL = language === 'ar' || language === 'he';
    
    // Use provided colors or get from theme context
    const themeContext = useTheme();
    const themeColors = colors || (themeContext ? Colors[themeContext.colorScheme] : Colors.light);
    const isThemeDark = isDark !== undefined ? isDark : (themeContext ? themeContext.isDark : false);

    // Animation when field receives focus
    const handleFocus = () => {
        setIsFocused(true);
        // Notify parent component that this field is focused
        if (onFocus) onFocus(field.name, ref);
        
        Animated.parallel([
            Animated.timing(animatedOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(animatedScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    };

    // Animation when field loses focus
    const handleBlur = () => {
        setIsFocused(false);
        Animated.parallel([
            Animated.timing(animatedOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(animatedScale, {
                toValue: 0.95,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    };

    // Icon based on field type
    const getFieldIcon = () => {
        switch(field.name) {
            case 'email':
                return 'mail';
            case 'password':
            case 'confirmPassword':
                return 'lock';
            case 'phone':
            case 'second_phone':
                return 'phone';
            case 'username':
            case 'name':
            case 'firstName':
            case 'lastName':
                return 'user';
            case 'address':
                return 'map-pin';
            case 'city':
            case 'area':
            case 'country':
                return 'map';
            case 'website':
                return 'globe';
            case 'comercial_name':
            case 'commercial_name':
                return 'briefcase';
            case 'tiktok':
            case 'facebook':
            case 'instagram':
                return 'hash';
            default:
                return field.type === 'select' ? 'chevron-down' : 'edit-3';
        }
    };

    // Handle input field press - ensure focus
    const handleInputPress = () => {
        // This will programmatically focus the TextInput
        if (ref && ref.current) {
            ref.current.focus();
        }
    };

    // Get iOS textContentType based on field name
    const getTextContentType = (fieldName) => {
        if (Platform.OS !== 'ios') return undefined;
        
        switch(fieldName) {
            case 'email':
                return 'emailAddress';
            case 'password':
                return 'password';
            case 'confirmPassword':
                return 'newPassword';
            case 'phone':
            case 'second_phone':
                return 'telephoneNumber';
            case 'name':
                return 'name';
            case 'address':
                return 'fullStreetAddress';
            case 'city':
                return 'addressCity';
            case 'area':
                return 'addressCity';
            case 'country':
                return 'countryName';
            default:
                return undefined;
        }
    };

    return (
        <View style={[
            styles.fieldContainer,
            field.containerStyle,
            { 
                borderColor: field.error ? themeColors.error : isFocused ? themeColors.primary : isThemeDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                marginBottom: field.error ? 32 : 16, // Dynamic margin based on error
                backgroundColor: themeColors.card
            }
        ]}>
            {/* Field Label */}
            <Text style={[
                styles.label,
                { 
                    backgroundColor: themeColors.card,
                    color: field.error ? themeColors.error : isFocused ? themeColors.primary : themeColors.textSecondary,
                }
            ]}>
                {field.label}
            </Text>

            <View style={styles.inputContent}>
                {field.type === "input" && (
                    <TouchableWithoutFeedback onPress={handleInputPress}>
                        <View style={styles.inputWrapper}>
                            <View style={[
                                styles.iconContainer,
                                isFocused && styles.activeIconContainer,
                                {textAlign: isRTL ? 'right' : 'left'}
                            ]}>
                                <Feather 
                                    name={getFieldIcon()} 
                                    size={18} 
                                    color={isFocused ? themeColors.primary : themeColors.iconDefault} 
                                />
                            </View>
                            
                            <TextInput
                                ref={ref}
                                multiline={multiline}
                                style={[
                                    styles.input,
                                    { color: themeColors.text },
                                    isFocused && [styles.activeInput, { color: themeColors.primary }],
                                    {textAlign: isRTL ? 'right' : 'left'}
                                ]}
                                value={field.value}
                                onChangeText={field.onChange}
                                secureTextEntry={field.secureTextEntry}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                onSubmitEditing={field.onSubmitEditing}
                                placeholderTextColor={themeColors.textTertiary}
                                placeholder={field.placeholder}
                                keyboardType={field.keyboardType || "default"}
                                autoCapitalize={field.autoCapitalize || "sentences"}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                enablesReturnKeyAutomatically={true}
                                textContentType={getTextContentType(field.name)}
                                autoCorrect={false}
                                spellCheck={false}
                            />
                            
                            {field.rightIcon && (
                                <View style={styles.rightIconContainer}>
                                    {field.rightIcon}
                                </View>
                            )}
                            
                            <Animated.View 
                                style={[
                                    styles.focusBorder,
                                    {
                                        opacity: animatedOpacity,
                                        transform: [{ scale: animatedScale }],
                                        borderColor: `${themeColors.primary}40` // 25% opacity
                                    }
                                ]} 
                                pointerEvents="none"
                            />
                            
                            {field.error && (
                                <Text style={[
                                    styles.errorText,
                                    { color: themeColors.error },
                                    {
                                        ...Platform.select({
                                            ios: {
                                                textAlign: isRTL ? "left" : ""
                                            }
                                        }),
                                    }
                                ]}>
                                    {field.error}
                                </Text>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                )}

                {field.type === "select" && (
                    <View style={styles.selectWrapper}>
                        <TouchableOpacity 
                          style={[
                              styles.selectField,
                              {textAlign: isRTL ? 'right' : 'left'}
                          ]} 
                          onPress={() => {
                              setShowPickerModal(true);
                              handleFocus();
                              field.onSelect && field.onSelect();
                          }}
                          activeOpacity={0.7}
                        >
                            <View style={{flexDirection: 'row'}}>
                                <View style={[
                                    styles.iconContainer,
                                    isFocused && styles.activeIconContainer
                                ]}>
                                    <Feather 
                                        name={getFieldIcon()} 
                                        size={18} 
                                        color={isFocused ? themeColors.primary : themeColors.iconDefault} 
                                    />
                                </View>
                                
                                <Text style={[
                                    styles.selectText,
                                    field.value ? [styles.valueText, { color: themeColors.text }] : [styles.placeholderText, { color: themeColors.textTertiary }]
                                ]}>
                                    {field.value || field.placeholder || 'Select...'}
                                </Text>
                            </View>
                            
                            <View style={[
                                styles.dropdownIconContainer
                            ]}>
                                <Feather name="chevron-down" size={18} color={themeColors.iconDefault} />
                            </View>
                            
                            <Animated.View 
                                style={[
                                    styles.focusBorder,
                                    {
                                        opacity: animatedOpacity,
                                        transform: [{ scale: animatedScale }],
                                        borderColor: `${themeColors.primary}40` // 25% opacity
                                    }
                                ]} 
                                pointerEvents="none"
                            />
                        </TouchableOpacity>
                        
                        {field.error && (
                            <Text style={[
                                styles.errorText,
                                { color: themeColors.error },
                                {
                                    ...Platform.select({
                                        ios: {
                                            textAlign: isRTL ? "left" : ""
                                        }
                                    }),
                                }
                            ]}>
                                {field.error}
                            </Text>
                        )}
                    </View>
                )}

                {/* Picker Modal */}
                {showPickerModal && (
                    <PickerModal
                        list={field.list}
                        showPickerModal={showPickerModal}
                        setShowModal={() => {
                            setShowPickerModal(false);
                            handleBlur();
                        }}
                        setSelectedValue={setSelectedValue}
                        field={{
                            ...field,
                            showSearchBar: field.name === 'city', // Show search bar for city field
                        }}
                        prickerSearchValue={searchValue}
                        setPickerSearchValue={setSearchValue}
                        isDark={isThemeDark}
                        colors={themeColors}
                    />
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    fieldContainer: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 0,
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    label: {
        position: 'absolute',
        top: -10,
        paddingHorizontal: 8,
        fontSize: 14,
        fontWeight: '500',
        zIndex: 1,
    },
    inputContent: {
        width: '100%',
    },
    inputWrapper: {
        position: 'relative',
        width: '100%',
        flexDirection: 'row',
        paddingHorizontal: 10,
        gap: 10
    },
    iconContainer: {
        position: 'relative',
        top: 15,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    activeIconContainer: {
        transform: [{ scale: 1.1 }]
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 18,
        paddingRight: 16,
        paddingLeft: 8,
        fontWeight: '400',
        minHeight: 58,
        zIndex: 1,
    },
    activeInput: {
        // Color is applied dynamically
    },
    rightIconContainer: {
        position: 'absolute',
        right: 10,
        top: 0,
        height: '100%',
        justifyContent: 'center',
        zIndex: 2,
    },
    focusBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 16,
        borderWidth: 2,
        pointerEvents: 'none',
        zIndex: 0,
    },
    selectWrapper: {
        position: 'relative',
        width: '100%',
        flexDirection: 'row',
        paddingHorizontal: 10,
    },
    selectField: {
        width: '100%',
        position: 'relative',
        minHeight: 58,
        justifyContent: 'center',
        zIndex: 1,
    },
    selectText: {
        fontSize: 16,
        paddingVertical: 18,
        fontWeight: '400',
        zIndex: 1,
    },
    valueText: {
        // Color is applied dynamically
    },
    placeholderText: {
        // Color is applied dynamically
    },
    dropdownIconContainer: {
        position: 'absolute',
        top: 18,
        right: 16,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    errorText: {
        fontSize: 12,
        paddingHorizontal: 16,
        fontWeight: '500',
        position: 'absolute',
        width: '100%',
        marginTop: 4,
        left: 0,
        right: 0,
        bottom: -22,
        zIndex: 2,
    }
});

export default Field;