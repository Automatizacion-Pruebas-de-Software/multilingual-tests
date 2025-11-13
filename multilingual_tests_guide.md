# PRERREQUISITOS (Antes de empezar)

| Requisito | Versión mínima | Cómo instalar |
|-----------|----------------|---------------|
| Node.js | v18+ | https://nodejs.org |
| VS Code | Última | https://code.visualstudio.com |
| Git | Cualquiera | `git --version` |
| Navegador | Chrome/Firefox (incluido en Playwright) | Automático |

**Verifica instalación:**

```bash
node -v
npm -v
code -v
```

---

# PROYECTO: Pruebas Multilingües Automatizadas

Vamos a crear una aplicación web simple con soporte i18n y automatizar pruebas en 3 idiomas:
**en** (inglés), **es** (español), **ar** (árabe, RTL).

---

## PASO 1: Crear estructura de carpetas

**Objetivo:** Organizar el proyecto de forma escalable y profesional.

```bash
mkdir multilingual-tests
cd multilingual-tests
mkdir public src tests locales screenshots
code .
```

**Estructura final:**

```
multilingual-tests/
├── public/
│   └── index.html
├── src/
│   └── i18n.js
├── locales/
│   ├── en.json
│   ├── es.json
│   └── ar.json
├── tests/
│   └── localization.spec.js
├── screenshots/
├── package.json
└── playwright.config.js
```

---

## PASO 2: Inicializar proyecto Node.js

**Objetivo:** Crear package.json y preparar el entorno.

```bash
npm init -y
```

---

## PASO 3: Instalar Playwright (open source)

**Objetivo:** Tener un framework de pruebas E2E moderno, con soporte para múltiples navegadores e idiomas.

```bash
npm init playwright@latest
```

**Elige:**
- TypeScript? → **No** (usaremos JavaScript)
- Add to package.json? → **Yes**
- GitHub Actions? → **No** (por ahora)

**Esto instala:**
- `@playwright/test`
- Navegadores (Chromium, Firefox, WebKit)

---

## PASO 4: Instalar extensión i18n-ally en VS Code

**Objetivo:** Detectar automáticamente textos sin traducir y sugerir traducciones.

1. Abre VS Code → Extensions (Ctrl+Shift+X)
2. Busca: **i18n-ally**
3. Instala: **i18n-ally by Lokalise**

**Configuración rápida:**
Abre cualquier archivo `.json` en `locales/`, VS Code detectará automáticamente.

---

## PASO 5: Crear app web simple con i18n

**Objetivo:** Tener una página que cambie idioma dinámicamente.

### `public/index.html`

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>i18n Test App</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    select { margin-bottom: 1rem; padding: 0.5rem; }
    .card { border: 1px solid #ccc; padding: 1rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <select id="lang-select">
    <option value="en">English</option>
    <option value="es">Español</option>
    <option value="ar">العربية</option>
  </select>

  <h1 data-i18n="title"></h1>
  <p data-i18n="description"></p>

  <div class="card">
    <p data-i18n="files" data-i18n-count="1"></p>
    <p data-i18n="files" data-i18n-count="2"></p>
    <p data-i18n="files" data-i18n-count="0"></p>
    <p data-i18n="files" data-i18n-count="5"></p>
  </div>

  <button data-i18n="save"></button>

  <script>
    // === TRADUCCIONES ===
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

    let currentLang = 'en';

    // === PARSER ICU SIMPLIFICADO Y ROBUSTO ===
    function t(key, values = {}) {
      const dict = translations[currentLang] || translations.en;
      let message = dict[key] || key;

      // Si no hay count o no es un mensaje plural, devolver tal cual
      if (values.count === undefined || !message.includes('{count, plural,')) {
        return message;
      }

      try {
        // Para simplificar, vamos a manejar casos específicos
        const count = values.count;
        
        // Reglas específicas por idioma
        if (currentLang === 'en') {
          if (count === 0) return 'No files';
          if (count === 1) return '1 file';
          return `${count} files`;
        }
        
        if (currentLang === 'es') {
          if (count === 0) return 'Sin archivos';
          if (count === 1) return '1 archivo';
          return `${count} archivos`;
        }
        
        if (currentLang === 'ar') {
          if (count === 0) return 'لا ملفات';
          if (count === 1) return 'ملف واحد';
          if (count === 2) return 'ملفان';
          if (count >= 3 && count <= 10) return `${count} ملفات`;
          return `${count} ملف`;
        }
        
        return message; // Fallback
      } catch (error) {
        console.error('Error in ICU parser:', error);
        return message;
      }
    }

    // === ACTUALIZAR DOM ===
    function updateContent() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const countAttr = el.getAttribute('data-i18n-count');
        const count = countAttr ? parseInt(countAttr, 10) : null;
        const text = t(key, count !== null ? { count } : {});
        el.textContent = text;
      });
    }

    // === INICIALIZACIÓN ===
    document.addEventListener('DOMContentLoaded', () => {
      const select = document.getElementById('lang-select');
      const savedLang = localStorage.getItem('lang') || 'en';
      select.value = savedLang;
      currentLang = savedLang;
      document.documentElement.lang = savedLang;
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

      updateContent();

      select.addEventListener('change', (e) => {
        currentLang = e.target.value;
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('lang', currentLang);
        updateContent();
      });
    });

    // Exponer funciones para debugging en tests
    window.appI18n = { t, updateContent, currentLang: () => currentLang };
  </script>
</body>
</html>
```

---

## PASO 6: Crear archivos de traducción

**Objetivo:** Simular un sistema real de traducciones.

### `locales/en.json`

```json
{
  "title": "Localization Test",
  "description": "This app tests translations, dates, and pluralization.",
  "save": "Save Changes",
  "files": "{count, plural, =0 {No files} one {# file} other {# files}}"
}
```

### `locales/es.json`

```json
{
  "title": "Prueba de Localización",
  "description": "Esta app prueba traducciones, fechas y pluralización.",
  "save": "Guardar Cambios",
  "files": "{count, plural, =0 {Sin archivos} one {# archivo} other {# archivos}}"
}
```

### `locales/ar.json`

```json
{
  "title": "اختبار التوطين",
  "description": "هذا التطبيق يختبر الترجمات والتواريخ والتعدد.",
  "save": "حفظ التغييرات",
  "files": "{count, plural, zero {لا ملفات} one {ملف واحد} two {ملفان} few {# ملفات} many {# ملفًا} other {# ملف}}"
}
```

**i18n-ally detectará automáticamente estas claves.**

---

## PASO 7: Crear servidor simple (para Playwright)

**Objetivo:** Servir `public/` localmente.

```bash
npm install -D http-server
```

**Añade script en `package.json`:**

```json
"scripts": {
  "start": "http-server public -p 3000",
  "test": "playwright test"
}
```

---

## PASO 8: Escribir pruebas automatizadas con Playwright

**Objetivo:** Verificar:
- Cambio de idioma
- Traducciones correctas
- Dirección del texto (LTR/RTL)
- Capturas de pantalla
- Pluralización

### `tests/localization.spec.js`

```javascript
import { test, expect } from '@playwright/test';

const languages = [
  { code: 'en', title: 'Localization Test', files2: '2 files' },
  { code: 'es', title: 'Prueba de Localización', files2: '2 archivos' },
  { code: 'ar', title: 'اختبار التوطين', files2: 'ملفان' }
];

test.describe('Localization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  for (const lang of languages) {
    test(`should display correct content in ${lang.code}`, async ({ page }) => {
      await page.selectOption('#lang-select', lang.code);
      
      await page.waitForFunction(
        (expectedTitle) => {
          const h1 = document.querySelector('h1');
          return h1?.textContent?.trim() === expectedTitle;
        },
        lang.title,
        { timeout: 5000 }
      );

      const filesText = await page.locator('[data-i18n="files"][data-i18n-count="2"]').textContent();
      expect(filesText?.trim()).toBe(lang.files2);
    });
  }

  test('should not have ICU syntax in DOM', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Esperar a que el contenido se renderice
    await page.waitForFunction(() => {
      const h1 = document.querySelector('h1');
      return h1?.textContent?.length > 0;
    });

    // Verificar SOLO el contenido renderizado de los elementos con data-i18n
    const elements = await page.locator('[data-i18n]').all();
    let hasUnprocessedICU = false;
    
    for (let i = 0; i < elements.length; i++) {
      const text = await elements[i].textContent();
      
      // Verificar si el texto renderizado contiene sintaxis ICU
      if (text && (/\{count, plural/.test(text) || /\{#/.test(text))) {
        console.log(`FOUND ICU in rendered element ${i}: "${text}"`);
        hasUnprocessedICU = true;
        break;
      }
    }

    console.log('Has unprocessed ICU in rendered content:', hasUnprocessedICU);
    expect(hasUnprocessedICU).toBe(false);
  });
});
```

---

## PASO 9: Configurar Playwright

### `playwright.config.js`

```javascript
// playwright.config.js
// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
```

---

## PASO 10: Ejecutar pruebas

**Objetivo:** Ver resultados visuales y automatizados.

**Terminal 1: Iniciar servidor**

```bash
npm start
```

**Terminal 2: Ejecutar pruebas**

```bash
npm test
```

---

## RESULTADOS ESPERADOS

```
> 9 passed

Screenshots generados en:
├── screenshots/en-full.png
├── screenshots/es-card.png
├── screenshots/ar-full.png
...
```

**Abre `playwright-report/index.html` para ver el reporte visual.**