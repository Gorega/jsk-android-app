import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import ModalPresentation from "../../components/ModalPresentation";
import { router } from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import { useAuth } from "../../RootLayout";
import { translations } from '../../utils/languageContext';
import { useLanguage } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import React, { useCallback, useMemo } from 'react';

// Memoized CollectionOption component to prevent unnecessary re-renders
const CollectionOption = React.memo(({ collection, onPress, isRTL }) => {
    return (
        <TouchableOpacity
            style={[
                styles.itemContainer,
                { borderBottomColor: collection.colors.border },
                collection.isLastItem && styles.lastItem
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Icon */}
            <View style={[
                styles.iconContainer,
                { backgroundColor: collection.iconBackground }
            ]}>
                {collection.icon}
            </View>
            
            {/* Text */}
            <View style={styles.textContainer}>
                <Text style={[
                    styles.itemLabel,
                    { color: collection.colors.text }
                ]}>
                    {collection.label}
                </Text>
                {collection.description && (
                    <Text style={[
                        styles.itemDescription,
                        { color: collection.colors.textSecondary }
                    ]}>
                        {collection.description}
                    </Text>
                )}
            </View>
            
            {/* Arrow */}
            <View>
                <Feather
                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                    size={20}
                    color={collection.colors.iconDefault}
                />
            </View>
        </TouchableOpacity>
    );
});

function Collections({ showModal, setShowModal }) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const isRTL = language === 'ar' || language === 'he';

    // Helper for RTL-aware styling
    const getDirectionalStyle = useCallback((ltrStyle, rtlStyle) => {
        return isRTL ? rtlStyle : ltrStyle;
    }, [isRTL]);

    // Memoize the collections array to prevent recreating it on each render
    const collections = useMemo(() => {
        const collectionItems = [
            ["business","entery","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(user.role) ? { visibility: "hidden" } : {
                label: ["driver","delivery_company"].includes(user.role) ? translations[language].tabs.collections.options.driver_own_collections : translations[language].tabs.collections.options.driver_money_collections,
                link: "(collection)?type=driver_money",
                icon: <FontAwesome name="money" size={22} color={colors.primary} />,
                iconBackground: isDark ? 'rgba(108, 142, 255, 0.15)' : "#EEF2FF",
                iconColor: colors.primary
            },
            ["entery","support_agent","sales_representative","warehouse_admin","warehouse_staff"].includes(user.role) ? { visibility: "hidden" } : {
                label: ["business"].includes(user.role) ? 
                    translations[language].tabs.collections.options.my_money_collections : 
                    translations[language].tabs.collections.options.business_money_collections,
                link: "(collection)?type=business_money",
                icon: <FontAwesome name="money" size={22} color={colors.primary} />,
                iconBackground: isDark ? 'rgba(108, 142, 255, 0.15)' : "#EEF2FF",
                iconColor: colors.primary
            },
            ["business","accountant","entery","support_agent","sales_representative"].includes(user.role) ? { visibility: "hidden" } : {
                label:  ["driver","delivery_company"].includes(user.role) ? translations[language].tabs.collections.options.my_returned_collections : translations[language].tabs.collections.options.driver_returned_collections,
                link: "(collection)?type=driver_returned",
                icon: <Octicons name="package-dependencies" size={22} color={colors.primary} />,
                iconBackground: isDark ? 'rgba(108, 142, 255, 0.15)' : "#EEF2FF",
                iconColor: colors.primary
            },
            ["driver","delivery_company","accountant","entery","support_agent","sales_representative"].includes(user.role) ? { visibility: "hidden" } : {
                label: ["business"].includes(user.role) ? 
                    translations[language].tabs.collections.options.my_returned_collections : 
                    translations[language].tabs.collections.options.business_returned_collections,
                link: "(collection)?type=business_returned",
                icon: <Octicons name="package-dependencies" size={22} color={colors.primary} />,
                iconBackground: isDark ? 'rgba(108, 142, 255, 0.15)' : "#EEF2FF",
                iconColor: colors.primary
            },
            user.role !== "business" ? {
                label: translations[language].tabs.collections.options.runsheet_collections,
                link: "(collection)?type=dispatched",
                icon: <Feather name="truck" size={22} color={colors.primary} />,
                iconBackground: isDark ? 'rgba(108, 142, 255, 0.15)' : "#EEF2FF", 
                iconColor: colors.primary
            } : { visibility: "hidden" }
        ].filter(item => item.visibility !== "hidden");

        // Add colors and isLastItem flag to each collection
        return collectionItems.map((collection, index) => ({
            ...collection,
            colors: colors,
            isLastItem: index === collectionItems.length - 1
        }));
    }, [user.role, language, isDark, colors]);

    // Memoize the handleItemPress function
    const handleItemPress = useCallback((link) => {
        router.push(link);
        setShowModal(false);
    }, [setShowModal]);

    // Memoize the handleCloseModal function
    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    return (
        <ModalPresentation
            showModal={showModal}
            setShowModal={setShowModal}
        >
            <View style={[styles.container, { backgroundColor: colors.card }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {translations[language].tabs.collections.title || "Collections"}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.closeHeaderButton,
                            getDirectionalStyle(
                                { right: 16 },
                                { left: 16 }
                            )
                        ]}
                        onPress={handleCloseModal}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="x" size={20} color={colors.iconDefault} />
                    </TouchableOpacity>
                </View>

                {/* Collection Options */}
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    {collections.map((collection, index) => (
                        <CollectionOption
                            key={index}
                            collection={collection}
                            onPress={() => handleItemPress(collection.link)}
                            isRTL={isRTL}
                        />
                    ))}
                </ScrollView>

                {/* Bottom Button */}
                <View style={[styles.bottomContainer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleCloseModal}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {translations[language].tabs.collections.close || "Close"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ModalPresentation>
    );
}

export default React.memo(Collections);

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        position: 'relative',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    closeHeaderButton: {
        position: 'absolute',
        top: 16,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitleContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    scrollView: {
        maxHeight: '100%',
    },
    scrollContent: {
        paddingBottom: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        gap: 15,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'left'
    },
    itemDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    bottomContainer: {
        padding: 16,
        borderTopWidth: 1,
    },
    button: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});