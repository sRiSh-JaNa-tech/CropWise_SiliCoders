import { staticTranslations } from '../locales/translations';

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (!text || targetLang === 'en') return text;
  
  // Intercept via static dictionary if available
  if (staticTranslations[targetLang] && staticTranslations[targetLang][text]) {
      return staticTranslations[targetLang][text];
  }

  // Safe caching key replacing spaces
  const safeTextKey = text.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
  const cacheKey = `translation_en_${targetLang}_${safeTextKey}`;
  
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });
    
    if (!response.ok) return text;
    
    const data = await response.json();
    if (data.translatedText && data.translatedText.trim() !== '') {
      localStorage.setItem(cacheKey, data.translatedText);
      return data.translatedText;
    }
    return text;
  } catch (error) {
    console.error('Translation API call failed. Offline or Server Unreachable, falling back to English.', error);
    return text; // Graceful fallback
  }
};
