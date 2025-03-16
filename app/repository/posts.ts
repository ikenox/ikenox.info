import { promises as fs } from 'fs';
import { join } from 'path';
import { object, optional, parse, string } from 'valibot';
import { processMarkdown } from '../markdown';

export interface Post {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt?: string | undefined;
  content: string;
  description?: string | undefined;
}

export const getAllPostsSlugs = async () => {
  const files = await fs.readdir(postsDirectory);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ file, slug: file.replace(/\.md$/, '') }));
};

export const getAllPosts = async (): Promise<Post[]> => {
  const posts = await getAllPostsSlugs();
  return (
    await Promise.all(
      posts.map(({ slug }) => {
        return getPostBySlug(slug);
      })
    )
  )
    .filter((post) => post != null)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
};

export const getPostBySlug = async (
  slug: string
): Promise<Post | undefined> => {
  const filePath = join(postsDirectory, `${slug}.md`);
  const fileContent = await fs
    .readFile(filePath, 'utf-8')
    .catch((e: unknown) => {
      if (e instanceof Error && e.message.includes('ENOENT')) {
        return undefined;
      }
      throw e;
    });
  if (!fileContent) {
    return undefined;
  }
  const { content, description, frontMatter } =
    await processMarkdown(fileContent);
  const meta = parse(postMetadataSchema, frontMatter);

  return {
    slug,
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
