import { createHighlighter } from 'shiki';
import javascript from '@shikijs/langs/javascript';
import typescript from '@shikijs/langs/typescript';
import shell from '@shikijs/langs/shell';
import java from '@shikijs/langs/java';
import rust from '@shikijs/langs/rust';
import html from '@shikijs/langs/html';
import vim from '@shikijs/langs/vim';
import perl from '@shikijs/langs/perl';
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma';
import wasm from 'shiki/wasm';
import MarkdownIt, { type PluginSimple } from 'markdown-it';
import { fromHighlighter } from '@shikijs/markdown-it/core';
import footnote from 'markdown-it-footnote';
import { join } from 'path';
import { theme } from './myTheme';

export const renderMarkdown = async (
  markdownContent: string
): Promise<string> => {
  const md = await getMarkdownIt();
  return md.render(markdownContent);
};

let md: MarkdownIt | undefined;
const getMarkdownIt = async () => {
  if (!md) {
    md = MarkdownIt()
      .use(configureExternalLink)
      .use(await buildHighlighter())
      .use(convertImageUrl)
      .use(footnote);
  }
  return md;
};

const buildHighlighter = async (): Promise<PluginSimple> => {
  return fromHighlighter(
    await createHighlighter({
      themes: [theme],
      langs: [javascript, typescript, shell, java, rust, html, vim, perl],
      engine: createOnigurumaEngine(wasm),
    }),
    { themes: { light: 'my-theme' } }
  );
};

const configureExternalLink = (md: MarkdownIt) => {
  const defaultLinkOpenRender =
    md.renderer.rules['link_open'] ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options));
  md.renderer.rules['link_open'] = (tokens, idx, options, env, self) => {
    const target = tokens[idx];
    if (target) {
      target.attrSet('target', '_blank');
      target.attrSet('rel', 'noopener');
    }
    return defaultLinkOpenRender(tokens, idx, options, env, self);
  };
};

const convertImageUrl = (md: MarkdownIt) => {
  const defaultImageRender =
    md.renderer.rules.image ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options));
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const target = tokens[idx];
    if (target) {
      const src = target.attrGet('src');
      target.attrSet('width', '100%');
      if (
        src &&
        !src.startsWith('http://') &&
        !src.startsWith('https://') &&
        !src.startsWith('/')
      ) {
        target.attrSet('src', join('/blog-posts', src));
      }
    }
    return defaultImageRender(tokens, idx, options, env, self);
  };
};
