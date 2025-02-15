import { getAllPostsSlugs } from './repository/posts';

export const getPrerenderPaths = async () => {
  const posts = await getAllPostsSlugs();
  return ['/', '/rss.xml', ...posts.map(({ slug }) => `/blog/${slug}`)];
};
