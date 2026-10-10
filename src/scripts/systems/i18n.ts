import { createI18nCapability } from '@gaga/engine-web/runtime/i18n';
import { i18nText, isI18nMessageKey, resolveLocale, type GagaLocale } from '../../config/i18n';
import { defaultReaderLanguage, isReaderLanguage } from '../../config/reader';
import { storageKeys } from '../../config/systems';

const fallbackDatasetKeys = {
  id: 'gagaI18nId',
  en: 'gagaI18nEn'
} satisfies Record<GagaLocale, keyof DOMStringMap>;

function localizedDatasetText(node: HTMLElement, language: string) {
  const locale = resolveLocale(language, defaultReaderLanguage);
  return node.dataset[fallbackDatasetKeys[locale]]
    ?? node.dataset[fallbackDatasetKeys[defaultReaderLanguage]];
}

export function initI18n() {
  return createI18nCapability({
    storageKey: storageKeys.language,
    defaultLanguage: defaultReaderLanguage,
    isLanguage: isReaderLanguage,
    getTranslationTargets: () => document.querySelectorAll<HTMLElement>('[data-gaga-i18n-key], [data-gaga-i18n-id]'),
    resolveTranslation(node, language) {
      const key = node.dataset.gagaI18nKey;
      const text = isI18nMessageKey(key) && isReaderLanguage(language)
        ? i18nText(key, resolveLocale(language, defaultReaderLanguage))
        : localizedDatasetText(node, language);
      if (!text) return undefined;
      return { text, target: node.dataset.gagaI18nTarget === 'aria' ? 'aria' : 'text' };
    }
  });
}
