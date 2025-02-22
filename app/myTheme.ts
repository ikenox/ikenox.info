import type { ThemeRegistration } from 'shiki';

export const theme: ThemeRegistration = {
  colors: {},
  displayName: 'My Theme',
  name: 'my-theme',
  semanticHighlighting: true,
  semanticTokenColors: {},
  tokenColors: [
    { settings: { foreground: '#000000', background: '#FFFFFF' } },
    { scope: 'emphasis', settings: { fontStyle: 'italic' } },
    { scope: 'strong', settings: { fontStyle: 'bold' } },
    { scope: 'header', settings: { foreground: '#0000FF' } },
    { scope: 'comment', settings: { foreground: '#999999' } },
    { scope: 'string', settings: { foreground: '#009933' } },
    {
      scope: ['keyword', 'storage.type', 'support.type'],
      settings: { foreground: '#CC0000' },
    },
    { scope: 'variable', settings: { foreground: '#000000' } },
    { scope: 'constant.numeric', settings: { foreground: '#0000FF' } },
    { scope: 'entity.name.function', settings: { foreground: '#000000' } },
    { scope: 'entity.name.type', settings: { foreground: '#000000' } },
  ],
  type: 'light',
};
