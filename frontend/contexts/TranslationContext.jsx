import React, { createContext, useContext, useState, useEffect } from 'react';
import { translateText, translateBatch } from '../utils/googleTranslate';

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );
  const [translationCache, setTranslationCache] = useState({});

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  };

  const translate = async (text) => {
    if (currentLanguage === 'en') return text;

    // Check cache first
    const cacheKey = `${text}_${currentLanguage}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Translate and cache
    const translated = await translateText(text, currentLanguage);
    setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }));
    return translated;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    translate,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useGoogleTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useGoogleTranslationContext must be used within TranslationProvider');
  }
  return context;
}
