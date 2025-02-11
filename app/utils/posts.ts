import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
}

const postsDirectory = join(process.cwd(), 'app/content/posts');

export function getAllPosts(): Post[] {
  const files = readdirSync(postsDirectory);
  const posts = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      return getPostBySlug(slug);
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  return posts;
}

export function getPostBySlug(slug: string): Post {
  const filePath = join(postsDirectory, `${slug}.md`);
  const fileContent = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title,
    date: data.date.toISOString().split('T')[0],
    content: marked(content),
  };
}
