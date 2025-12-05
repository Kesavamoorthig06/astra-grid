import { useState, useEffect } from 'react';

const FEATURES_STORAGE_KEY = 'astra-grid:feature-settings';

// Custom hook to check if a feature is enabled with real-time updates
export const useFeatureFlag = (featureName) => {
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(FEATURES_STORAGE_KEY);
      if (!stored) return true;
      const parsed = JSON.parse(stored);
      return parsed[featureName]?.enabled !== false;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleFeatureChange = (event) => {
      try {
        const features = event.detail || {};
        if (features[featureName]) {
          setIsEnabled(features[featureName].enabled);
        }
      } catch (error) {
        console.warn('Failed to update feature flag', error);
      }
    };

    window.addEventListener('featureSettingsChanged', handleFeatureChange);
    
    return () => {
      window.removeEventListener('featureSettingsChanged', handleFeatureChange);
    };
  }, [featureName]);

  return isEnabled;
};

// Synchronous version for compatibility
export const isFeatureEnabled = (featureName) => {
  try {
    const stored = localStorage.getItem(FEATURES_STORAGE_KEY);
    if (!stored) {
      return true;
    }
    const parsed = JSON.parse(stored);
    return parsed[featureName]?.enabled !== false;
  } catch (error) {
    console.warn('Failed to check feature flag', error);
    return true;
  }
};

export const getAllFeatureSettings = () => {
  try {
    const stored = localStorage.getItem(FEATURES_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to get feature settings', error);
    return null;
  }
};
