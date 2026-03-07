import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import memoryManager from '../../utils/memoryManager';

// Lazy load the Collection component
const Collection = lazy(() => import('./Collection'));

// Lightweight loading component
const CollectionLoadingPlaceholder = () => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
};

// Error boundary for the lazy-loaded component
class CollectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Collection component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load collection</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const LazyCollection = (props) => {
  const optimizationSettings = memoryManager.getOptimizationSettings();
  
  // On low memory devices, use a simpler loading state
  const LoadingComponent = optimizationSettings.isLowMemoryDevice 
    ? () => <View style={styles.simpleLoading} />
    : CollectionLoadingPlaceholder;

  return (
    <CollectionErrorBoundary>
      <Suspense fallback={<LoadingComponent />}>
        <Collection {...props} />
      </Suspense>
    </CollectionErrorBoundary>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  simpleLoading: {
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  errorContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});

export default LazyCollection;