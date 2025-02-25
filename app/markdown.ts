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
import { type Plugin, unified } from 'unified';
import remarkFrontmatter from 'remark-frontmatter';
import remarkExtractFrontmatter from 'remark-extract-frontmatter';
import yaml from 'yaml';
import { visit } from 'unist-util-visit';
import type { Element, Text } from 'hast';

import { object, record, parse, unknown, string, undefinedable } from 'valibot';

export type ProcessResult = {
  content: string;
  frontMatter: unknown;
  description: string | undefined;
};

export const processMarkdown = async (
  markdownContent: string
): Promise<ProcessResult> => {
  const processor = await getProcessor();
  const result = await processor.process(markdownContent.trim());
  const data = parse(ProcessResultDataSchema, result.data);
  return {
    content: String(result),
    frontMatter: data.frontMatter,
    description: data.description,
  };
};

const ProcessResultDataSchema = object({
  frontMatter: record(string(), unknown()),
  description: undefinedable(string()),
});

type Processor =
  ReturnType<typeof createProcessor> extends Promise<infer T> ? T : never;
let _processor: Processor | undefined;
const getProcessor = async (): Promise<Processor> => {
  if (!_processor) {
    _processor = await createProcessor();
  }
  return _processor;
};

const createProcessor = async () => {
  const highlighter = await createHighlighterCore({
    langs: [javascript, typescript, shell, java, rust, html, vim, perl],
    engine: createOnigurumaEngine(wasm),
  });
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, { type: 'yaml', marker: '-' })
    .use(remarkExtractFrontmatter, { yaml: yaml.parse, name: 'frontMatter' })
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShikiFromHighlighter, highlighter as never, {
      theme,
      defaultLanguage: 'text',
    })
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: 'nofollow noopener noreferrer',
    })
    .use(rewriteImageUrl)
    .use(changeFootnoteStyle)
    .use(buildDescription)
    .use(rehypeStringify)
    .freeze();
};

const buildDescription: Plugin = () => {
  return (tree, file) => {
    let text = '';
    visit(tree, 'text', (t: Text) => {
      text += t.value;
      return text.length < 100;
    });
    if (text) {
      file.data['description'] = `${text}...`;
    }
  };
};

const changeFootnoteStyle: Plugin = () => {
  return (tree) =>
    visit(tree, 'element', (node: Element) => {
      // 1 -> [1]
      if (node.properties['dataFootnoteRef']) {
        visit(node, 'text', (text: Text) => {
          text.value = `[${text.value}]`;
        });
        return;
      }

      // Replace footnote section header with just a horizontal line
      if (node.properties['dataFootnotes']) {
        const elem = node.children
          .filter((e) => e.type === 'element')
          .find((e) => e.tagName === 'h2');
        if (elem) {
          elem.tagName = 'hr';
          elem.properties = {};
          elem.children = [];
        }
        return;
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
