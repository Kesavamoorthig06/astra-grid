import React from 'react';
import { useFeatureToggle } from '../hooks/useFeatureToggle';

/**
 * Component that conditionally renders children based on feature toggle
 * @param {Object} props
 * @param {string} props.feature - The feature name to check
 * @param {React.ReactNode} props.children - Content to render if enabled
 * @param {React.ReactNode} props.fallback - Content to render if disabled (optional)
 */
export default function FeatureGuard({ feature, children, fallback = null }) {
  const isEnabled = useFeatureToggle(feature);

  if (!isEnabled) {
    return fallback;
  }

  return children;
}
