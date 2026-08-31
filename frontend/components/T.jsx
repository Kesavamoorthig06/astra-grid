import React, { useState, useEffect } from 'react';
import { useGoogleTranslationContext } from '../contexts/TranslationContext';

/**
 * Translation component - automatically translates text using Google Translate API
 * Usage: <T>Hello World</T>
 */
export function T({ children }) {
  const { currentLanguage, translate } = useGoogleTranslationContext();
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
 * Hook for programmatic translation using Google Translate
 * Usage: const { t } = useGoogleTranslate(); const text = await t('Hello');
 */
export function useGoogleTranslate() {
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
