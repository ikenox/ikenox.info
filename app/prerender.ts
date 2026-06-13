import { getAllPostsSlugs } from './repository/posts';

export const getPrerenderPaths = async () => {
  const posts = await getAllPostsSlugs();
  const blogPaths = posts.flatMap(({ slug }) => [
    `/blog/${slug}`,
    `/en/blog/${slug}`,
  ]);
  return ['/', '/rss.xml', '/en', '/en/rss.xml', ...blogPaths];
};
