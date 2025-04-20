import { useState } from "react";
import { StyleSheet,TextInput,Text, Pressable, View } from "react-native";
import PickerModal from "../pickerModal/PickerModal"
import { useLanguage } from '../../utils/languageContext';

export default function Field({field, setSelectedValue}) {
    const [showPickerModal, setShowPickerModal] = useState(false);
    const { language } = useLanguage();

    return (
        <View style={[
            styles.fieldContainer,
            field.containerStyle,
            { borderColor: field.error ? "red" : "rgba(0,0,0,0.2)" }
        ]}>
            {/* Field Label */}
            <Text style={[
                styles.label,
                { 
                    left: ["he", "ar"].includes(language) ? undefined : 10,
                    right: ["he", "ar"].includes(language) ? 10 : undefined,
                    backgroundColor: "#fff",
                }
            ]}>
                {field.label}
            </Text>

            <View style={styles.inputContent}>
                {field.type === "input" && (
                    <>
                        <TextInput
                            multiline
                            style={[
                                styles.input,
                                {textAlign: ["ar","he"].includes(language) ? "right" : "left"}
                            ]}
                            value={field.value}
                            onChangeText={field.onChange}
                            secureTextEntry={field.name === "password"}
                        />
                        {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                    </>
                )}

                {field.type === "select" && (
                    <>
                    <Pressable 
                    style={styles.selectField} 
                    onPress={() => {
                        setShowPickerModal(true);
                        field.onSelect && field.onSelect();
                    }}
                    >
                        <Text style={[
                            styles.selectText,
                            {textAlign: ["ar","he"].includes(language) ? "right" : "left"}
                        ]}>
                            {field.value}
                        </Text>
                    </Pressable>
                    {field.error && <Text style={styles.errorText}>{field.error}</Text>}
                    </>
                )}

                {/* Picker Modal */}
                {showPickerModal && (
                    <PickerModal
                        list={field.list}
                        showPickerModal={showPickerModal}
                        setShowPickerModal={() => setShowPickerModal(false)}
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
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginVertical: 8,
        position: 'relative',
        marginBottom:25
    },
    label: {
        position: 'absolute',
        top: -10,
        paddingHorizontal: 5,
        fontSize: 12,
        color: '#666',
    },
    inputContent: {
        paddingTop: 5,
    },
    input: {
        fontSize: 16,
        paddingVertical: 2,
        color: '#333',
    },
    selectField: {
        paddingVertical: 2,
    },
    selectText: {
        fontSize: 14,
        color: '#333',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    }
});