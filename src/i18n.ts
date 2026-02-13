"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LngDetector from "i18next-browser-languagedetector";
import en from "./assets/i18n/en.json";
import de from "./assets/i18n/de.json";

const lngDetector = new LngDetector(null, {
  caches: [],
});

if (!i18n.isInitialized) {
  i18n
    .use(lngDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      debug: false,
      resources: {
        en: { translation: en },
        de: { translation: de },
      },
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
