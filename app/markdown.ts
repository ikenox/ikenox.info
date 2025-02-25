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
import rehypeExternalLinks from 'rehype-external-links';
import { unified, type Plugin, type Processor } from 'unified';
import remarkFrontmatter from 'remark-frontmatter';
import remarkExtractFrontmatter from 'remark-extract-frontmatter';
import yaml from 'yaml';
import { visit } from 'unist-util-visit';
import type { Node } from 'unist';
import type { Element } from 'hast';

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
    _processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, { type: 'yaml', marker: '-' })
      .use(remarkExtractFrontmatter, { yaml: yaml.parse, name: 'frontMatter' })
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeShikiFromHighlighter, highlighter, { theme })
      .use(rehypeExternalLinks, {
        target: '_blank',
        rel: 'nofollow noopener noreferrer',
      })
      .use(rewriteImageUrl)
      .use(changeFootnoteStyle)
      .use(rehypeStringify)
      .freeze();
  }
  return _processor;
};

const changeFootnoteStyle: Plugin = () => {
  return (tree) =>
    visit(tree, 'element', (node: Element) => {
      if (node.properties['dataFootnotes']) {
        console.log(node);
        const elem = node.children
          .filter((e) => e.type === 'element')
          .find((e) => e.tagName === 'h2');
        if (elem) {
          elem.tagName = 'hr';
          elem.properties = {};
          elem.children = [];
        }
      }
    });
};

const rewriteImageUrl: Plugin = () => {
  return (tree) =>
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img') {
        const src = node.properties['src'];
        if (
          typeof src === 'string' &&
          !src.startsWith('http://') &&
          !src.startsWith('https://') &&
          !src.startsWith('/')
        ) {
          node.properties['src'] = join('/blog-posts', src);
        }
      }
    });
};
