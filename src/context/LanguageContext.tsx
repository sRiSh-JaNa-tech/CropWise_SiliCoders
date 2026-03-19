import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  setLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Auto Language Detection
  useEffect(() => {
    try {
      const browserLang = navigator.language.split('-')[0] || 'en';
      const supported = ['en', 'hi', 'bn', 'mr', 'ta', 'te', 'pa', 'gu', 'kn'];
      const cachedLang = localStorage.getItem('user_language_preference');

      if (cachedLang && supported.includes(cachedLang as string)) {
          setCurrentLanguage(cachedLang as string);
          // Pre-trigger on load
          setTimeout(() => handleSetLanguage(cachedLang as string), 1500);
      } else if (supported.includes(browserLang)) {
          setCurrentLanguage(browserLang);
      }
    } catch(e) {}
  }, []);

  const handleSetLanguage = (lang: string) => {
      setCurrentLanguage(lang);
      localStorage.setItem('user_language_preference', lang);

      // Trigger Full-Page Google Translate DOM
      setTimeout(() => {
        const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectField) {
          selectField.value = lang;
          selectField.dispatchEvent(new Event('change'));
        }
      }, 100);
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
