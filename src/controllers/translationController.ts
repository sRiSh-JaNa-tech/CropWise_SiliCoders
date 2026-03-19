import { Request, Response } from 'express';
import { translationService } from '../services/translationService/translationService.js';

export const translate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing text or targetLang' });
    }

    // Fast-path: no translation needed for English (if base is English)
    if (targetLang === 'en') {
        return res.status(200).json({ translatedText: text });
    }

    const translatedText = await translationService.translateText(text, targetLang);
    return res.status(200).json({ translatedText });
  } catch (error) {
    console.error('Error in translate controller:', error);
    return res.status(500).json({ error: 'Translation failed' });
  }
};
