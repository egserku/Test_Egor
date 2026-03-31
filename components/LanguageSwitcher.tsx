import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' }
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
            i18n.language === lang.code
              ? 'bg-white text-indigo-600 shadow-lg scale-105 font-bold'
              : 'text-white hover:bg-white/10 hover:scale-105'
          }`}
          title={lang.name}
        >
          <span className="text-lg">{lang.flag}</span>
          <span className="text-xs font-bold uppercase hidden md:inline">{lang.code}</span>
        </button>
      ))}
    </div>
  );
};
