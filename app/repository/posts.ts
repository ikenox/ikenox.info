import { promises as fs } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { object, string, parse, date } from 'valibot';

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

  return {
    slug,
    title: post.title,
    date: post.date.toISOString().split('T')[0]!,
    content: await marked(content),
  };
};

const postMetadataSchema = object({ title: string(), date: date() });

const postsDirectory = join(process.cwd(), 'app/content/posts');
