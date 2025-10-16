import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const CitySwipeNavigation = ({ 
  cityGroups, 
  selectedCity, 
  onSelectCity 
}) => {
  const { isDark, colorScheme } = useTheme();
  const { language } = useLanguage();
  const colors = Colors[colorScheme];
  const scrollViewRef = useRef(null);
  const [itemLayouts, setItemLayouts] = useState({});
  
  // When selectedCity changes, scroll to make it visible
  useEffect(() => {
    if (selectedCity && itemLayouts[selectedCity] && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: itemLayouts[selectedCity].x - 16, // Adjust for padding
        animated: true
      });
    }
  }, [selectedCity, itemLayouts]);

  // Store the layout information for each tab item
  const handleLayout = (cityValue, event) => {
    const { x, width } = event.nativeEvent.layout;
    setItemLayouts(prev => ({
      ...prev,
      [cityValue]: { x, width }
    }));
  };

  if (!cityGroups || cityGroups.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="city-variant" size={18} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.text }]}>
          {translations[language]?.tabs?.orders?.citiesFilter || 'Filter by City'}
        </Text>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* "All" option */}
        <TouchableOpacity
          style={[
            styles.cityTab,
            !selectedCity && styles.cityTabSelected,
            { 
              backgroundColor: !selectedCity 
                ? colors.primary 
                : isDark ? colors.card : '#F3F4F6',
              borderColor: !selectedCity ? colors.primary : colors.border
            }
          ]}
          onPress={() => onSelectCity(null)}
          onLayout={(e) => handleLayout('all', e)}
        >
          <Text 
            style={[
              styles.cityTabText, 
              !selectedCity && styles.cityTabTextSelected,
              { color: !selectedCity ? colors.buttonText : colors.text }
            ]}
          >
            {translations[language]?.tabs?.orders?.allCities || 'All Cities'}
          </Text>
        </TouchableOpacity>
        
        {/* City options */}
        {cityGroups.map((city) => (
          <TouchableOpacity
            key={city.group_value}
            style={[
              styles.cityTab,
              selectedCity === city.group_value && styles.cityTabSelected,
              { 
                backgroundColor: selectedCity === city.group_value 
                  ? colors.primary 
                  : isDark ? colors.card : '#F3F4F6',
                borderColor: selectedCity === city.group_value ? colors.primary : colors.border
              }
            ]}
            onPress={() => onSelectCity(city.group_value)}
            onLayout={(e) => handleLayout(city.group_value, e)}
          >
            <Text 
              style={[
                styles.cityTabText, 
                selectedCity === city.group_value && styles.cityTabTextSelected,
                { color: selectedCity === city.group_value ? colors.buttonText : colors.text }
              ]}
            >
              {city.group_value_label}
            </Text>
            <View 
              style={[
                styles.countBadge, 
                { 
                  backgroundColor: selectedCity === city.group_value 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : colors.primary 
                }
              ]}
            >
              <Text 
                style={[
                  styles.countText,
                  { color: selectedCity === city.group_value ? colors.buttonText : '#FFFFFF' }
                ]}
              >
                {city.total_orders}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  cityTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  cityTabSelected: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cityTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cityTabTextSelected: {
    fontWeight: '700',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default CitySwipeNavigation;
