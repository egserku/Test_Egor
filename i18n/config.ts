import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from './locales/ru.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import he from './locales/he.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      fr: { translation: fr },
      he: { translation: he },
    },
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

// Handle RTL
i18n.on('languageChanged', (lng) => {
  document.body.dir = i18n.dir(lng);
  document.documentElement.lang = lng;
});

// Initial direction setting
if (typeof document !== 'undefined') {
  document.body.dir = i18n.dir(i18n.language);
  document.documentElement.lang = i18n.language;
}

export default i18n;
