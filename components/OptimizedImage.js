import React, { useState, useCallback, useMemo } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';

const OptimizedImage = ({ 
  source, 
  style, 
  resizeMode = 'contain', 
  placeholder = null,
  onLoad,
  onError,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    onLoad && onLoad();
  }, [onLoad]);

  const handleError = useCallback((err) => {
    setLoading(false);
    setError(true);
    onError && onError(err);
  }, [onError]);

  // Optimize image source for memory efficiency
  const optimizedSource = useMemo(() => {
    if (typeof source === 'string') {
      return { uri: source };
    }
    return source;
  }, [source]);

  const imageStyle = useMemo(() => [
    styles.image,
    style,
    { opacity: loading ? 0 : 1 }
  ], [style, loading]);

  if (error) {
    return placeholder || <View style={[style, styles.placeholder]} />;
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      <Image
        source={optimizedSource}
        style={imageStyle}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
        // Memory optimization props
        fadeDuration={0} // Disable fade animation to save memory
        progressiveRenderingEnabled={true}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OptimizedImage;