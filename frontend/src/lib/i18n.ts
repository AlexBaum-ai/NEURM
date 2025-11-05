import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enNews from '../locales/en/news.json';
import enForum from '../locales/en/forum.json';
import enJobs from '../locales/en/jobs.json';

import nlCommon from '../locales/nl/common.json';
import nlAuth from '../locales/nl/auth.json';
import nlNews from '../locales/nl/news.json';
import nlForum from '../locales/nl/forum.json';
import nlJobs from '../locales/nl/jobs.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    news: enNews,
    forum: enForum,
    jobs: enJobs,
  },
  nl: {
    common: nlCommon,
    auth: nlAuth,
    news: nlNews,
    forum: nlForum,
    jobs: nlJobs,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: ['en', 'nl'],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
