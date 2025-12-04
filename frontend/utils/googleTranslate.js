// Google Cloud Translation API wrapper
// Uses REST API v2 - requires API key

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || '';
const API_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Translate text using Google Cloud Translation API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (hi, ta, te)
 * @param {string} sourceLang - Source language code (default: en)
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang, sourceLang = 'en') {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.error('Google Translate API key not found. Set VITE_GOOGLE_TRANSLATE_API_KEY in .env');
    return text;
  }

  if (targetLang === 'en' || targetLang === sourceLang) {
    return text;
  }

  try {
    const response = await fetch(`${API_ENDPOINT}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: sourceLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

/**
 * Translate multiple texts in batch
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: en)
 * @returns {Promise<string[]>} Array of translated texts
 */
export async function translateBatch(texts, targetLang, sourceLang = 'en') {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    console.error('Google Translate API key not found');
    return texts;
  }

  if (targetLang === 'en' || targetLang === sourceLang) {
    return texts;
  }

  try {
    const response = await fetch(`${API_ENDPOINT}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: texts,
        target: targetLang,
        source: sourceLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations.map(t => t.translatedText);
  } catch (error) {
    console.error('Translation error:', error);
    return texts;
  }
}

/**
 * Get supported languages
 * @returns {Promise<Array>} List of supported language codes
 */
export async function getSupportedLanguages() {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    return ['en', 'hi', 'ta', 'te'];
  }

  try {
    const response = await fetch(
      `${API_ENDPOINT}/languages?key=${GOOGLE_TRANSLATE_API_KEY}&target=en`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.languages;
  } catch (error) {
    console.error('Error fetching languages:', error);
    return ['en', 'hi', 'ta', 'te'];
  }
}
