import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureToggle } from '../../hooks/useFeatureToggle';

/**
 * Route wrapper that redirects if feature is disabled
 * @param {string} feature - Name of the feature to check
 * @param {ReactNode} children - Component to render if feature is enabled
 * @param {string} redirectTo - Where to redirect (default: /dashboard, fallback: /prediction)
 */
export default function FeatureRoute({ feature, children, redirectTo = '/dashboard' }) {
  const isEnabled = useFeatureToggle(feature);
  const dashboardEnabled = useFeatureToggle('dashboard');
  const predictionEnabled = useFeatureToggle('prediction');
  const simulationEnabled = useFeatureToggle('simulation');

  if (!isEnabled) {
    // Smart redirect: find first enabled page
    if (redirectTo === '/dashboard' && !dashboardEnabled) {
      if (predictionEnabled) return <Navigate to="/prediction" replace />;
      if (simulationEnabled) return <Navigate to="/simulation" replace />;
      return <Navigate to="/magic" replace />; // Last resort
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
