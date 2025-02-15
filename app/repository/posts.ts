import { promises as fs } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { fromHighlighter } from '@shikijs/markdown-it/core';
import markdownit from 'markdown-it';
import { object, string, parse } from 'valibot';
import { createOnigurumaEngine } from '@shikijs/engine-oniguruma';
import darkPlus from '@shikijs/themes/dark-plus';
import javascript from '@shikijs/langs/javascript';
import typescript from '@shikijs/langs/typescript';
import shell from '@shikijs/langs/shell';
import java from '@shikijs/langs/java';
import rust from '@shikijs/langs/rust';
import html from '@shikijs/langs/html';
import vim from '@shikijs/langs/vim';
import perl from '@shikijs/langs/perl';
import { createHighlighter } from 'shiki';
import wasm from 'shiki/wasm';

export interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
}

export const getAllPosts = async (): Promise<Post[]> => {
  const files = await fs.readdir(postsDirectory);
  const posts = (
    await Promise.all(
      files
        .filter((file) => file.endsWith('.md'))
        .map((file) => {
          const slug = file.replace(/\.md$/, '');
          return getPostBySlug(slug);
        })
    )
  ).sort((a, b) => (a.date > b.date ? -1 : 1));

  return posts;
};

export const getPostBySlug = async (slug: string): Promise<Post> => {
  const filePath = join(postsDirectory, `${slug}.md`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  const post = parse(postMetadataSchema, data);

  const highlighter = await createHighlighter({
    themes: [darkPlus],
    langs: [javascript, typescript, shell, java, rust, html, vim, perl],
    engine: createOnigurumaEngine(wasm),
  });
  const md = markdownit();
  md.use(fromHighlighter(highlighter, { themes: { light: 'dark-plus' } }));

  const renderedContent = md.render(content);

  return { slug, title: post.title, date: post.date, content: renderedContent };
};

const postMetadataSchema = object({ title: string(), date: string() });

const postsDirectory = join(process.cwd(), 'app/content/posts');
