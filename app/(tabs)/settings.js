import { TouchableOpacity, Text, StyleSheet, ScrollView, View, Platform, Alert, Image, TextInput, ActivityIndicator } from "react-native";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from "expo-router";
import ModalPresentation from "../../components/ModalPresentation";
import { useState, useEffect } from "react";
import { 
  deleteToken, 
  saveToken, 
  getAccount, 
  getAllAccounts, 
  addAccount, 
  removeAccount, 
  getMasterAccountId, 
  setMasterAccountId, 
  clearMasterAccountId, 
  isDirectLogin, 
  getAccountsForMaster, 
  addAccountToMaster, 
  setDirectLogin 
} from "../../utils/secureStore";
import { useAuth } from "../../RootLayout";
import { RTLWrapper, useRTLStyles } from '../../utils/RTLWrapper';
import Field from "../../components/sign/Field";
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeModes } from '../../utils/themeContext';
import { Colors } from '@/constants/Colors';

export default function Settings() {
    const { language, setLanguage } = useLanguage();
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showAccountsModal, setShowAccountsModal] = useState(false);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const { setIsAuthenticated, user, userId, setUserId } = useAuth();
    const rtl = useRTLStyles();
    const [savedAccounts, setSavedAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [masterAccountId, setMasterAccountId] = useState(null);
    
    // Login form state for adding new account
    const [loginForm, setLoginForm] = useState({
        phone: "",
        password: ""
    });
    
    // Form errors state
    const [formErrors, setFormErrors] = useState({
        phone: "",
        password: ""
    });

    const { theme, setTheme, isDark, colorScheme } = useTheme();
    const [showThemeModal, setShowThemeModal] = useState(false);
    const colors = Colors[colorScheme];

    // Load saved accounts whenever the accounts modal is opened
    useEffect(() => {
        const loadSavedAccounts = async () => {
            if (!showAccountsModal || !userId) return;
            
            try {
                
                // Check if this is a direct login
                const directLogin = await isDirectLogin();
                
                // Get the master account ID
                const masterId = await getMasterAccountId();
                
                // If this is a direct login, the user is the master of their own accounts
                // If this is a switched account, we need to use the master's accounts
                const effectiveMasterId = directLogin ? userId : masterId;
                
                if (!effectiveMasterId) {
                    setSavedAccounts([]);
                    return;
                }
                
                // Get accounts for the effective master
                const accounts = await getAccountsForMaster(effectiveMasterId);
                
                // Filter out the current user
                const otherAccounts = accounts.filter(
                    account => account.userId.toString() !== userId.toString()
                );
                
                
                // Sort accounts: master account first, then others
                const sortedAccounts = otherAccounts.sort((a, b) => {
                    // Master account comes first
                    if (a.userId.toString() === masterId?.toString()) return -1;
                    if (b.userId.toString() === masterId?.toString()) return 1;
                    return 0;
                });
                
                // Mark the master account
                const finalAccounts = sortedAccounts.map(account => ({
                    ...account,
                    isMasterAccount: account.userId.toString() === masterId?.toString()
                }));
                
                setSavedAccounts(finalAccounts);
            } catch (error) {
                setSavedAccounts([]);
            }
        };
        
        loadSavedAccounts();
    }, [showAccountsModal, userId]);

    // Login form fields for add account modal
    const loginFields = [
        {
            name: "phone",
            label: translations[language]?.auth.mobileNumber,
            type: "input",
            value: loginForm.phone,
            error: formErrors.phone || "",
            placeholder: translations[language]?.auth.phonePlaceholder,
            keyboardType: "phone-pad",
            onChange: (value) => {
                setFormErrors(prev => ({...prev, phone: ""}));
                setLoginForm(prev => ({...prev, phone: value}));
            }
        }, 
        {
            name: "password",
            label: translations[language]?.auth.password,
            type: "input",
            value: loginForm.password,
            error: formErrors.password || "",
            placeholder: translations[language]?.auth.passwordPlaceholder,
            secureTextEntry: true,
            onChange: (value) => {
                setFormErrors(prev => ({...prev, password: ""}));
                setLoginForm(prev => ({...prev, password: value}));
            }
        }
    ];

    const settings = [
        (["admin", "manager"].includes(user?.role)) ? {
            label: translations[language].tabs.settings.options.users,
            onPress: () => router.push("(users)"),
            icon: <FontAwesome name="user-o" size={22} color="#4361EE" />
        } : null,
        (["manager", "admin", "business"].includes(user?.role)) ? {
            label: translations[language].tabs.settings.options.complaints,
            onPress: () => router.push("(complaints)"),
            icon: <MaterialIcons name="fmd-bad" size={22} color="#4361EE" />
        } : null,
        {
            label: translations[language].tabs.settings.options.language.title,
            onPress: () => setShowLanguageModal(true),
            icon: <MaterialIcons name="language" size={22} color="#4361EE" />,
            value: language.toUpperCase()
        },
        {
            label: translations[language].tabs.settings.options.theme?.title || 'Theme',
            onPress: () => setShowThemeModal(true),
            icon: <MaterialCommunityIcons 
                    name={isDark ? "moon-waning-crescent" : "white-balance-sunny"} 
                    size={22} 
                    color="#4361EE" 
                  />,
            value: theme === 'system' 
                ? (translations[language].tabs.settings.options.theme?.options?.system || 'System') 
                : (theme === 'dark' 
                    ? (translations[language].tabs.settings.options.theme?.options?.dark || 'Dark') 
                    : (translations[language].tabs.settings.options.theme?.options?.light || 'Light'))
        },
        {
            label: translations[language].tabs.settings.options.changePassword,
            onPress: () => router.push("(change_password)"),
            icon: <AntDesign name="lock" size={22} color="#4361EE" />
        },
        {
            label: translations[language].tabs.settings.options.contactUs,
            onPress: () => router.push("(contact_us)"),
            icon: <Entypo name="phone" size={22} color="#4361EE" />
        },
        {
            label: translations[language].tabs.settings.options.aboutUs,
            onPress: () => router.push("(info)"),
            icon: <MaterialCommunityIcons name="information-outline" size={22} color="#4361EE" />
        },
        // Add switch account option
        {
            label: translations[language].tabs.settings.options.switchAccount,
            onPress: () => setShowAccountsModal(true),
            icon: <MaterialIcons name="switch-account" size={22} color="#4361EE" />
        },
        {
            label: translations[language].tabs.settings.options.deleteAccount,
            onPress: ()=>handleDeleteAccount(),
            icon: <MaterialIcons name="delete-outline" size={22} color="#EF4444" />,
            danger: true
        },
        {
            label: translations[language].tabs.settings.options.logout,
            onPress: ()=>handleLogout(),
            icon: <MaterialIcons name="logout" size={22} color="#EF4444" />,
            danger: true
        }
    ].filter(Boolean); // Remove null values (future-proof if options become conditional)
    
    // Language Change Handler
    const handleLanguageChange = async (newLang) => {
        // Close modal first to avoid visual glitches during restart
        setShowLanguageModal(false);
        // Change language (this will trigger restart if RTL changes)
        await setLanguage(newLang);
    };
    
    // Logout Handler
    const handleLogout = async () => {
        try {
            await deleteToken("userToken");
            await deleteToken("userId");
            await deleteToken("lastLoginPhone");
            await deleteToken("lastLoginPassword");
            
            // Clear the direct login flag on complete logout
            await setDirectLogin(false);
            
            // Don't clear the master account ID or accounts list on logout
            // This allows accounts to persist across sessions
            
            setIsAuthenticated(false);
            router.replace("(auth)");
        } catch (error) {
        }
    };
    
    // Delete Account Flow
    const handleDeleteAccount = () => {
        Alert.alert(
            translations[language].tabs.settings.options.deleteAccount,
            translations[language].tabs.settings.options.deleteAccountHint,
            [
                { text: translations[language].common.cancel, style: "cancel" },
                {
                    text: translations[language].common.delete,
                    style: "destructive",
                    onPress: confirmDeleteAccount
                }
            ]
        );
    };
    
    // Confirm Delete Account Handler
    const confirmDeleteAccount = async () => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${user.userId}/delete/account`, {
                method: "DELETE",
                credentials: "include"
            });
    
            const data = await response.json();
    
            if (data.status === "success") {
                // Remove account from global accounts
                await removeAccount(userId);
                
                // If this is the master account, clear the master account ID
                const masterId = await getMasterAccountId();
                if (masterId === userId) {
                    await clearMasterAccountId();
                }
                
                await deleteToken("userToken");
                await deleteToken("userId");
                setIsAuthenticated(false);
                router.replace("(auth)");
            } else {
                Alert.alert("Error", "Failed to delete account. Please try again.");
            }
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred.");
        }
    };
    
    // Switch Account Handler
    const handleSwitchAccount = async (account) => {
        try {
            
            // Get the master account ID
            const masterId = await getMasterAccountId();
            
            // Check if this is a direct login
            const directLogin = await isDirectLogin();
            
            // When switching accounts, it's no longer a direct login
            await setDirectLogin(false);
            
            // Clear all authentication tokens
            await deleteToken("userToken");
            await deleteToken("userId");
            await deleteToken("lastLoginPhone");
            await deleteToken("lastLoginPassword");
            
            // Set authenticated state to false
            setIsAuthenticated(false);
            
            // Now perform a "login" with the selected account credentials
            try {
                // If we have the password saved for biometric login, use it for a proper login
                if (account.lastLoginPhone && account.lastLoginPassword) {
                    // Make API call with saved credentials
                    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
                        method: "POST",
                        body: JSON.stringify({
                            phone: account.lastLoginPhone,
                            password: account.lastLoginPassword
                        }),
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Accept-Language': language
                        },
                        credentials: "include"
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || "Login failed");
                    }
                    
                    // Save the new token and user ID
                    if (data.userId) {
                        await saveToken("userId", data.userId.toString());
                        setUserId(data.userId);
                    }
                    
                    if (data.token) {
                        await saveToken("userToken", data.token);
                        
                        // Also save biometric credentials
                        await saveToken("lastLoginPhone", account.lastLoginPhone);
                        await saveToken("lastLoginPassword", account.lastLoginPassword);
                        
                        // Update the account in the registry with the new token
                        const effectiveMasterId = directLogin ? userId : masterId;
                        if (effectiveMasterId) {
                            await addAccountToMaster(effectiveMasterId, {
                                ...account,
                                token: data.token
                            });
                        }
                        
                        // Set authenticated state
                        setIsAuthenticated(true);
                        
                        // Close modal
                        setShowAccountsModal(false);
                        
                        // Show success message
                        Alert.alert(
                            translations[language].tabs.settings.options.accountSwitched,
                            translations[language].tabs.settings.options.accountSwitchedMessage
                        );
                        
                        // Refresh app by redirecting to tabs
                        router.replace("/(tabs)");
                    } else {
                        throw new Error('No token received');
                    }
                } else {
                    // Fallback to using stored token
                    await saveToken("userToken", account.token);
                    await saveToken("userId", account.userId.toString());
                    
                    // Set authenticated state
                    setIsAuthenticated(true);
                    
                    // Close modal
                    setShowAccountsModal(false);
                    
                    // Show success message
                    Alert.alert(
                        translations[language].tabs.settings.options.accountSwitched,
                        translations[language].tabs.settings.options.accountSwitchedMessage
                    );
                    
                    // Refresh app by redirecting to tabs
                    router.replace("/(tabs)");
                }
            } catch (loginError) {
                Alert.alert(
                    translations[language].auth.loginFailed,
                    translations[language].tabs.settings.options.accountSwitchFailed || "Failed to switch account. Please log in again."
                );
                router.replace("(auth)");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to switch account. Please try again.");
        }
    };
    
    // Add New Account Handler
    const handleAddNewAccount = () => {
        setShowAccountsModal(false);
        setShowAddAccountModal(true);
        
        // Reset login form
        setLoginForm({
            phone: "",
            password: ""
        });
        setFormErrors({
            phone: "",
            password: ""
        });
    };
    
    // Login Handler for adding new account
    const handleAddAccountLogin = async () => {
        try {
            setFormErrors({});
            setLoading(true);
            
            // Basic validation
            let hasError = false;
            if (!loginForm.phone) {
                setFormErrors(prev => ({...prev, phone: translations[language]?.auth.phoneRequired}));
                hasError = true;
            }
            if (!loginForm.password) {
                setFormErrors(prev => ({...prev, password: translations[language]?.auth.passwordRequired}));
                hasError = true;
            }
            
            if (hasError) {
                setLoading(false);
                return;
            }
            
            // Make API call to login
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
                method: "POST",
                body: JSON.stringify({
                    phone: loginForm.phone,
                    password: loginForm.password
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language
                },
                credentials: "include"
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (data.type === 'VALIDATION_ERROR') {
                    const errors = {};
                    data.details.forEach(error => {
                        errors[error.field] = error.message;
                    });
                    setFormErrors(errors);
                }
                throw new Error(data.message || "Login failed");
            }
            
            // Check if this account is the same as current account
            if (data.userId.toString() === userId.toString()) {
                Alert.alert(
                    "Account Already Active",
                    "This account is already your active account."
                );
                setLoading(false);
                return;
            }
            
            // Check if account already exists in saved accounts
            const existingAccount = await getAccount(data.userId.toString());
            
            if (existingAccount) {
                Alert.alert(
                    translations[language].tabs.settings.options.accountAlreadyExists,
                    translations[language].tabs.settings.options.accountAlreadyExists
                );
                setLoading(false);
                return;
            }
            
            // Create a new account object
            const newAccount = {
                userId: data.userId.toString(),
                name: data.name || data.username || loginForm.phone,
                phone: loginForm.phone,
                role: data.role,
                token: data.token,
                lastLoginPhone: loginForm.phone,
                lastLoginPassword: loginForm.password
            };
            
            // Add to global accounts registry
            await addAccount(newAccount);
            
            // Close modal
            setShowAddAccountModal(false);
            
            // Refresh the accounts list
            setShowAccountsModal(false);
            setTimeout(() => setShowAccountsModal(true), 100);
            
            // Show success message
            Alert.alert(
                translations[language].tabs.settings.options.accountAdded,
                translations[language].tabs.settings.options.accountAddedMessage
            );
            
        } catch (err) {
            Alert.alert(
                translations[language].auth.loginFailed,
                err.message
            );
        } finally {
            setLoading(false);
        }
    };
    
    // Remove Account Handler
    const handleRemoveAccount = async (accountToRemove) => {
        try {
            // Confirm before removing
            Alert.alert(
                translations[language].tabs.settings.options.removeAccount,
                translations[language].tabs.settings.options.removeAccountMessage,
                [
                    { text: translations[language].common.cancel, style: "cancel" },
                    {
                        text: translations[language].common.delete,
                        style: "destructive",
                        onPress: async () => {
                            try {
                                // Remove the account from global registry
                                await removeAccount(accountToRemove.userId);
                                
                                // If this is the master account and we're removing it,
                                // we should probably set a new master account
                                if (accountToRemove.userId.toString() === masterAccountId?.toString()) {
                                    // Set the current user as the new master
                                    await setMasterAccountId(userId);
                                }
                                
                                // Refresh the accounts list
                                setShowAccountsModal(false);
                                setTimeout(() => setShowAccountsModal(true), 100);
                            } catch (error) {
                                Alert.alert("Error", "Failed to remove account. Please try again.");
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred.");
        }
    };

    const handleThemeChange = async (newTheme) => {
        await setTheme(newTheme);
        setShowThemeModal(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* User Info Card */}
            <View style={[styles.userCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </Text>
                </View>
                <View>
                    <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
                    <Text style={[styles.userRole, { color: colors.textSecondary }]}>
                        {translations[language].roles[user?.role]}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Settings Categories */}
                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {translations[language].tabs.settings?.preferences}
                    </Text>
                </View>

                {settings.slice(0, 3).map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.item,
                            { backgroundColor: colors.card, borderBottomColor: colors.border }
                        ]}
                        onPress={item?.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconContainer,
                            { backgroundColor: isDark ? colors.cardDark : '#EEF2FF' }
                        ]}>
                            {item?.icon}
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={[
                                styles.itemLabel,
                                { color: colors.text }
                            ]}>
                                {item?.label}
                            </Text>
                        </View>
                        {item.value && (
                            <View style={[
                                styles.valueContainer,
                                { backgroundColor: isDark ? colors.cardDark : '#E2E8F0' }
                            ]}>
                                <Text style={[styles.valueText, { color: colors.textSecondary }]}>{item.value}</Text>
                            </View>
                        )}
                        <MaterialIcons 
                            name={rtl.isRTL ? "chevron-left" : "chevron-right"} 
                            size={24} 
                            color={colors.textSecondary} 
                        />
                    </TouchableOpacity>
                ))}

                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {translations[language].tabs.settings.support}
                    </Text>
                </View>

                {settings.slice(3, 6).map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.item,
                            { backgroundColor: colors.card, borderBottomColor: colors.border }
                        ]}
                        onPress={item?.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconContainer,
                            { backgroundColor: isDark ? colors.cardDark : '#EEF2FF' }
                        ]}>
                            {item?.icon}
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={[
                                styles.itemLabel,
                                { color: colors.text }
                            ]}>
                                {item?.label}
                            </Text>
                        </View>
                        <MaterialIcons 
                            name={rtl.isRTL ? "chevron-left" : "chevron-right"} 
                            size={24} 
                            color={colors.textSecondary} 
                        />
                    </TouchableOpacity>
                ))}

                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        {translations[language].tabs.settings.account}
                    </Text>
                </View>
                
                {/* Switch Account Option */}
                <TouchableOpacity
                    style={[
                        styles.item,
                        { backgroundColor: colors.card, borderBottomColor: colors.border }
                    ]}
                    onPress={settings[settings.length - 3]?.onPress}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.iconContainer,
                        { backgroundColor: isDark ? colors.cardDark : '#EEF2FF' }
                    ]}>
                        {settings[settings.length - 3]?.icon}
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={[
                            styles.itemLabel,
                            { color: colors.text }
                        ]}>
                            {settings[settings.length - 3]?.label}
                        </Text>
                    </View>
                    <MaterialIcons 
                        name={rtl.isRTL ? "chevron-left" : "chevron-right"} 
                        size={24} 
                        color={colors.textSecondary} 
                    />
                </TouchableOpacity>
                
                {/* Delete Account Option */}
                <TouchableOpacity
                    style={[
                        styles.item,
                        { backgroundColor: colors.card, borderBottomColor: colors.border }
                    ]}
                    onPress={settings[settings.length - 2]?.onPress}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.iconContainer,
                        styles.dangerIconContainer
                    ]}>
                        {settings[settings.length - 2]?.icon}
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={[
                            styles.itemLabel,
                            styles.dangerLabel
                        ]}>
                            {settings[settings.length - 2]?.label}
                        </Text>
                    </View>
                </TouchableOpacity>
                
                {/* Logout Option */}
                <TouchableOpacity
                    style={[
                        styles.item,
                        styles.dangerItem,
                        { backgroundColor: colors.card, borderBottomColor: colors.border }
                    ]}
                    onPress={settings[settings.length - 1]?.onPress}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.iconContainer,
                        styles.dangerIconContainer
                    ]}>
                        {settings[settings.length - 1]?.icon}
                    </View>
                    <View style={styles.itemTextContainer}>
                        <Text style={[
                            styles.itemLabel,
                            styles.dangerLabel
                        ]}>
                            {settings[settings.length - 1]?.label}
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {/* Language Modal */}
            {showLanguageModal && (
                <ModalPresentation 
                    showModal={showLanguageModal} 
                    setShowModal={setShowLanguageModal}
                    onDismiss={() => setShowLanguageModal(false)}
                >
                    <View style={[styles.modalHeader, { 
                        borderBottomColor: colors.border,
                        backgroundColor: colors.card 
                    }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {translations[language].tabs.settings.options.language.title}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            { 
                                backgroundColor: colors.card,
                                borderBottomColor: colors.border
                            },
                            language === 'ar' && [
                                styles.activeLanguage,
                                { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
                            ]
                        ]}
                        onPress={() => handleLanguageChange('ar')}
                    >
                        <Text style={[
                            styles.languageText, 
                            { color: colors.text },
                            language === 'ar' && [
                                styles.activeLanguageText,
                                { color: colors.primary }
                            ]
                        ]}>
                            {translations[language].tabs.settings.options.language.options.ar}
                        </Text>
                        {language === 'ar' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            { 
                                backgroundColor: colors.card,
                                borderBottomColor: colors.border
                            },
                            language === 'en' && [
                                styles.activeLanguage,
                                { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
                            ]
                        ]}
                        onPress={() => handleLanguageChange('en')}
                    >
                        <Text style={[
                            styles.languageText,
                            { color: colors.text },
                            language === 'en' && [
                                styles.activeLanguageText,
                                { color: colors.primary }
                            ]
                        ]}>
                            {translations[language].tabs.settings.options.language.options.en}
                        </Text>
                        {language === 'en' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            { 
                                backgroundColor: colors.card,
                                borderBottomWidth: 0 
                            },
                            language === 'he' && [
                                styles.activeLanguage,
                                { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
                            ]
                        ]}
                        onPress={() => handleLanguageChange('he')}
                    >
                        <Text style={[
                            styles.languageText,
                            { color: colors.text },
                            language === 'he' && [
                                styles.activeLanguageText,
                                { color: colors.primary }
                            ]
                        ]}>
                            {translations[language].tabs.settings.options.language.options.he}
                        </Text>
                        {language === 'he' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                </ModalPresentation>
            )}
            
            {/* Accounts Modal */}
            {showAccountsModal && (
                <ModalPresentation 
                    showModal={showAccountsModal} 
                    setShowModal={setShowAccountsModal}
                    onDismiss={() => setShowAccountsModal(false)}
                >
                    <View style={[styles.modalHeader, { 
                        backgroundColor: colors.card,
                        borderBottomColor: colors.border 
                    }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {translations[language].tabs.settings.options.switchAccount}
                        </Text>
                    </View>
                    
                    {/* Current Account */}
                    <View style={[styles.accountsSection, { backgroundColor: colors.background }]}>
                        <Text style={[styles.accountsSectionTitle, { color: colors.textSecondary }]}>
                            {translations[language].tabs.settings.options.currentAccount}
                        </Text>
                        
                        <View style={[
                            styles.accountItem, 
                            styles.currentAccountItem,
                            { 
                                backgroundColor: isDark ? colors.cardActive : '#F0F9FF',
                                borderBottomColor: colors.border 
                            }
                        ]}>
                            <View style={styles.accountAvatarContainer}>
                                <Text style={styles.accountAvatarText}>
                                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </Text>
                            </View>
                            <View style={styles.accountInfo}>
                                <Text style={[styles.accountName, { color: colors.text }]}>{user?.name}</Text>
                                <Text style={[styles.accountRole, { color: colors.textSecondary }]}>
                                    {translations[language].roles[user?.role]}
                                </Text>
                            </View>
                            <View style={styles.activeTag}>
                                <Text style={styles.activeTagText}>
                                    {translations[language].tabs.settings.options.active}
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Other Accounts */}
                    {savedAccounts.length > 0 && (
                        <View style={[styles.accountsSection, { backgroundColor: colors.background }]}>
                            <Text style={[styles.accountsSectionTitle, { color: colors.textSecondary }]}>
                                {translations[language].tabs.settings.options.otherAccounts}
                            </Text>
                            
                            {savedAccounts.map((account, index) => (
                                <View key={index} style={[
                                    styles.accountItem,
                                    { 
                                        backgroundColor: colors.card,
                                        borderBottomColor: colors.border 
                                    }
                                ]}>
                                    <TouchableOpacity 
                                        style={styles.accountContent}
                                        onPress={() => handleSwitchAccount(account)}
                                    >
                                        <View style={styles.accountAvatarContainer}>
                                            <Text style={styles.accountAvatarText}>
                                                {account.name ? account.name.charAt(0).toUpperCase() : "U"}
                                            </Text>
                                        </View>
                                        <View style={styles.accountInfo}>
                                            <Text style={[styles.accountName, { color: colors.text }]}>
                                                {account.phone}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[
                                            styles.removeAccountButton,
                                            { backgroundColor: isDark ? colors.cardDark : '#F1F5F9' }
                                        ]}
                                        onPress={() => handleRemoveAccount(account)}
                                    >
                                        <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                    
                    {/* Add New Account Button */}
                    <TouchableOpacity 
                        style={[styles.addAccountButton, { backgroundColor: colors.primary }]}
                        onPress={handleAddNewAccount}
                    >
                        <AntDesign name="plus" size={20} color="#FFFFFF" />
                        <Text style={styles.addAccountButtonText}>
                            {translations[language].tabs.settings.options.addNewAccount}
                        </Text>
                    </TouchableOpacity>
                </ModalPresentation>
            )}
            
            {/* Add Account Modal */}
            {showAddAccountModal && (
                <ModalPresentation 
                    showModal={showAddAccountModal} 
                    setShowModal={setShowAddAccountModal}
                    onDismiss={() => setShowAddAccountModal(false)}
                >
                    <View style={[
                        styles.modalHeader, 
                        { 
                            backgroundColor: colors.card,
                            borderBottomColor: colors.border 
                        }
                    ]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {translations[language].tabs.settings.options.addAccount}
                        </Text>
                    </View>
                    
                    <View style={[styles.loginFormContainer, { backgroundColor: colors.background }]}>
                        {/* Error display */}
                        {(formErrors.general) && (
                            <View style={styles.errorAlert}>
                                <Feather name="alert-circle" size={20} color="#EF4444" />
                                <Text style={styles.errorText}>{formErrors.general}</Text>
                            </View>
                        )}
                        
                        {/* Login fields */}
                        <View style={styles.formFields}>
                            {loginFields.map((field, index) => (
                                <View key={index} style={styles.fieldContainer}>
                                    <Field 
                                        field={field} 
                                        multiline={false} 
                                        onFocus={() => {}}
                                    />
                                </View>
                            ))}
                        </View>
                        
                        {/* Login button */}
                        <TouchableOpacity
                            style={[
                                styles.loginButton, 
                                { backgroundColor: colors.primary },
                                loading && [
                                    styles.loginButtonDisabled,
                                    { backgroundColor: isDark ? '#6B7280' : '#A5B4FC' }
                                ]
                            ]}
                            onPress={handleAddAccountLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.loginButtonText}>
                                    {translations[language].tabs.settings.options.addAccount}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ModalPresentation>
            )}

            {/* Theme Modal */}
            {showThemeModal && (
                <ModalPresentation 
                    showModal={showThemeModal} 
                    setShowModal={setShowThemeModal}
                    onDismiss={() => setShowThemeModal(false)}
                >
                    <View style={[
                        styles.modalHeader, 
                        { 
                            backgroundColor: colors.card,
                            borderBottomColor: colors.border 
                        }
                    ]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {translations[language].tabs.settings.options.theme?.title || 'Choose Theme'}
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            { 
                                backgroundColor: colors.card,
                                borderBottomColor: colors.border 
                            },
                            theme === 'light' && [
                                styles.activeLanguage,
                                { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
                            ]
                        ]}
                        onPress={() => handleThemeChange('light')}
                    >
                        <View style={styles.themeOptionContent}>
                            <MaterialCommunityIcons 
                                name="white-balance-sunny" 
                                size={22} 
                                color={theme === 'light' ? colors.primary : colors.textSecondary} 
                            />
                            <Text style={[
                                styles.languageText, 
                                { color: colors.text },
                                theme === 'light' && [
                                    styles.activeLanguageText,
                                    { color: colors.primary }
                                ]
                            ]}>
                                {translations[language].tabs.settings.options.theme?.options?.light || 'Light'}
                            </Text>
                        </View>
                        {theme === 'light' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            { 
                                backgroundColor: colors.card,
                                borderBottomColor: colors.border 
                            },
                            theme === 'dark' && [
                                styles.activeLanguage,
                                { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
                            ]
                        ]}
                        onPress={() => handleThemeChange('dark')}
                    >
                        <View style={styles.themeOptionContent}>
                            <MaterialCommunityIcons 
                                name="moon-waning-crescent" 
                                size={22} 
                                color={theme === 'dark' ? colors.primary : colors.textSecondary} 
                            />
                            <Text style={[
                                styles.languageText,
                                { color: colors.text },
                                theme === 'dark' && [
                                    styles.activeLanguageText,
                                    { color: colors.primary }
                                ]
                            ]}>
                                {translations[language].tabs.settings.options.theme?.options?.dark || 'Dark'}
                            </Text>
                        </View>
                        {theme === 'dark' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[
                            styles.languageOption,
                            { 
                                backgroundColor: colors.card,
                                borderBottomWidth: 0 
                            },
                            theme === 'system' && [
                                styles.activeLanguage,
                                { backgroundColor: isDark ? colors.cardActive : '#F0F9FF' }
                            ]
                        ]}
                        onPress={() => handleThemeChange('system')}
                    >
                        <View style={styles.themeOptionContent}>
                            <MaterialCommunityIcons 
                                name="theme-light-dark" 
                                size={22} 
                                color={theme === 'system' ? colors.primary : colors.textSecondary} 
                            />
                            <Text style={[
                                styles.languageText,
                                { color: colors.text },
                                theme === 'system' && [
                                    styles.activeLanguageText,
                                    { color: colors.primary }
                                ]
                            ]}>
                                {translations[language].tabs.settings.options.theme?.options?.system || 'System'}
                            </Text>
                        </View>
                        {theme === 'system' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                </ModalPresentation>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 12
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#64748B',
        textTransform: 'capitalize',
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 12
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerIconContainer: {
        backgroundColor: '#FEE2E2',
    },
    itemTextContainer: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
        ...Platform.select({
            ios: {
                textAlign:"left"
            }
        })
    },
    dangerLabel: {
        color: '#EF4444',
    },
    dangerItem: {
        borderBottomWidth: 0,
    },
    valueContainer: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4
    },
    valueText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    activeLanguage: {
        backgroundColor: '#F0F9FF',
    },
    languageText: {
        fontSize: 16,
        color: '#334155',
    },
    activeLanguageText: {
        color: '#4361EE',
        fontWeight: '600',
    },
    // Account switching styles
    accountsSection: {
        marginBottom: 16,
    },
    accountsSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap:12
    },
    currentAccountItem: {
        backgroundColor: '#F0F9FF',
    },
    accountContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap:12,
        
    },
    accountAvatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4361EE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    accountAvatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
    },
    accountPhone: {
        fontSize: 14,
        color: '#64748B',
    },
    accountRole: {
        fontSize: 12,
        color: '#94A3B8',
        textTransform: 'capitalize',
    },
    activeTag: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#22C55E',
    },
    removeAccountButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    addAccountButton: {
        flexDirection: 'row',
        backgroundColor: '#4361EE',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#4361EE',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    addAccountButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Login form styles
    loginFormContainer: {
        padding: 20,
    },
    formFields: {
        marginBottom: 20,
    },
    fieldContainer: {
        marginBottom: 10,
    },
    errorAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(254, 226, 226, 0.5)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorText: {
        marginLeft: 10,
        color: '#B91C1C',
        fontSize: 14,
        flex: 1,
    },
    loginButton: {
        backgroundColor: '#4361EE',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#4361EE',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    loginButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    masterAccountTag: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    masterAccountTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#22C55E',
    },
    themeOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
});