import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Order from './Order';

const { width } = Dimensions.get('window');

const CityGroupItem = ({ 
  group, 
  isExpanded, 
  onToggle, 
  orders = [], 
  isLoading = false, 
  onLoadOrders = () => {},
  onStatusChange = () => {},
  metadata = null
}) => {
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  // Update animation when expanded state changes
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(heightAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false
      })
    ]).start();
  }, [isExpanded, rotateAnim, heightAnim]);

  // Interpolate rotation for the chevron icon
  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  // Handle toggle and load orders if needed
  const handleToggle = () => {
    // Check if we already have orders for this city
    const hasOrders = orders && orders.length > 0;
    
    if (!isExpanded && !hasOrders) {
      console.log(`Toggling city ${group.group_value}, loading orders`);
      // Pass the entire group object instead of just order_ids
      onLoadOrders(group);
    } else {
      console.log(`Toggling city ${group.group_value}, already have ${orders?.length || 0} orders`);
    }
    
    onToggle(group.group_value);
  };

  return (
    <View style={[styles.cityGroupItem, { backgroundColor: colors.card }]}>
      {/* Header with city name and order count */}
      <TouchableOpacity 
        style={[styles.cityGroupHeader, { borderBottomColor: colors.border }]} 
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.cityInfoContainer}>
          <View style={[styles.cityIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="city-variant-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.cityTextContainer}>
            <Text style={[styles.cityName, { color: colors.text }]}>
              {group.group_value_label}
            </Text>
            <Text style={[styles.orderCount, { color: colors.textSecondary }]}>
              {group.total_orders} {translations[language]?.tabs?.orders?.orderCount || 'Orders'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cityActionContainer}>
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.countBadgeText}>{group.total_orders}</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
            <MaterialIcons name="expand-more" size={24} color={colors.primary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expandable content with orders */}
      <Animated.View 
        style={[
          styles.expandableContent,
          {
            height: heightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, isExpanded ? 'auto' : 0]
            }),
            opacity: heightAnim,
            overflow: 'hidden'
          }
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {translations[language]?.common?.loading || 'Loading orders...'}
            </Text>
          </View>
        ) : orders && orders.length > 0 ? (
          <View style={styles.ordersContainer}>
            {orders.map((order) => (
              <View key={order.order_id} style={styles.orderItemContainer}>
                <Order 
                  order={order} 
                  onStatusChange={onStatusChange}
                  user={metadata || {}}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {translations[language]?.tabs?.orders?.noOrdersInCity || 'No orders available for this city'}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const CityGrouping = ({ 
  cityGroups = [], 
  loadOrders = () => {}, 
  ordersMap = {}, 
  loadingMap = {},
  onStatusChange = () => {},
  metadata = null,
  refreshControl = null
}) => {
  const { language } = useLanguage();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [expandedCity, setExpandedCity] = useState(null);
  const flatListRef = useRef(null);

  // Toggle expanded city
  const toggleCity = (cityValue) => {
    setExpandedCity(expandedCity === cityValue ? null : cityValue);
  };

  // Render each city group
  const renderItem = useCallback(({ item }) => (
    <CityGroupItem
      group={item}
      isExpanded={expandedCity === item.group_value}
      onToggle={toggleCity}
      orders={ordersMap[item.group_value]}
      isLoading={loadingMap[item.group_value]}
      onLoadOrders={loadOrders}
      onStatusChange={onStatusChange}
      metadata={metadata}
    />
  ), [expandedCity, ordersMap, loadingMap, loadOrders, onStatusChange, metadata]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item) => item.group_value, []);

  // Empty state when no city groups are available
  if (!cityGroups || cityGroups.length === 0) {
    return (
      <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="city-variant-outline" size={50} color={colors.textSecondary} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {translations[language]?.tabs?.orders?.noCityGroups || 'No city groups available'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={cityGroups}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cityGroupItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cityGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  cityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cityTextContainer: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderCount: {
    fontSize: 13,
    marginTop: 2,
  },
  cityActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  expandableContent: {
    width: '100%',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  ordersContainer: {
    padding: 8,
  },
  orderItemContainer: {
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default CityGrouping;
