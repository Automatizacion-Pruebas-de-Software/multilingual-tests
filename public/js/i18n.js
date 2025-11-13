// public/js/i18n.js
import formatMessage from 'format-message';

// Configurar locale global
let currentLocale = 'en';

const translations = {
  en: {
    title: "Localization Test",
    description: "This app tests translations, dates, and pluralization.",
    save: "Save Changes",
    files: "{count, plural, =0 {No files} one {# file} other {# files}}"
  },
  es: {
    title: "Prueba de Localización",
    description: "Esta app prueba traducciones, fechas y pluralización.",
    save: "Guardar Cambios",
    files: "{count, plural, =0 {Sin archivos} one {# archivo} other {# archivos}}"
  },
  ar: {
    title: "اختبار التوطين",
    description: "هذا التطبيق يختبر الترجمات والتواريخ والتعدد.",
    save: "حفظ التغييرات",
    files: "{count, plural, zero {لا ملفات} one {ملف واحد} two {ملفان} few {# ملفات} many {# ملفًا} other {# ملف}}"
  }
};

// Cache de mensajes
const cache = new Map();

function t(key, values = {}) {
  const dict = translations[currentLocale] || translations.en;
  const message = dict[key] || key;

  const cacheKey = `${currentLocale}:${key}`;
  let formatter = cache.get(cacheKey);

  if (!formatter) {
    formatter = formatMessage.setup({ locale: currentLocale });
    const parsed = formatMessage.parse(message);
    formatter = (vals) => formatMessage.format(parsed, vals);
    cache.set(cacheKey, formatter);
  }

  return formatter(values);
}

function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const count = el.hasAttribute('data-i18n-count') ? parseInt(el.getAttribute('data-i18n-count')) : null;
    el.textContent = t(key, count !== null ? { count } : {});
  });
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('lang-select');
  if (!select) return;

  const savedLang = localStorage.getItem('lang') || 'en';
  select.value = savedLang;
  currentLocale = savedLang;
  document.documentElement.lang = savedLang;
  document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

  updateContent();

  select.addEventListener('change', (e) => {
    const lang = e.target.value;
    currentLocale = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
    cache.clear(); // Limpiar cache al cambiar idioma
    updateContent();
  });
});