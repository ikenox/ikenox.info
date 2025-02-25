import { createHighlighterCore } from 'shiki';
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma';
import javascript from '@shikijs/langs/javascript';
import typescript from '@shikijs/langs/typescript';
import shell from '@shikijs/langs/shell';
import java from '@shikijs/langs/java';
import rust from '@shikijs/langs/rust';
import html from '@shikijs/langs/html';
import vim from '@shikijs/langs/vim';
import perl from '@shikijs/langs/perl';
import wasm from 'shiki/wasm';
import { join } from 'path';
import { theme } from './myTheme';
import rehypeShikiFromHighlighter from '@shikijs/rehype/core';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type Processor } from 'unified';
import remarkFrontmatter from 'remark-frontmatter';
import remarkExtractFrontmatter from 'remark-extract-frontmatter';
import yaml from 'yaml';

export type ProcessResult = { content: string; frontMatter: unknown };

export const processMarkdown = async (
  markdownContent: string
): Promise<ProcessResult> => {
  const processor = await getProcessor();
  const result = await processor.process(markdownContent.trim());
  return { content: String(result), frontMatter: result.data['frontMatter'] };
};

let _processor: Processor | undefined;
const getProcessor = async (): Promise<Processor> => {
  if (!_processor) {
    const highlighter = await createHighlighterCore({
      langs: [javascript, typescript, shell, java, rust, html, vim, perl],
      engine: createOnigurumaEngine(wasm),
    });
    _processor = await unified()
      .use(remarkParse)
      .use(remarkFrontmatter, { type: 'yaml', marker: '-' })
      .use(remarkExtractFrontmatter, { yaml: yaml.parse, name: 'frontMatter' })
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeShikiFromHighlighter, highlighter, { theme })
      .use(rehypeStringify)
      .freeze();
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
