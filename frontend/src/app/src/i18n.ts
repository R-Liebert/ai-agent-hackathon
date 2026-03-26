import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend, { HttpBackendOptions } from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
const CURRENT_VERSION = "1.0.88";
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    load: "languageOnly",
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      queryStringParams: { v: CURRENT_VERSION },
    },
    ns: [
      "common",
      "menu-page",
      "dsb-chat",
      "leader-chat",
      "docuscan",
      "dsb-history",
      "meeting-note-generator",
      "job-post-creator",
      "components",
      "workspaces",
      "traffic-information",
      "feedback",
      "anna",
      "allan",
    ],
    defaultNS: "",
    fallbackLng: "en",
    supportedLngs: ["en", "da"],
    debug: false,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
