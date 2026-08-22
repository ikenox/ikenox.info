import type { ThemeRegistration } from 'shiki';

export const theme: ThemeRegistration = {
  colors: { 'editor.background': '#ffffff', 'editor.foreground': '#000000' },
  displayName: 'My Theme',
  name: 'my-theme',
  semanticHighlighting: true,
  semanticTokenColors: {},
  tokenColors: [
    { settings: { foreground: '#000000', background: '#ffffff' } },
    { scope: 'emphasis', settings: { fontStyle: 'italic' } },
    { scope: 'strong', settings: { fontStyle: 'bold' } },
    { scope: 'comment', settings: { foreground: '#4f6165' } },
    { scope: 'string', settings: { foreground: '#007a00' } },
    {
      scope: ['keyword', 'storage.type', 'support.type'],
      settings: { foreground: '#cc0066' },
    },
    { scope: 'constant.numeric', settings: { foreground: '#0000cc' } },
    { scope: 'variable', settings: { foreground: '#000000' } },
    { scope: 'entity.name.function', settings: { foreground: '#00688f' } },
    { scope: 'entity.name.type', settings: { foreground: '#cc3300' } },
  ],
  type: 'light',
};
