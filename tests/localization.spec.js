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