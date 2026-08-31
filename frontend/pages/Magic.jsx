import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, Eye, EyeOff, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { isAdmin as checkIsAdmin } from '../utils/adminAuth';

export default function Magic() {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [features, setFeatures] = useState({
    dashboard: true,
    chatbot: true,
    prediction: true,
    simulation: true,
    documentExtractor: true,
    history: true,
    voiceInput: true,
    advancedMetrics: true,
    comparison: true
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [visibleComponents, setVisibleComponents] = useState({});

  useEffect(() => {
    checkAdminStatus();
    loadFeatureToggles();
  }, []);

  const checkAdminStatus = () => {
    setIsAdmin(checkIsAdmin());
    setLoading(false);
  };

  const loadFeatureToggles = () => {
    const saved = localStorage.getItem('featureToggles');
    if (saved) {
      const toggles = JSON.parse(saved);
      setFeatures(toggles);
      setVisibleComponents(toggles);
    }
  };

  const toggleFeature = (featureName) => {
    const newFeatures = {
      ...features,
      [featureName]: !features[featureName]
    };
    setFeatures(newFeatures);
    setVisibleComponents(newFeatures);
  };

  const saveFeatures = () => {
    localStorage.setItem('featureToggles', JSON.stringify(features));
    
    // Dispatch event for components to listen to
    window.dispatchEvent(new CustomEvent('featureToggleChanged', { detail: features }));
    
    // Force page reload to update all components immediately
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
    setMessage({ type: 'success', text: 'Features updated successfully! Reloading...' });
  };

  const resetToDefault = () => {
    const defaults = {
      dashboard: true,
      chatbot: true,
      prediction: true,
      simulation: true,
      documentExtractor: true,
      history: true,
      voiceInput: true,
      advancedMetrics: true,
      comparison: true
    };
    setFeatures(defaults);
    setVisibleComponents(defaults);
    localStorage.setItem('featureToggles', JSON.stringify(defaults));
    
    // Dispatch event and reload
    window.dispatchEvent(new CustomEvent('featureToggleChanged', { detail: defaults }));
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
    setMessage({ type: 'success', text: 'Reset to defaults! Reloading...' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Sparkles className="h-8 w-8 text-purple-600" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center border border-red-200 dark:border-red-900/30">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">This page is for administrators only.</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Contact your system administrator for access.</p>
          </div>
        </div>
      </div>
    );
  }

  const featureList = [
    {
      key: 'dashboard',
      name: 'Dashboard',
      description: 'Main analytics and monitoring dashboard',
      icon: '📊'
    },
    {
      key: 'chatbot',
      name: 'ChatBot',
      description: 'Enable/disable the AI chatbot assistant',
      icon: '🤖'
    },
    {
      key: 'prediction',
      name: 'Prediction Engine',
      description: 'ML-based project risk and cost predictions',
      icon: '🔮'
    },
    {
      key: 'simulation',
      name: 'Simulation',
      description: 'What-if scenario analysis and comparison',
      icon: '🔄'
    },
    {
      key: 'documentExtractor',
      name: 'Document Extractor',
      description: 'PDF and document processing features',
      icon: '📄'
    },
    {
      key: 'history',
      name: 'History & Records',
      description: 'View past predictions and analysis',
      icon: '📜'
    },
    {
      key: 'voiceInput',
      name: 'Voice Input',
      description: 'Speech-to-text input functionality',
      icon: '🎤'
    },
    {
      key: 'advancedMetrics',
      name: 'Advanced Metrics',
      description: 'Detailed analytics and dashboard charts',
      icon: '📈'
    },
    {
      key: 'comparison',
      name: 'Project Comparison',
      description: 'Compare multiple projects side-by-side',
      icon: '⚖️'
    }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Control Panel</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage feature visibility and system toggles</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Feature Toggles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {featureList.map((feature) => (
            <div
              key={feature.key}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{feature.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{feature.description}</p>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {features[feature.key] ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => toggleFeature(feature.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    features[feature.key]
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      features[feature.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={resetToDefault}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={saveFeatures}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>

        {/* Status Card */}
        <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-900 dark:text-purple-200">
            <strong>Status:</strong> {Object.values(features).filter(Boolean).length}/{featureList.length} features enabled
          </p>
        </div>
      </div>
    </div>
  );
}
