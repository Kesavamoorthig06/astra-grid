import React, { useState, useEffect } from 'react';
import { useTranslation as useGoogleTranslation } from '../contexts/TranslationContext';

/**
 * Translation component - automatically translates text using Google Translate API
 * Usage: <T>Hello World</T>
 */
export function T({ children }) {
  const { currentLanguage, translate } = useGoogleTranslation();
  const [translatedText, setTranslatedText] = useState(children);

  useEffect(() => {
    if (currentLanguage === 'en' || !children) {
      setTranslatedText(children);
      return;
    }

    translate(children).then(setTranslatedText);
  }, [children, currentLanguage, translate]);

  return <>{translatedText}</>;
}

/**
 * Hook for programmatic translation
 * Usage: const { t } = useTranslation(); const text = await t('Hello');
 */
export function useTranslation() {
  const { currentLanguage, translate } = useGoogleTranslation();

  return {
    t: (text) => {
      if (currentLanguage === 'en') return text;
      return translate(text);
    },
    i18n: {
      language: currentLanguage,
    }
  };
}
