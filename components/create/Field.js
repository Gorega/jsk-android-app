import { TextInput, View, Pressable, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import PickerModal from "../pickerModal/PickerModal";
import { useState } from "react";
import { useLanguage } from '../../utils/languageContext';
import ModalPresentation from "../ModalPresentation";
import { Calendar } from "react-native-calendars";

export default function Field({field,error, setSelectedValue, loadMoreData, loadingMore, prickerSearchValue, setPickerSearchValue,setFieldErrors}) {
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const { language } = useLanguage();

    const handleDateSelect = (day) => {
        setSelectedDate(day.dateString);
        if(field.onChange) field.onChange(day.dateString);
        setShowCalendar(false);
    };

    return (
        <View style={[
            field.visibility === "hidden" ? styles.hiddenField : styles.fieldContainer,
            field.containerStyle,
            { borderColor: error ? "red" : "rgba(0,0,0,0.2)" }
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

            {/* Input Field */}
            <View style={styles.inputContent}>
                {field.type === "input" && (
                    <>
                        <TextInput 
                        multiline
                        style={[styles.input,{textAlign:["ar","he"].includes(language) ? "right" : "left"}]}
                        placeholder=""
                        value={field.value}
                        onBlur={field.onBlur}
                        defaultValue={field.defaultValue}
                        onChangeText={(text) => {
                            if (field.onChange) {
                                field.onChange(text);
                            }
                            // Clear error when user starts typing
                            if (error && field.name) {
                                setFieldErrors(prev => ({
                                    ...prev,
                                    [field.name]: null
                                }));
                            }
                        }}
                        placeholderTextColor="#999"
                    />
                    {error && <Text style={styles.errorText}>{error}</Text>}
                    </>
                )}

                {field.type === "select" && (
                    <Pressable 
                        style={styles.selectField} 
                        onPress={() => setShowPickerModal(true)}
                    >
                        <Text style={[styles.selectText,{textAlign:["ar","he"].includes(language) ? "right" : "left"}]}>{field.value || field.placeholder}</Text>
                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </Pressable>
                )}

                {field.type === "button" && (
                    <Pressable 
                        style={[
                            styles.button,
                            field.value === "x" && styles.deleteButton,
                        ]} 
                        onPress={field.onPress}
                    >
                        <Text style={styles.buttonText}>
                            {field.value === "+" ? "+ Add Check" : field.value}
                        </Text>
                    </Pressable>
                )}

                {field.type === "message" && (
                    <Text style={[styles.messageText, field.style]}>
                        {field.value}
                    </Text>
                )}

                {/* Picker Modal */}
                {showPickerModal && (
                    <PickerModal
                    list={field.list}
                    showPickerModal={showPickerModal}
                    setShowPickerModal={() => setShowPickerModal(false)}
                    setSelectedValue={setSelectedValue}
                    field={field}
                    loadMoreData={loadMoreData}
                    loadingMore={loadingMore}
                    prickerSearchValue={prickerSearchValue}
                    setPickerSearchValue={setPickerSearchValue}
                />
                )}

                {field.type === "date" && (
                <>
                    <Pressable 
                        style={styles.input}
                        onPress={() => setShowCalendar(true)}
                    >
                        <Text style={styles.buttonText}>
                            {selectedDate || field.value || "Select Date"}
                        </Text>
                    </Pressable>

                    <ModalPresentation
                        showModal={showCalendar}
                        setShowModal={setShowCalendar}
                    >
                        <View style={styles.calendarContainer}>
                            <Calendar
                                onDayPress={handleDateSelect}
                                markedDates={{
                                    [selectedDate]: { 
                                        selected: true, 
                                        selectedColor: '#F8C332' 
                                    },
                                }}
                                theme={{
                                    todayTextColor: "#F8C332",
                                    arrowColor: "#F8C332",
                                    textDayFontWeight: '300',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '300',
                                }}
                            />
                            <View style={styles.calendarButtons}>
                                <TouchableOpacity 
                                    style={styles.calendarButton}
                                    onPress={() => setShowCalendar(false)}
                                >
                                    <Text style={{ color: "#F8C332" }}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ModalPresentation>
                </>
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
        paddingVertical: 8,
        marginVertical: 8,
        position: 'relative',
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
    button: {
        backgroundColor: '#F8C332',
        borderRadius: 6,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
    calendarContainer: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
    },
    calendarButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
        gap: 15,
    },
    calendarButton: {
        paddingVertical: 2,
        paddingHorizontal: 15,
    },
    dateDisplay: {
        fontSize: 16,
        color: '#333',
    },
    hiddenField:{
        display:"none"
    },
    messageText: {
        color: 'red',
        fontSize: 14,
        marginTop: 5,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
    fieldContainer: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 8,
        position: 'relative',
    },
});