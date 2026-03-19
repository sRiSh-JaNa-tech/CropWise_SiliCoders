import fetch from 'node-fetch';

export class TranslationService {
  async translateText(text: string, targetLang: string): Promise<string> {
    try {
      // Using a free Google API endpoint for development.
      // In production, you would swap this out for the official Google Cloud Translation API.
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: any = await response.json();
      
      // Response format: [[[ "translated text", "original text", null, null, 1 ]], null, "en"]
      if (data && data[0] && Array.isArray(data[0])) {
        return data[0].map((item: any) => item[0]).join('');
      }
      return text;
    } catch (err) {
      console.error('Translation API error:', err);
      // Fallback to English/original text on failure
      return text;
    }
  }
}

export const translationService = new TranslationService();
