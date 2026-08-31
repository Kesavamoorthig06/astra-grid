import { useState, useEffect } from 'react';

/**
 * Hook to check if a feature is enabled
 * @param {string} featureName - The name of the feature to check
 * @returns {boolean} - Whether the feature is enabled
 */
export function useFeatureToggle(featureName) {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('featureToggles');
    if (saved) {
      const toggles = JSON.parse(saved);
      setIsEnabled(toggles[featureName] !== false); // Default to true if not set
    }

    // Listen for changes
    const handleToggleChange = (event) => {
      const newToggles = event.detail;
      setIsEnabled(newToggles[featureName] !== false);
    };

    window.addEventListener('featureToggleChanged', handleToggleChange);

    return () => {
      window.removeEventListener('featureToggleChanged', handleToggleChange);
    };
  }, [featureName]);

  return isEnabled;
}

/**
 * HOC to conditionally render components based on feature toggle
 */
export function withFeatureToggle(Component, featureName) {
  return function FeatureToggleWrapper(props) {
    const isEnabled = useFeatureToggle(featureName);

    if (!isEnabled) {
      return null;
    }

    return Component(props);
  };
}
