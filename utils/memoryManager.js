import { Platform, DeviceEventEmitter } from 'react-native';

class MemoryManager {
  constructor() {
    this.memoryWarningListeners = [];
    this.isLowMemoryDevice = this.detectLowMemoryDevice();
    this.setupMemoryWarningListener();
  }

  // Detect if device has low memory based on available indicators
  detectLowMemoryDevice() {
    // This is a heuristic - in a real app you might use device info
    // For now, we'll assume older Android versions or specific models are low memory
    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version;
      // Devices with Android 8 or lower are likely to have less RAM
      return androidVersion <= 26;
    }
    return false;
  }

  // Setup memory warning listener for Android
  setupMemoryWarningListener() {
    if (Platform.OS === 'android') {
      DeviceEventEmitter.addListener('memoryWarning', this.handleMemoryWarning.bind(this));
    }
  }

  // Handle memory warning events
  handleMemoryWarning() {
    console.warn('Memory warning received - cleaning up resources');
    this.memoryWarningListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in memory warning listener:', error);
      }
    });
  }

  // Register a callback for memory warnings
  addMemoryWarningListener(callback) {
    this.memoryWarningListeners.push(callback);
    return () => {
      const index = this.memoryWarningListeners.indexOf(callback);
      if (index > -1) {
        this.memoryWarningListeners.splice(index, 1);
      }
    };
  }

  // Get memory optimization settings based on device capabilities
  getOptimizationSettings() {
    return {
      isLowMemoryDevice: this.isLowMemoryDevice,
      maxConcurrentRequests: this.isLowMemoryDevice ? 2 : 5,
      imageQuality: this.isLowMemoryDevice ? 0.7 : 0.9,
      cacheSize: this.isLowMemoryDevice ? 50 : 100, // Number of items to cache
      enableAnimations: !this.isLowMemoryDevice,
      preloadImages: !this.isLowMemoryDevice,
      socketReconnectDelay: this.isLowMemoryDevice ? 3000 : 1000,
      maxSocketListeners: this.isLowMemoryDevice ? 5 : 10,
    };
  }

  // Force garbage collection (if available)
  forceGarbageCollection() {
    if (global.gc) {
      try {
        global.gc();
        console.log('Garbage collection forced');
      } catch (error) {
        console.warn('Could not force garbage collection:', error);
      }
    }
  }

  // Clean up resources
  cleanup() {
    this.memoryWarningListeners = [];
    if (Platform.OS === 'android') {
      DeviceEventEmitter.removeAllListeners('memoryWarning');
    }
  }
}

// Create singleton instance
const memoryManager = new MemoryManager();

export default memoryManager;

// Export utility functions
export const isLowMemoryDevice = () => memoryManager.isLowMemoryDevice;
export const getOptimizationSettings = () => memoryManager.getOptimizationSettings();
export const addMemoryWarningListener = (callback) => memoryManager.addMemoryWarningListener(callback);
export const forceGarbageCollection = () => memoryManager.forceGarbageCollection();