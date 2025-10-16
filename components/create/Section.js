import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import Field from "./Field";
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function Section({section, setSelectedValue, loadMoreData, loadingMore, prickerSearchValue, setPickerSearchValue, fieldErrors, setFieldErrors}) {
    // Add safety check for undefined section
    if (!section) {
        console.warn("Section component received undefined section");
        return null;
    }
    
    const [showFields, setShowFields] = useState(true);
    const rtl = useRTLStyles();
    const { colorScheme, isDark } = useTheme();
    const colors = Colors[colorScheme];

    // Ensure fields is always an array
    const safeFields = (() => {
        if (!section.fields) return [];
        if (Array.isArray(section.fields)) {
            // Handle both regular arrays and arrays that need to be flattened
            try {
                // Check if any element is an array (needs flattening)
                const needsFlattening = section.fields.some(item => Array.isArray(item));
                return needsFlattening ? section.fields.flat() : section.fields;
            } catch (error) {
                console.warn("Error flattening fields array:", error);
                return section.fields;
            }
        }
        return [];
    })();

    return (
        <View style={[
            styles.section,
            {display: section.visibility === "hidden" ? "none" : "flex"},
            section.isHeader && styles.headerSection,
            {
                backgroundColor: colors.card,
                shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : '#000',
            },
        ]}>
            {section.isHeader ? (
                <View style={styles.headerContent}>
                    {section.fields}
                </View>
            ) : (
                <>
                    <Pressable onPress={() => setShowFields(!showFields)}>
                        <View style={[
                            styles.label,
                            styles.stickyHeader,
                            !showFields && styles.bottomBorder,
                            { backgroundColor: colors.card },
                        ]}>
                            <View style={[
                                styles.labelContent
                            ]}>
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: isDark ? 'rgba(108, 142, 255, 0.15)' : 'rgba(67, 97, 238, 0.08)' }
                                ]}>
                                    {section.icon}
                                </View>
                                <Text style={[
                                    styles.labelText,
                                    { color: colors.text }
                                ]}>
                                    {section.label}
                                </Text>
                            </View>
                            <MaterialIcons 
                                style={[
                                    styles.arrowIcon, 
                                    showFields && styles.activeSection,
                                    rtl.isRTL && {transform: [{rotate: showFields ? '270deg' : '180deg'}]},
                                    { color: '#4361EE' }
                                ]} 
                                name={rtl.isRTL ? "arrow-left" : "arrow-right"} 
                                size={24} 
                                color="#4361EE" 
                            />
                        </View>
                    </Pressable>
                    {showFields && (
                        <View style={styles.fields}>
                            {safeFields.filter(field => field).map((field, index) => (
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
                                    editable={field.editable}
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
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    headerSection: {
        padding: 0,
        overflow: 'hidden',
        marginBottom: 0,
    },
    headerContent: {
        width: '100%',
    },
    stickyHeader: {
        backgroundColor: 'white',
        padding: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    bottomBorder: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    fields: {
        padding: 16,
        paddingTop: 4,
        gap: 16
    },
    label: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    labelContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    labelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        letterSpacing: 0.2,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(67, 97, 238, 0.08)',
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
