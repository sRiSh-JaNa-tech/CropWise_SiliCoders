import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { translateText } from '../utils/translateText';

interface AutoTranslateProps {
  text: string;
}

export const AutoTranslate: React.FC<AutoTranslateProps> = ({ text }) => {
  const { currentLanguage } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let isMounted = true;

    // Quick escape if translating to english or empty text
    if (!text || currentLanguage === 'en') {
      setTranslated(text);
      return;
    }

    const performTranslation = async () => {
      const result = await translateText(text, currentLanguage);
      if (isMounted) {
        setTranslated(result);
      }
    };

    performTranslation();

    return () => { isMounted = false; };
  }, [text, currentLanguage]);

  return <>{translated}</>;
};
