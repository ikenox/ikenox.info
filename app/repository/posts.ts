import { promises as fs } from 'fs';
import { join } from 'path';
import { object, optional, parse, string } from 'valibot';
import { processMarkdown } from '../markdown';
import type { Locale } from '../i18n';

export interface Post {
  slug: string;
  /** Locale requested via the URL (drives UI labels, header, etc.) */
  uiLocale: Locale;
  /** Locale of the content actually shown (`ja` when an en page falls back) */
  contentLocale: Locale;
  /** Whether an English variant (`<slug>.en.md`) exists for this post */
  hasEn: boolean;
  title: string;
  createdAt: string;
  updatedAt?: string | undefined;
  content: string;
  description?: string | undefined;
}

/** Logical slugs of all posts. Japanese (`<slug>.md`) is the base; `.en.md` are variants. */
export const getAllPostsSlugs = async () => {
  const files = await fs.readdir(postsDirectory);
  return files
    .filter((file) => file.endsWith('.md') && !file.endsWith('.en.md'))
    .map((file) => ({ file, slug: file.replace(/\.md$/, '') }));
};

export const getAllPosts = async (uiLocale: Locale): Promise<Post[]> => {
  const posts = await getAllPostsSlugs();
  return (
    await Promise.all(posts.map(({ slug }) => getPostBySlug(slug, uiLocale)))
  )
    .filter((post) => post != null)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
};

const readPostFile = async (fileName: string): Promise<string | undefined> => {
  return fs
    .readFile(join(postsDirectory, fileName), 'utf-8')
    .catch((e: unknown) => {
      if (e instanceof Error && e.message.includes('ENOENT')) {
        return undefined;
      }
      throw e;
    });
};

export const getPostBySlug = async (
  slug: string,
  uiLocale: Locale
): Promise<Post | undefined> => {
  const [jaContent, enContent] = await Promise.all([
    readPostFile(`${slug}.md`),
    readPostFile(`${slug}.en.md`),
  ]);

  // Japanese is the base; a post must have it to exist.
  if (!jaContent) {
    return undefined;
  }

  const hasEn = enContent != null;
  const useEn = uiLocale === 'en' && hasEn;
  const contentLocale: Locale = useEn ? 'en' : 'ja';
  const rawContent = useEn ? enContent! : jaContent;

  const { content, description, frontMatter } =
    await processMarkdown(rawContent);
  const meta = parse(postMetadataSchema, frontMatter);

  return {
    slug,
    uiLocale,
    contentLocale,
    hasEn,
    title: meta.title,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    description,
    content,
  };
};

const postMetadataSchema = object({
  title: string(),
  createdAt: string(),
  updatedAt: optional(string()),
});

const postsDirectory = join(process.cwd(), './blog-posts');
