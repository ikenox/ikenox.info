import type { Config } from '@react-router/dev/config';
import { getAllPostsSlugs } from './app/repository/posts';

export default {
  ssr: true,
  prerender: async () => {
    const posts = await getAllPostsSlugs();
    return posts.map(({ slug }) => `/blog/${slug}`);
  },
} satisfies Config;
