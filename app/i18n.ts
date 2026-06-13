export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

/**
 * Determine the UI locale from a URL pathname.
 * English pages live under the `/en` prefix; everything else is Japanese.
 */
export const localeFromPathname = (pathname: string): Locale =>
  /^\/en(\/|$)/.test(pathname) ? 'en' : 'ja';

/**
 * Map a pathname to its counterpart in the given locale, keeping the rest of
 * the path intact. e.g. `/blog/foo` <-> `/en/blog/foo`, `/` <-> `/en`.
 */
export const pathForLocale = (pathname: string, locale: Locale): string => {
  const base = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  if (locale === 'ja') {
    return base;
  }
  return base === '/' ? '/en' : `/en${base}`;
};

type Dict = { siteDescription: string; updated: string };

const dictionaries: Record<Locale, Dict> = {
  ja: {
    siteDescription:
      'ソフトウェアエンジニアリングに関する知見や日々の記録を綴る技術ブログ兼ポートフォリオサイトです。',
    updated: '更新',
  },
  en: {
    siteDescription:
      'A tech blog and portfolio site sharing software engineering insights, experiences, and thoughts.',
    updated: 'Updated',
  },
};

export const t = (locale: Locale): Dict => dictionaries[locale];
