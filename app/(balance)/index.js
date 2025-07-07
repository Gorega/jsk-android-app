import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../RootLayout";
import { useLanguage } from "../../utils/languageContext";
import { translations } from "../../utils/languageContext";
import useFetch from "../../utils/useFetch";
import { MaterialIcons, AntDesign, Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRTLStyles } from '../../utils/RTLWrapper';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function BalanceHistoryScreen() {
  const { currency, value } = useLocalSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { data: { data }, getRequest, isLoading } = useFetch();
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const rtl = useRTLStyles();

  const fetchBalanceHistory = async (pageNum = 1) => {
    try {
      await getRequest(`/api/users/${user.userId}/balances/history?page=${pageNum}&currency=${currency}`, language);
    } catch (error) {
    }
  };

  useEffect(() => {
    if (data?.history) {
      if (page === 1) {
        setHistoryData(data.history);
      } else {
        setHistoryData(prevData => [...prevData, ...data.history]);
      }
    }
  }, [data?.history, page]);

  useEffect(() => {
    fetchBalanceHistory();
  }, [currency]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setPage(1);
      setHistoryData([]);
      await fetchBalanceHistory(1);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [currency]);

  const loadMoreData = async () => {
    if (loadingMore || !data?.pagination || page >= data.pagination.totalPages) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      await fetchBalanceHistory(nextPage);
      setPage(nextPage);
    } catch (error) {
    } finally {
      setLoadingMore(false);
    }
  };

  const getOperationIcon = (operation, referenceType) => {
    if (operation === "add") {
      return <AntDesign name="plus" size={18} color="white" />;
    } else if (operation === "subtract") {
      return <AntDesign name="minus" size={18} color="white" />;
    }
    
    switch (referenceType) {
      case "payment":
        return <MaterialIcons name="payments" size={18} color="white" />;
      case "transaction":
        return <MaterialIcons name="swap-horiz" size={18} color="white" />;
      case "other":
        return <Entypo name="cycle" size={18} color="white" />;
      default:
        return <MaterialIcons name="attach-money" size={18} color="white" />;
    }
  };

  const getGradientColors = (operation) => {
    return operation === "add" 
      ? ["#06D6A0", colors.primary] 
      : ["#F72585", "#7209B7"];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderBalanceItem = ({ item }) => (
    <View style={[
      styles.transactionCard,
      { 
        backgroundColor: colors.card,
        shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
      }
    ]}>
      <LinearGradient
        colors={getGradientColors(item.operation)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        {getOperationIcon(item.operation, item.reference_type)}
      </LinearGradient>
      
      <View style={styles.transactionDetails}>
        <View style={styles.transactionHeader}>
          <Text style={[
            styles.transactionType,
            { color: colors.text },
            {
              ...Platform.select({
                ios: {
                  textAlign: rtl.isRTL ? "left" : "right"
                }
              }),
            }
          ]} numberOfLines={1}>
            {item.reference_type === "payment" 
              ? translations[language]?.balance?.paymentType || "Payment" 
              : item.reference_type === "transaction" 
                ? translations[language]?.balance?.transactionType || "Transaction"
                : translations[language]?.balance?.otherType || "Adjustment"}
          </Text>
          <Text 
            style={[
              styles.transactionAmount, 
              item.operation === "add" ? styles.amountPositive : styles.amountNegative,
            ]}
          >
            {item.operation === "add" ? "+" : "-"}
            {item.currency_code || ""} {item.amount}
          </Text>
        </View>
        
        <Text style={[
          styles.transactionNotes,
          { color: colors.textSecondary },
          {
            ...Platform.select({
              ios: {
                textAlign: rtl.isRTL ? "left" : "right"
              }
            }),
          }
        ]} numberOfLines={2}>
          {item.notes}
        </Text>
        <View>
          <Text style={[
            styles.transactionDate,
            { color: colors.textTertiary }
          ]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.summaryContainer}>
      <LinearGradient
        colors={currency === "ILS" 
          ? [colors.accent, colors.primary] 
          : currency === "USD" 
            ? [colors.secondary, isDark ? "#5A4CB7" : "#480CA8"] 
            : ["#7209B7", "#F72585"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceSummary}
      >
        <Text style={styles.balanceTitle}>
          {translations[language]?.balance?.currentBalance || "Current Balance"}
        </Text>
        
        <Text style={styles.balanceAmount}>
          {currency === "ILS" ? "₪" : currency === "USD" ? "$" : "JD"}
          {value || "0.00"}
        </Text>
        
        <Text style={styles.balanceCurrency}>
          {currency}
        </Text>
      </LinearGradient>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="account-balance-wallet" size={60} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {translations[language]?.balance?.noTransactions || "No transactions found"}
      </Text>
    </View>
  );

  if (isLoading && !data && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {translations[language]?.balance.loading || "Loading data..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={historyData}
        renderItem={renderBalanceItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  balanceSummary: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  balanceTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  balanceCurrency: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  transactionCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 10
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700"
  },
  amountPositive: {
    color: "#06D6A0",
  },
  amountNegative: {
    color: "#F72585",
  },
  transactionNotes: {
    fontSize: 14,
    marginBottom: 10,
  },
  transactionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10
  },
  transactionDate: {
    fontSize: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
});