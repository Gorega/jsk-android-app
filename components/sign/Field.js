import { useState } from "react";
import { 
  StyleSheet, 
  TextInput, 
  Text, 
  Pressable, 
  View, 
  Platform,
  TouchableOpacity,
  Keyboard,
  Alert
} from "react-native";
import { Feather } from '@expo/vector-icons';
import PickerModal from "../pickerModal/PickerModal"
import { useLanguage } from '../../utils/languageContext';
import { useRouter } from 'expo-router';

export default function Field({field, setSelectedValue}) {
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { language } = useLanguage();
    const isRTL = ["he", "ar"].includes(language);
    const router = useRouter();

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
            
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users`, {
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
                    email: registerForm.email || null,
                    phone: registerForm.phone,
                    password: registerForm.password,
                    role_id: selectedValue?.role?.value,
                    manager_id: null,
                    affiliator: null,
                    branch_id: null,
                    pricelist_id: 2,
                    country: "palestine",
                    city_id: selectedValue?.city?.value,
                    area: registerForm.area,
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
                    throw new Error(data.message || 'Validation error');
                }
                throw new Error(data.message || 'Registration failed');
            }

            // Handle successful registration
            Alert.alert(
                "Registration Successful",
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
        <View style={[
            styles.fieldContainer,
            field.containerStyle,
            { borderColor: field.error ? "#EF4444" : isFocused ? "#4361EE" : "rgba(0,0,0,0.08)" }
        ]}>
            {/* Field Label */}
            <Text style={[
                styles.label,
                { 
                    left: isRTL ? undefined : 16,
                    right: isRTL ? 16 : undefined,
                    backgroundColor: "#fff",
                    color: field.error ? "#EF4444" : isFocused ? "#4361EE" : "#64748B",
                }
            ]}>
                {field.label}
            </Text>

            <View style={styles.inputContent}>
                {field.type === "input" && (
                    <View style={styles.inputWrapper}>
                        <View style={[
                            styles.iconContainer, 
                            {
                                left: isRTL ? undefined : 16,
                                right: isRTL ? 16 : undefined,
                            }
                        ]}>
                            <Feather 
                                name={getFieldIcon()} 
                                size={18} 
                                color={isFocused ? "#4361EE" : "#94A3B8"} 
                            />
                        </View>
                        
                        <TextInput
                            multiline={true}
                            style={[
                                styles.input,
                                {
                                    textAlign: isRTL ? "right" : "left",
                                    paddingLeft: isRTL ? 16 : 50,
                                    paddingRight: isRTL ? 50 : 16
                                }
                            ]}
                            value={field.value}
                            onChangeText={field.onChange}
                            secureTextEntry={field.secureTextEntry}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholderTextColor="#9CA3AF"
                            placeholder={field.placeholder}
                            keyboardType={field.keyboardType || "default"}
                            autoCapitalize={field.autoCapitalize || "sentences"}
                            returnKeyType="next"
                            blurOnSubmit={false}
                        />
                        
                        {field.error && (
                            <Text style={styles.errorText}>{field.error}</Text>
                        )}
                    </View>
                )}

                {field.type === "select" && (
                    <View style={styles.selectWrapper}>
                        <TouchableOpacity 
                          style={styles.selectField} 
                          onPress={() => {
                              setShowPickerModal(true);
                              setIsFocused(true);
                              field.onSelect && field.onSelect();
                          }}
                          activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconContainer,
                                {
                                    left: isRTL ? undefined : 16,
                                    right: isRTL ? 16 : undefined,
                                }
                            ]}>
                                <Feather 
                                    name={getFieldIcon()} 
                                    size={18} 
                                    color={isFocused ? "#4361EE" : "#94A3B8"} 
                                />
                            </View>
                            
                            <Text style={[
                                styles.selectText,
                                field.value ? styles.valueText : styles.placeholderText,
                                {
                                    textAlign: isRTL ? "right" : "left",
                                    paddingLeft: isRTL ? 16 : 50,
                                    paddingRight: isRTL ? 50 : 16
                                }
                            ]}>
                                {field.value || field.placeholder || 'Select...'}
                            </Text>
                            
                            <View style={[
                                styles.dropdownIconContainer,
                                {
                                    right: isRTL ? undefined : 16,
                                    left: isRTL ? 16 : undefined,
                                }
                            ]}>
                                <Feather name="chevron-down" size={18} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                        
                        {field.error && (
                            <Text style={styles.errorText}>{field.error}</Text>
                        )}
                    </View>
                )}

                {/* Picker Modal */}
                {showPickerModal && (
                    <PickerModal
                        list={field.list}
                        showPickerModal={showPickerModal}
                        setShowPickerModal={() => {
                            setShowPickerModal(false);
                            setIsFocused(false);
                        }}
                        setSelectedValue={setSelectedValue}
                        field={field}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fieldContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 0,
        position: 'relative',
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#fff",
        zIndex: 1,
    },
    inputContent: {
        width: '100%',
    },
    inputWrapper: {
        position: 'relative',
        width: '100%',
    },
    iconContainer: {
        position: 'absolute',
        top: 18,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    input: {
        fontSize: 16,
        paddingVertical: 18,
        color: '#1F2937',
        width: '100%',
        fontWeight: '400',
        minHeight: 58,
    },
    selectWrapper: {
        position: 'relative',
        width: '100%',
    },
    selectField: {
        width: '100%',
        position: 'relative',
        minHeight: 58,
        justifyContent: 'center',
    },
    selectText: {
        fontSize: 16,
        paddingVertical: 18,
        fontWeight: '400',
    },
    valueText: {
        color: '#1F2937',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    dropdownIconContainer: {
        position: 'absolute',
        top: 18,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        paddingHorizontal: 16,
        paddingBottom: 8,
        fontWeight: '500',
    }
});