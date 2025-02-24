import { createHighlighter, createHighlighterCore } from 'shiki';
import javascript from '@shikijs/langs/javascript';
import typescript from '@shikijs/langs/typescript';
import shell from '@shikijs/langs/shell';
import java from '@shikijs/langs/java';
import rust from '@shikijs/langs/rust';
import html from '@shikijs/langs/html';
import vim from '@shikijs/langs/vim';
import perl from '@shikijs/langs/perl';
import { join } from 'path';
import { theme } from './myTheme';
import rehypeShikiFromHighlighter from '@shikijs/rehype/core';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type Processor } from 'unified';

export const renderMarkdown = async (
  markdownContent: string
): Promise<string> => {
  const processor = await getProcessor();
  const result = await processor.process(markdownContent);
  console.log('>>>>>>', result);
  return String(result);
};

let _processor: Processor | undefined;
const getProcessor = async (): Promise<Processor> => {
  if (!_processor) {
    _processor = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(
        rehypeShikiFromHighlighter,
        await createHighlighterCore({
          langs: [javascript, typescript, shell, java, rust, html, vim, perl],
        }),
        { theme }
      )
      .use(rehypeStringify);
    // .use(configureExternalLink)
    // .use(await buildHighlighter())
    // .use(convertImageUrl)
    // .use(footnote);
  }
  return _processor;
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
