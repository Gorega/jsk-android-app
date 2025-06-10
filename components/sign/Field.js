import { useState } from "react";
import { 
  StyleSheet, 
  TextInput, 
  Text, 
  View, 
  Platform,
  TouchableOpacity
} from "react-native";
import { Feather } from '@expo/vector-icons';
import PickerModal from "../pickerModal/PickerModal"

export default function Field({field, setSelectedValue, multiline}) {
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

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


    return (
        <View style={[
            styles.fieldContainer,
            field.containerStyle,
            { 
                borderColor: field.error ? "#EF4444" : isFocused ? "#4361EE" : "rgba(0,0,0,0.08)",
                marginBottom: field.error ? 32 : 16 // Dynamic margin based on error
            }
        ]}>
            {/* Field Label */}
            <Text style={[
                styles.label,
                { 
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
                            styles.iconContainer
                        ]}>
                            <Feather 
                                name={getFieldIcon()} 
                                size={18} 
                                color={isFocused ? "#4361EE" : "#94A3B8"} 
                            />
                        </View>
                        
                        <TextInput
                            multiline={multiline}
                            style={[
                                styles.input
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
                                styles.iconContainer
                            ]}>
                                <Feather 
                                    name={getFieldIcon()} 
                                    size={18} 
                                    color={isFocused ? "#4361EE" : "#94A3B8"} 
                                />
                            </View>
                            
                            <Text style={[
                                styles.selectText,
                                field.value ? styles.valueText : styles.placeholderText
                            ]}>
                                {field.value || field.placeholder || 'Select...'}
                            </Text>
                            
                            <View style={[
                                styles.dropdownIconContainer
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
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 18,
        paddingRight: 16,
        paddingLeft: 8,
        color: '#1F2937',
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
        fontWeight: '500',
        position: 'absolute',
        zIndex: 2,
        width: '100%',
        marginTop: 4,
        left: 0,
        right: 0,
        bottom:-22,
        zIndex: 2,
    }
});