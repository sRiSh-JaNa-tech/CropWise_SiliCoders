import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English (en)' },
  { code: 'hi', label: 'Hindi (hi)' },
  { code: 'bn', label: 'Bengali (bn)' },
  { code: 'mr', label: 'Marathi (mr)' },
  { code: 'ta', label: 'Tamil (ta)' },
  { code: 'te', label: 'Telugu (te)' },
  { code: 'gu', label: 'Gujarati (gu)' },
  { code: 'kn', label: 'Kannada (kn)' },
  { code: 'pa', label: 'Punjabi (pa)' }
];

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="relative flex items-center bg-white/10 rounded-full pr-2 pl-3 py-1.5 border border-white/20 hover:bg-white/20 transition-all shadow-sm">
      <Globe className="w-5 h-5 text-white mr-2 opacity-90" />
      <select 
        value={currentLanguage} 
        onChange={(e) => setLanguage(e.target.value)}
        className="appearance-none bg-transparent text-white text-sm font-bold pr-5 outline-none cursor-pointer [&>option]:text-gray-900"
      >
        {languages.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      <div className="absolute right-3 pointer-events-none text-white text-[10px] opacity-70">▼</div>
    </div>
  );
};
