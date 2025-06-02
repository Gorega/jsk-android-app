import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import Field from "./Field";
import { RTLWrapper, useRTLStyles } from '../../utils/RTLWrapper';

export default function Section({section, setSelectedValue, loadMoreData, loadingMore, prickerSearchValue, setPickerSearchValue, fieldErrors, setFieldErrors, isRTL}) {
    const [showFields, setShowFields] = useState(true);
    const rtl = useRTLStyles();

    return (
        <View style={[
            styles.section,
            {display: section.visibility === "hidden" ? "none" : "flex"},
            section.isHeader && styles.headerSection
        ]}>
            {section.isHeader ? (
                <View style={styles.headerContent}>
                    {section.fields}
                </View>
            ) : (
                <>
                    <Pressable onPress={() => setShowFields(!showFields)}>
                        <View style={[
                            styles.label
                        ]}>
                            <View style={[
                                styles.labelContent
                            ]}>
                                <View style={[
                                    styles.iconContainer
                                ]}>
                                    {section.icon}
                                </View>
                                <Text style={[
                                    styles.labelText
                                ]}>
                                    {section.label}
                                </Text>
                            </View>
                            <MaterialIcons 
                                style={[
                                    styles.arrowIcon, 
                                    showFields && styles.activeSection,
                                    rtl.isRTL && {transform: [{rotate: showFields ? '270deg' : '180deg'}]}
                                ]} 
                                name={rtl.isRTL ? "arrow-left" : "arrow-right"} 
                                size={24} 
                                color="#4361EE" 
                            />
                        </View>
                    </Pressable>
                    {showFields && (
                        <View style={styles.fields}>
                            {section?.fields?.flat().map((field, index) => (
                                <Field
                                    field={field}
                                    key={index}
                                    setSelectedValue={setSelectedValue}
                                    loadMoreData={loadMoreData}
                                    loadingMore={loadingMore}
                                    prickerSearchValue={prickerSearchValue}
                                    setPickerSearchValue={setPickerSearchValue}
                                    error={fieldErrors?.[field.name]}
                                    setFieldErrors={setFieldErrors}
                                    isRTL={rtl}
                                />
                            ))}
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 16,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    headerSection: {
        padding: 0,
        overflow: 'hidden',
    },
    headerContent: {
        width: '100%',
    },
    fields: {
        marginTop: 20,
        gap: 16
    },
    label: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    labelContent: {
        flexDirection: "row",
        alignItems: "center",
        gap:12
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    arrowIcon: {
        transition: '0.3s',
    },
    activeSection: {
        transform: [{rotate: '90deg'}],
    }
});