import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage, translations } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import PickerModal from "../pickerModal/PickerModal";
import axios from 'axios';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "../../RootLayout";

export default function CreateMoneyRecordModal({ visible, onClose, onSubmit, type, isLoading, selectedOrderIds = [] }) {
    const { language } = useLanguage();
    const { isDark, colorScheme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[colorScheme];
    const isRTL = language === 'ar' || language === 'he';
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState('general'); // general, withdrawals, received
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const defaultBranchAppliedRef = useRef(false);

    // Withdrawals State
    const [withdrawals, setWithdrawals] = useState([]);

    const [additions, setAdditions] = useState([]);

    // Received Amounts State
    const [receivedAmounts, setReceivedAmounts] = useState([]);

    // Financial Preview State
    const [financialPreview, setFinancialPreview] = useState(null);
    const [financialPreviewLoading, setFinancialPreviewLoading] = useState(false);
    const [financialPreviewError, setFinancialPreviewError] = useState(null);

    // Modals state
    const [showBranchPicker, setShowBranchPicker] = useState(false);

    // Totals State (Robust approach)
    const [totalCodValue, setTotalCodValue] = useState(0);
    const [totalNetValue, setTotalNetValue] = useState(0);
    const [totalDueDriverAmount, setTotalDueDriverAmount] = useState(0);

    // Constants
    const currencies = [
        { label: 'ILS', value: 'ILS' },
        { label: 'USD', value: 'USD' },
        { label: 'JOD', value: 'JOD' }
    ];

    const expenseTypes = [
        { label: translations[language]?.withdrawalsOptions?.driver_salaries || "Driver Salaries", value: 'driver_salaries' },
        { label: translations[language]?.withdrawalsOptions?.fuel || "Fuel", value: 'fuel' },
        { label: translations[language]?.withdrawalsOptions?.utilities_purchase || "Utilities Purchase", value: 'utilities' },
        { label: translations[language]?.withdrawalsOptions?.advance || "Advance", value: 'advance' },
        { label: translations[language]?.withdrawalsOptions?.maintenance || "Maintenance", value: 'maintenance' },
        { label: translations[language]?.withdrawalsOptions?.bills || "Bills", value: 'bills' },
        { label: translations[language]?.withdrawalsOptions?.oversize || "Oversize", value: 'oversize' },
        { label: translations[language]?.withdrawalsOptions?.collection_payment || "Collection Payment", value: 'collection_payment' },
        { label: translations[language]?.withdrawalsOptions?.other || "Other", value: 'other' }
    ];

    const isAdminOrAccountant = [1, 5].includes(user?.role_id);

    // Currency exchange rates
    const CURRENCY_EXCHANGE_RATES = {
        ILS_TO_USD: 0.27,
        ILS_TO_JOD: 0.19,
        USD_TO_ILS: 3.70,
        USD_TO_JOD: 0.71,
        JOD_TO_ILS: 5.26,
        JOD_TO_USD: 1.41,
        // Self rates
        ILS_TO_ILS: 1,
        USD_TO_USD: 1,
        JOD_TO_JOD: 1
    };

    const getExchangeRate = (from, to) => {
        if (!from || !to) return 1;
        if (from === to) return 1;
        const key = `${from}_TO_${to}`;
        return CURRENCY_EXCHANGE_RATES[key] || 1;
    };

    useEffect(() => {
        if (visible) {
            fetchBranches();
            // Reset state
            setWithdrawals([]);
            setAdditions([]);
            setReceivedAmounts([]);
            setCurrentBranch(null);
            setFinancialPreview(null);
            setTotalCodValue(0);
            setTotalNetValue(0);
            setTotalDueDriverAmount(0);
            setActiveTab('general');
            defaultBranchAppliedRef.current = false;
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) return;
        const userBranchId = user?.branch_id || user?.current_branch_id;
        if (!userBranchId || defaultBranchAppliedRef.current || currentBranch || branches.length === 0) return;
        const matchedBranch = branches.find(
            branch =>
                branch?.branch_id === userBranchId ||
                branch?.id === userBranchId ||
                branch?.value === userBranchId
        );
        if (matchedBranch) {
            setCurrentBranch(matchedBranch);
            defaultBranchAppliedRef.current = true;
        }
    }, [visible, branches, user, currentBranch]);

    // Debounced Financial Preview Fetch
    useEffect(() => {
        if (visible && type === 'business_money') {
            const timer = setTimeout(() => {
                fetchFinancialPreview();
            }, 1000); // 1 second debounce
            return () => clearTimeout(timer);
        }
    }, [withdrawals, additions, receivedAmounts, visible, type, selectedOrderIds]);

    const fetchFinancialPreview = async () => {
        if (!selectedOrderIds || selectedOrderIds.length === 0) return;

        try {
            setFinancialPreviewLoading(true);
            setFinancialPreviewError(null);

            const formattedExpenses = withdrawals.map(w => ({
                label: w.label,
                amount: parseFloat(w.amount) || 0,
                currency: w.currency || "ILS",
                description: w.description || ''
            }));

            const formattedAdditions = isAdminOrAccountant
                ? additions.map(a => ({
                    label: a.label || "other",
                    amount: parseFloat(a.amount) || 0,
                    currency: a.currency || "ILS",
                    affected_user_id: a.affected_user_id || null,
                    description: a.description || ''
                }))
                : [];

            const formattedReceivedAmounts = receivedAmounts.map(r => ({
                amount: parseFloat(r.amount) || 0,
                currency: r.currency,
                original_currency: r.original_currency,
                original_amount: parseFloat(r.original_amount) || 0,
                exchange_rate: parseFloat(r.exchange_rate) || 1
            }));

            const requestBody = {
                type_id: 1,
                orders: selectedOrderIds.map(id => ({ order_id: id })),
                expenses: formattedExpenses,
                additions: formattedAdditions,
                received_amounts: formattedReceivedAmounts
            };

            const response = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/collections/financial-preview`,
                requestBody,
                { withCredentials: true, headers: { 'Content-Type': 'application/json', 'Accept-Language': language } }
            );

            if (response.data) {
                const data = response.data;
                setFinancialPreview(data);

                // Update totals based on financial preview
                if (data.data && data.data.total_summary) {
                    const totalSummary = data.data.total_summary;
                    // Calculate total COD value from financial summary
                    const calculatedTotalCodValue = data.data.financial_summary?.reduce((sum, item) => sum + (item.total_cod_value || 0), 0) || 0;
                    const calculatedTotalFinalAmount = data.data.financial_summary?.reduce((sum, item) => sum + (item.final_amount || 0), 0) || 0;

                    setTotalCodValue(calculatedTotalCodValue);
                    setTotalNetValue(calculatedTotalFinalAmount);
                    setTotalDueDriverAmount(totalSummary.driver_outsource_fee || 0);

                    // Auto-populate driver salary for Admin/Accountant
                    const driverFee = totalSummary.driver_outsource_fee;

                    if (isAdminOrAccountant && driverFee > 0) {
                        setWithdrawals(prev => {
                            const hasSalary = prev.some(w => w.label === 'driver_salaries' || w.label === 'driver_outsource_fee');
                            if (!hasSalary) {
                                // Find correct currency from financial summary
                                let currency = 'ILS';
                                if (data.data.financial_summary) {
                                    for (const summary of data.data.financial_summary) {
                                        const expense = summary.expenses?.find(e => e.label === 'driver_outsource_fee' || e.label === 'driver_salaries');
                                        if (expense) {
                                            currency = summary.currency_code;
                                            break;
                                        }
                                    }
                                    // Fallback to first summary currency if not found
                                    if (currency === 'ILS' && data.data.financial_summary.length > 0) {
                                        currency = data.data.financial_summary[0].currency_code;
                                    }
                                }

                                const orderCount = totalSummary.total_orders || 0;
                                const outsourceValue = orderCount > 0 ? (driverFee / orderCount) : 0;
                                const description = `${translations[language]?.financialPreview?.driverFee} ${outsourceValue} | ${translations[language]?.financialPreview?.orders} ${orderCount}`;

                                return [...prev, {
                                    id: Date.now(),
                                    label: 'driver_salaries',
                                    amount: driverFee.toString(),
                                    currency: currency,
                                    description: description
                                }];
                            }
                            return prev;
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching financial preview:", error);
            setFinancialPreviewError(translations[language]?.financialPreview?.error || "Error loading data");
        } finally {
            setFinancialPreviewLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/branches?language_code=ar`, {
                withCredentials: true
            });
            if (response.data && Array.isArray(response.data.data)) {
                setBranches(response.data.data.map(b => ({
                    label: b.name,
                    value: b.branch_id,
                    ...b
                })));
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    const handleAddWithdrawal = () => {
        setWithdrawals([...withdrawals, {
            id: Date.now(),
            label: 'other',
            amount: '',
            currency: 'ILS',
            description: ''
        }]);
    };

    const handleUpdateWithdrawal = (id, field, value) => {
        setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, [field]: value } : w));
    };

    const handleRemoveWithdrawal = (id) => {
        setWithdrawals(withdrawals.filter(w => w.id !== id));
    };

    const handleAddAddition = () => {
        setAdditions([...additions, {
            id: Date.now(),
            label: 'other',
            amount: '',
            currency: 'ILS',
            description: ''
        }]);
    };

    const handleUpdateAddition = (id, field, value) => {
        setAdditions(additions.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const handleRemoveAddition = (id) => {
        setAdditions(additions.filter(a => a.id !== id));
    };

    const handleAddReceivedAmount = () => {
        setReceivedAmounts([...receivedAmounts, {
            id: Date.now(),
            original_currency: 'ILS',
            original_amount: '',
            currency: 'ILS',
            amount: '', // Calculated
            exchange_rate: '1'
        }]);
    };

    const handleUpdateReceivedAmount = (id, field, value) => {
        setReceivedAmounts(receivedAmounts.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };

            // Simple auto-calculate logic if needed, or leave for manual entry
            // For now, we trust user input or implement basic exchange later if requested

            return updated;
        }));
    };

    const handleRemoveReceivedAmount = (id) => {
        setReceivedAmounts(receivedAmounts.filter(r => r.id !== id));
    };

    const handleSubmit = () => {
        // Validation
        // if (!currentBranch) {
        //     Alert.alert("Error", "Please select a branch");
        //     return;
        // }

        onSubmit({
            current_branch_id: currentBranch?.value,
            expenses: withdrawals.map(w => ({
                label: w.label,
                amount: parseFloat(w.amount) || 0,
                currency: w.currency,
                description: w.description
            })),
            additions: isAdminOrAccountant
                ? additions.map(a => ({
                    label: a.label || "other",
                    amount: parseFloat(a.amount) || 0,
                    currency: a.currency || "ILS",
                    affected_user_id: a.affected_user_id || null,
                    description: a.description || ''
                }))
                : [],
            received_amounts: receivedAmounts.map(r => ({
                original_currency: r.original_currency,
                original_amount: parseFloat(r.original_amount) || 0,
                currency: r.currency,
                amount: parseFloat(r.amount) || parseFloat(r.original_amount) || 0, // Fallback
                exchange_rate: parseFloat(r.exchange_rate) || 1
            }))
        });
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
                {type === 'business_money' ? (translations[language]?.action?.options?.moneyRecord || "Money Record") : (translations[language]?.action?.options?.returnedRecord || "Returned Record")}
            </Text>
            <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'general' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('general')}
            >
                <Text style={[styles.tabText, {
                    color: activeTab === 'general' ? colors.primary : colors.textSecondary, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {translations[language]?.common?.general || "General"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'withdrawals' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('withdrawals')}
            >
                <Text style={[styles.tabText, {
                    color: activeTab === 'withdrawals' ? colors.primary : colors.textSecondary, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {translations[language]?.withdrawals?.title || "Withdrawals"}
                </Text>
            </TouchableOpacity>
            {isAdminOrAccountant && (
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'additions' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('additions')}
                >
                    <Text style={[styles.tabText, {
                        color: activeTab === 'additions' ? colors.primary : colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>
                        {translations[language]?.additions?.title || "Additions"}
                    </Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={[styles.tab, activeTab === 'received' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('received')}
            >
                <Text style={[styles.tabText, {
                    color: activeTab === 'received' ? colors.primary : colors.textSecondary, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }]}>
                    {translations[language]?.receivedAmounts?.title || "Received"}
                </Text>
            </TouchableOpacity>
            {type === 'business_money' && (
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'summary' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('summary')}
                >
                    <Text style={[styles.tabText, {
                        color: activeTab === 'summary' ? colors.primary : colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>
                        {translations[language]?.financialPreview?.title || "Summary"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderSummaryTab = () => (
        <ScrollView style={styles.tabContent}>
            {financialPreviewLoading && (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 10 }}>{translations[language]?.financialPreview?.loading || "Calculating..."}</Text>
                </View>
            )}

            {financialPreviewError && (
                <View style={styles.centerContent}>
                    <Text style={{ color: colors.error || '#dc3545', fontWeight: 'bold' }}>{financialPreviewError}</Text>
                </View>
            )}

            {!financialPreviewLoading && !financialPreviewError && (!financialPreview || !financialPreview.data) && (
                <View style={styles.centerContent}>
                    <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>{translations[language]?.financialPreview?.noFinancialData || "No data available"}</Text>
                </View>
            )}

            {financialPreview && financialPreview.data && (
                <View style={{ gap: 15 }}>
                    {financialPreview.data.financial_summary?.map((summary, index) => (
                        <View key={index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.row}>
                                <Text style={{ color: colors.text }}>{translations[language]?.financialPreview?.totalCodValue?.replace('{currency_code}', summary.currency_code) || `Total COD (${summary.currency_code})`}</Text>
                                <Text style={{ fontWeight: 'bold', color: '#28a745' }}>{summary.total_cod_value?.toFixed(2)} {summary.currency_code}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={{ color: colors.text }}>{translations[language]?.financialPreview?.totalExpenses?.replace('{currency_code}', summary.currency_code) || `Total Expenses (${summary.currency_code})`}</Text>
                                <Text style={{ color: '#dc3545' }}>
                                    {(summary.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0).toFixed(2)} {summary.currency_code}
                                </Text>
                            </View>

                            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 5 }]}>
                                <Text style={{ fontWeight: 'bold', color: colors.text }}>{translations[language]?.financialPreview?.finalAmount?.replace('{currency_code}', summary.currency_code) || `Final Amount (${summary.currency_code})`}</Text>
                                <Text style={{ fontWeight: 'bold', color: summary.final_amount >= 0 ? '#28a745' : '#dc3545' }}>
                                    {summary.final_amount?.toFixed(2)} {summary.currency_code}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {/* Total Summary */}
                    {financialPreview.data.total_summary && (
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 10 }]}>{translations[language]?.financialPreview?.totalSummary || "Total Summary"}</Text>

                            {financialPreview.data.driver_info && (
                                <View style={styles.row}>
                                    <Text style={{ color: colors.textSecondary }}>{translations[language]?.financialPreview?.driverInfo || "Driver Info"}</Text>
                                    <Text style={{ color: colors.text }}>{financialPreview.data.driver_info.name}</Text>
                                </View>
                            )}

                            <View style={styles.row}>
                                <Text style={{ color: colors.textSecondary }}>{translations[language]?.financialPreview?.totalOrders || "Total Orders"}</Text>
                                <Text style={{ fontWeight: 'bold', color: colors.text }}>{financialPreview.data.total_summary.total_orders}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={{ color: colors.textSecondary }}>{translations[language]?.financialPreview?.driverOutsourceFee || "Driver Outsource Fee"}</Text>
                                <Text style={{ fontWeight: 'bold', color: '#007bff' }}>{financialPreview.data.total_summary.driver_outsource_fee}</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderGeneralTab = () => (
        <View style={styles.tabContent}>
            <Text style={[styles.label, {
                color: colors.text, ...Platform.select({
                    ios: {
                        textAlign: isRTL ? "left" : ""
                    }
                })
            }]}>{translations[language]?.collectionBranchSection?.rows?.current_branch || "Current Branch"}</Text>
            <TouchableOpacity
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, justifyContent: 'center' }]}
                onPress={() => setShowBranchPicker(true)}
            >
                <Text style={{
                    color: currentBranch ? colors.text : colors.textSecondary, ...Platform.select({
                        ios: {
                            textAlign: isRTL ? "left" : ""
                        }
                    })
                }}>
                    {currentBranch?.label || translations[language]?.common?.selectBranch || "Select Branch"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} style={{ position: 'absolute', left: 10 }} />
            </TouchableOpacity>

            <PickerModal
                visible={showBranchPicker}
                title={translations[language]?.common?.selectBranch || "Select Branch"}
                data={branches}
                onSelect={(item) => {
                    setCurrentBranch(item);
                    setShowBranchPicker(false);
                }}
                onClose={() => setShowBranchPicker(false)}
            />
        </View>
    );

    const renderWithdrawalsTab = () => (
        <ScrollView style={styles.tabContent}>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary + '20' }]} onPress={handleAddWithdrawal}>
                <MaterialIcons name="add" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 5 }}>{translations[language]?.common?.add || "Add Withdrawal"}</Text>
            </TouchableOpacity>

            {withdrawals.map((w, index) => (
                <View key={w.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>#{index + 1}</Text>
                        <TouchableOpacity onPress={() => handleRemoveWithdrawal(w.id)}>
                            <MaterialIcons name="delete" size={20} color={colors.error || '#FF3B30'} />
                        </TouchableOpacity>
                    </View>

                    {/* Label Picker would go here, simplified to text input or simple picker logic for now */}
                    <View style={styles.pickerContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {expenseTypes.map(type => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.chip,
                                        { borderColor: colors.border },
                                        w.label === type.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => handleUpdateWithdrawal(w.id, 'label', type.value)}
                                >
                                    <Text style={{
                                        color: w.label === type.value ? 'white' : colors.text, ...Platform.select({
                                            ios: {
                                                textAlign: isRTL ? "left" : ""
                                            }
                                        })
                                    }}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <Text style={[styles.label, {
                        color: colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>{translations[language]?.withdrawals?.rows?.amount}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput
                            style={[styles.input, { flex: 2, color: colors.text, borderColor: colors.border }]}
                            value={w.amount}
                            onChangeText={(val) => handleUpdateWithdrawal(w.id, 'amount', val)}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {currencies.map(curr => (
                                    <TouchableOpacity
                                        key={curr.value}
                                        style={[
                                            styles.chipSmall,
                                            { borderColor: colors.border },
                                            w.currency === curr.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => handleUpdateWithdrawal(w.id, 'currency', curr.value)}
                                    >
                                        <Text style={{ color: w.currency === curr.value ? 'white' : colors.text, fontSize: 12 }}>{curr.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <Text style={[styles.label, {
                        color: colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>{translations[language]?.withdrawals?.rows?.description}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={w.description}
                        onChangeText={(val) => handleUpdateWithdrawal(w.id, 'description', val)}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>
            ))}
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderAdditionsTab = () => (
        <ScrollView style={styles.tabContent}>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary + '20' }]} onPress={handleAddAddition}>
                <MaterialIcons name="add" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 5 }}>
                    {translations[language]?.common?.add || "Add"} {translations[language]?.additions?.title || "Addition"}
                </Text>
            </TouchableOpacity>

            {additions.map((a, index) => (
                <View key={a.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>#{index + 1}</Text>
                        <TouchableOpacity onPress={() => handleRemoveAddition(a.id)}>
                            <MaterialIcons name="delete" size={20} color={colors.error || '#FF3B30'} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, {
                        color: colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>{translations[language]?.withdrawals?.rows?.amount || "Amount"}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput
                            style={[styles.input, { flex: 2, color: colors.text, borderColor: colors.border }]}
                            value={a.amount}
                            onChangeText={(val) => handleUpdateAddition(a.id, 'amount', val)}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {currencies.map(curr => (
                                    <TouchableOpacity
                                        key={curr.value}
                                        style={[
                                            styles.chipSmall,
                                            { borderColor: colors.border },
                                            a.currency === curr.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => handleUpdateAddition(a.id, 'currency', curr.value)}
                                    >
                                        <Text style={{ color: a.currency === curr.value ? 'white' : colors.text, fontSize: 12 }}>{curr.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <Text style={[styles.label, {
                        color: colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>{translations[language]?.withdrawals?.rows?.description || "Description"}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={a.description}
                        onChangeText={(val) => handleUpdateAddition(a.id, 'description', val)}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>
            ))}
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderReceivedTab = () => (
        <ScrollView style={styles.tabContent}>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary + '20' }]} onPress={handleAddReceivedAmount}>
                <MaterialIcons name="add" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 5 }}>{translations[language]?.common?.add || "Add Received Amount"}</Text>
            </TouchableOpacity>

            {receivedAmounts.map((r, index) => (
                <View key={r.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>#{index + 1}</Text>
                        <TouchableOpacity onPress={() => handleRemoveReceivedAmount(r.id)}>
                            <MaterialIcons name="delete" size={20} color={colors.error || '#FF3B30'} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, {
                        color: colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>{translations[language]?.receivedAmounts?.rows?.original_amount}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput
                            style={[styles.input, { flex: 2, color: colors.text, borderColor: colors.border }]}
                            value={r.original_amount}
                            onChangeText={(val) => handleUpdateReceivedAmount(r.id, 'original_amount', val)}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {currencies.map(curr => (
                                    <TouchableOpacity
                                        key={curr.value}
                                        style={[
                                            styles.chipSmall,
                                            { borderColor: colors.border },
                                            r.original_currency === curr.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => handleUpdateReceivedAmount(r.id, 'original_currency', curr.value)}
                                    >
                                        <Text style={{ color: r.original_currency === curr.value ? 'white' : colors.text, fontSize: 12 }}>{curr.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    {/* <Text style={[styles.label, { color: colors.textSecondary }]}>Exchange Rate</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={r.exchange_rate}
                        onChangeText={(val) => handleUpdateReceivedAmount(r.id, 'exchange_rate', val)}
                        placeholder="1.0"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                    /> */}

                    <Text style={[styles.label, {
                        color: colors.textSecondary, ...Platform.select({
                            ios: {
                                textAlign: isRTL ? "left" : ""
                            }
                        })
                    }]}>{translations[language]?.receivedAmounts?.rows?.amount}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput
                            style={[styles.input, { flex: 2, color: colors.text, borderColor: colors.border }]}
                            value={r.amount}
                            onChangeText={(val) => handleUpdateReceivedAmount(r.id, 'amount', val)}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {currencies.map(curr => (
                                    <TouchableOpacity
                                        key={curr.value}
                                        style={[
                                            styles.chipSmall,
                                            { borderColor: colors.border },
                                            r.currency === curr.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => handleUpdateReceivedAmount(r.id, 'currency', curr.value)}
                                    >
                                        <Text style={{ color: r.currency === curr.value ? 'white' : colors.text, fontSize: 12 }}>{curr.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            ))}
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { paddingBottom: insets.bottom }]}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {renderHeader()}
                    {renderTabs()}

                    <View style={styles.content}>
                        {activeTab === 'general' && renderGeneralTab()}
                        {activeTab === 'withdrawals' && renderWithdrawalsTab()}
                        {activeTab === 'additions' && renderAdditionsTab()}
                        {activeTab === 'received' && renderReceivedTab()}
                        {activeTab === 'summary' && renderSummaryTab()}
                    </View>

                    <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>{translations[language]?.common?.cancel || "Cancel"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>{translations[language]?.common?.save || "Save"}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        height: '80%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabText: {
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    tabContent: {
        flex: 1,
    },
    label: {
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        height: 50,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f1f1f1',
    },
    submitButton: {
        // backgroundColor set inline
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    card: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
    pickerContainer: {
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
    },
    chipSmall: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 6,
        minWidth: 40,
        alignItems: 'center'
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    }
});
