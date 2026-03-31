import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ru', name: 'Русский', countryCode: 'ru' },
  { code: 'en', name: 'English', countryCode: 'us' },
  { code: 'fr', name: 'Français', countryCode: 'fr' },
  { code: 'he', name: 'עברית', countryCode: 'il' }
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2 md:gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`flex items-center justify-center px-3 md:px-2 py-2 md:py-1.5 rounded-xl transition-all duration-300 ${
            i18n.language === lang.code
              ? 'bg-white shadow-lg scale-110'
              : 'hover:bg-white/20 hover:scale-105 opacity-70 hover:opacity-100'
          }`}
          title={lang.name}
        >
          <img 
            src={`https://flagcdn.com/w40/${lang.countryCode}.png`} 
            alt={lang.name}
            className="w-7 h-5 md:w-6 md:h-4 object-cover rounded-sm shadow-sm"
          />
        </button>
      ))}
    </div>
  );
};
