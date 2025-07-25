import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView
} from 'react-native';
import { useLanguage } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '@/constants/Colors';
import { useFetch } from '../../utils/useFetch';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

const PERIODS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'half_year', label: '6 Months' },
  { id: 'year', label: 'Year' }
];

export default function DriverStatistics() {
  const { language } = useLanguage();
  const translations = require('../../utils/languageContext').translations;
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isRTL = language === 'ar' || language === 'he';

  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  // Fetch statistics based on selected period
  const fetchDriverStats = async (period) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver-stats?period=${period}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch driver statistics');
      }
      
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats when period changes
  useEffect(() => {
    fetchDriverStats(selectedPeriod);
  }, [selectedPeriod]);
  
  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Format currency values for display
  const formatCurrency = (value) => {
    if (!value) return '0.00';
    
    // If it's a complex string with multiple currencies
    if (typeof value === 'string' && value.includes('|')) {
      return value;
    }
    
    // If it's a simple number or string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toFixed(2);
  };
  
  // Calculate percentage for progress bars
  const getPercentage = (value) => {
    if (!value) return '0%';
    return `${value}%`;
  };
  
  // Get background color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return isDark ? ['#065f46', '#10b981'] : ['#10b981', '#34d399'];
      case 'returned':
        return isDark ? ['#991b1b', '#ef4444'] : ['#ef4444', '#f87171'];
      case 'on_the_way':
        return isDark ? ['#1e40af', '#3b82f6'] : ['#3b82f6', '#60a5fa'];
      case 'total':
        return isDark ? ['#4c1d95', '#8b5cf6'] : ['#8b5cf6', '#a78bfa'];
      default:
        return isDark ? ['#1f2937', '#4b5563'] : ['#4b5563', '#9ca3af'];
    }
  };
  
  // Get icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <MaterialCommunityIcons name="check-circle-outline" size={24} color="#10b981" />;
      case 'returned':
        return <MaterialCommunityIcons name="close-circle-outline" size={24} color="#ef4444" />;
      case 'on_the_way':
        return <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#3b82f6" />;
      case 'total':
        return <MaterialCommunityIcons name="chart-box-outline" size={24} color="#8b5cf6" />;
      default:
        return <MaterialCommunityIcons name="information-outline" size={24} color="#9ca3af" />;
    }
  };
  
  // Prepare data for bar chart - moved outside of render function to avoid hooks issues
  const chartData = useMemo(() => {
    if (!stats || !stats.statistics) return null;
    
    return {
      labels: ['Delivered', 'Returned', 'On Way'],
      datasets: [
        {
          data: [
            parseInt(stats.statistics.delivered?.count || 0),
            parseInt(stats.statistics.returned?.count || 0),
            parseInt(stats.statistics.on_the_way?.count || 0)
          ]
        }
      ]
    };
  }, [stats]);
  
  // Calculate screen width with useMemo to prevent unnecessary recalculations
  const screenWidth = useMemo(() => {
    const { width } = Dimensions.get('window');
    return width - 40; // Account for container padding
  }, [Dimensions.get('window').width]);
  
  // Format date range for display
  const formatDateRange = useRef((dateRange) => {
    if (!dateRange) return '';
    
    const startDate = new Date(dateRange.start_date);
    const endDate = new Date(dateRange.end_date);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }).current;
  
  // Render period selector
  const renderPeriodSelector = () => {
    return (
      <Animated.View 
        style={[
          styles.periodSelectorContainer,
          { 
            backgroundColor: isDark ? colors.cardDark : colors.card,
            borderColor: colors.border
          },
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.periodHeader}>
          <Text style={[styles.periodHeaderText, { color: colors.text }]}>
            {translations[language]?.driverStats?.selectPeriod || 'Select Period'}
          </Text>
          <AntDesign name="calendar" size={18} color={colors.primary} />
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodScrollContent}
        >
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && [
                  styles.selectedPeriodButton,
                  { backgroundColor: colors.primary }
                ]
              ]}
              onPress={() => setSelectedPeriod(period.id)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.periodButtonText,
                  { color: selectedPeriod === period.id ? '#FFFFFF' : colors.textSecondary }
                ]}
              >
                {translations[language]?.driverStats?.periods?.[period.id] || period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };
  
  // Render stats card
  const renderStatsCard = (title, data, status) => {
    if (!data) return null;
    
    const gradientColors = getStatusColor(status);
    
    return (
      <Animated.View
        style={[
          styles.statsCard,
          { 
            backgroundColor: isDark ? colors.cardDark : colors.card,
            borderColor: colors.border
          },
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateY }
            ]
          }
        ]}
      >
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: gradientColors[0] }
        ]} />
        
        <View style={styles.statsCardInner}>
          <View style={styles.statsCardHeader}>
            {getStatusIcon(status)}
            <Text style={[styles.statsCardTitle, { color: colors.text },isRTL && {textAlign: 'left'}]}>
              {translations[language]?.driverStats?.statuses?.[status] || title}
            </Text>
          </View>
          
          <View style={styles.statsCardContent}>
            <View style={styles.statsRow}>
              <Text style={[styles.statsLabel, { color: colors.textSecondary },isRTL && {textAlign: 'left'}]}>
                {translations[language]?.driverStats?.count || 'Count'}
              </Text>
              <Text style={[styles.statsValue, { color: colors.text },isRTL && {textAlign: 'left'}]}>
                {data.count || 0}
              </Text>
            </View>
            
            {data.percentage && (
              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBar,
                    { width: getPercentage(data.percentage) }
                  ]}
                />
                <Text style={[styles.progressText, { 
                  color: parseFloat(data.percentage) > 50 ? '#FFFFFF' : colors.textSecondary,
                  right: parseFloat(data.percentage) > 90 ? 10 : 'auto',
                  left: parseFloat(data.percentage) <= 90 ? 10 : 'auto',
                }]}>
                  {getPercentage(data.percentage)}
                </Text>
              </View>
            )}
            
            {data.total_delivery_fee && (
              <View style={styles.statsRow}>
                <Text style={[styles.statsLabel, { color: colors.textSecondary },isRTL && {textAlign: 'left'}]}>
                  {translations[language]?.driverStats?.deliveryFee || 'Delivery Fee'}
                </Text>
                <Text style={[styles.statsValue, { color: colors.text },isRTL && {textAlign: 'left'}]}>
                  {formatCurrency(data.total_delivery_fee)}
                </Text>
              </View>
            )}
            
            {data.total_cod_value && (
              <View style={styles.statsRow}>
                <Text style={[styles.statsLabel, { color: colors.textSecondary },isRTL && {textAlign: 'left'}]}>
                  {translations[language]?.driverStats?.codValue || 'COD Value'}
                </Text>
                <View style={styles.codValueContainer}>
                  <Text style={[styles.statsValueMulti, { color: colors.text },isRTL && {textAlign: 'left'}]} numberOfLines={2} ellipsizeMode="tail">
                    {data.total_cod_value}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };
  
  // Render chart section
  const renderChart = () => {
    if (!chartData) return null;
    
    return (
      <Animated.View
        style={[
          styles.chartContainer,
          { 
            backgroundColor: isDark ? colors.cardDark : colors.card,
            borderColor: colors.border
          },
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateY }
            ]
          }
        ]}
      >
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {translations[language]?.driverStats?.ordersChart || 'Orders Distribution'}
          </Text>
          <MaterialCommunityIcons name="chart-bar" size={22} color={colors.primary} />
        </View>
        
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            width={screenWidth - 40} // Ensure chart fits within container
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={true}
            showBarTops={true}
            showValuesOnTopOfBars={true}
            chartConfig={{
              backgroundColor: isDark ? colors.cardDark : colors.card,
              backgroundGradientFrom: isDark ? colors.cardDark : colors.card,
              backgroundGradientTo: isDark ? colors.cardDark : colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => isDark 
                ? `rgba(255, 255, 255, ${opacity})` 
                : `rgba(67, 97, 238, ${opacity})`,
              labelColor: (opacity = 1) => isDark 
                ? `rgba(255, 255, 255, ${opacity})` 
                : `rgba(30, 41, 59, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.6,
              propsForLabels: {
                fontSize: 12,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              paddingRight: 0,
            }}
          />
        </View>
      </Animated.View>
    );
  };
  
  // Render driver info
  const renderDriverInfo = () => {
    if (!stats || !stats.driver) return null;
    
    return (
      <Animated.View
        style={[
          styles.driverInfoCard,
          { 
            backgroundColor: isDark ? colors.cardDark : colors.card,
            borderColor: colors.border
          },
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateY }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#4c1d95', '#6d28d9'] : ['#4f46e5', '#6366f1']}
          style={styles.driverAvatarContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.driverAvatarText,isRTL && {textAlign: 'left'}]}>
            {stats.driver.name ? stats.driver.name.charAt(0).toUpperCase() : 'D'}
          </Text>
        </LinearGradient>
        
        <View style={styles.driverDetails}>
          <Text style={[styles.driverName, { color: colors.text },isRTL && {textAlign: 'left'}]}>
            {stats.driver.name}
          </Text>
          <View style={styles.driverPhoneContainer}>
            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.driverPhone, { color: colors.textSecondary },isRTL && {textAlign: 'left'}]}>
              {stats.driver.phone}
            </Text>
          </View>
          <View style={[
            styles.driverRoleBadge,
            { backgroundColor: isDark ? '#4c1d95' : '#4f46e5' }
          ]}>
            <FontAwesome5 name="truck" size={12} color="#FFFFFF" style={styles.driverRoleIcon} />
            <Text style={[styles.driverRoleText,isRTL && {textAlign: 'left'}]}>
              {translations[language]?.roles?.[stats.driver.role] || stats.driver.role}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  // Render date range info
  const renderDateRange = () => {
    if (!stats || !stats.date_range) return null;
    
    return (
      <Animated.View
        style={[
          styles.dateRangeContainer,
          { 
            backgroundColor: isDark ? colors.cardDark : colors.card,
            borderColor: colors.border
          },
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateY }
            ]
          }
        ]}
      >
        <View style={styles.dateRangeContent}>
          <View style={styles.dateRangeIconContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={isDark ? '#a78bfa' : '#8b5cf6'} 
            />
          </View>
          <View style={styles.dateRangeTextContainer}>
                          <Text style={[styles.dateRangeLabel, { color: colors.textSecondary },isRTL && {textAlign: 'left'}]}>
                {translations[language]?.driverStats?.dateRange || 'Date Range'}
              </Text>
              <Text style={[styles.dateRangeText, { color: colors.text },isRTL && {textAlign: 'left'}]}>
                {stats.date_range ? formatDateRange(stats.date_range) : ''}
              </Text>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  // Render loading state
  if (loading && !stats) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary },isRTL && {textAlign: 'left'}]}>
          {translations[language]?.common?.loading || 'Loading...'}
        </Text>
      </View>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchDriverStats(selectedPeriod)}
        >
          <Text style={styles.retryButtonText}>
            {translations[language]?.common?.retry || 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Period Selector */}
        {renderPeriodSelector()}
        
        {/* Driver Info */}
        {renderDriverInfo()}
        
        {/* Date Range */}
        {renderDateRange()}
        
        {/* Chart */}
        {renderChart()}
        
        {/* Statistics Cards */}
        {stats && stats.statistics && (
          <View style={styles.statsCardsContainer}>
            {renderStatsCard('Delivered', stats.statistics.delivered, 'delivered')}
            {renderStatsCard('Returned', stats.statistics.returned, 'returned')}
            {renderStatsCard('On The Way', stats.statistics.on_the_way, 'on_the_way')}
            {renderStatsCard('Total', stats.statistics.total, 'total')}
          </View>
        )}
        
        {/* Refresh Button */}
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchDriverStats(selectedPeriod)}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.refreshButtonText}>
            {translations[language]?.common?.refresh || 'Refresh'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  periodSelectorContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  periodHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  periodScrollContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  selectedPeriodButton: {
    backgroundColor: '#4361EE',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  driverInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  driverAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  driverAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  driverPhoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverPhone: {
    fontSize: 14,
    marginLeft: 6,
  },
  driverRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4361EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  driverRoleIcon: {
    marginRight: 6,
  },
  driverRoleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateRangeContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dateRangeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap:10,
  },
  dateRangeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRangeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  dateRangeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  statsCardsContainer: {
    width: '100%',
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusIndicator: {
    width: 8,
    height: '100%',
  },
  statsCardInner: {
    flex: 1,
    padding: 16,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap:7,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsCardContent: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    flex: 1,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
  },
//   codValueContainer: {
//     flex: 1,
//     alignItems: 'flex-end',
//     maxWidth: '60%',
//   },
  statsValueMulti: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 12,
  },
  progressText: {
    position: 'absolute',
    top: 3,
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  }
}); 