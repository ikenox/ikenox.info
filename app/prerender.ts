import { getAllPostsSlugs } from './repository/posts';

export const getPrerenderPaths = async () => {
  const posts = await getAllPostsSlugs();
  const blogPaths = posts.flatMap(({ slug, hasEn }) =>
    // Only generate an /en page for posts that actually have an English variant.
    hasEn ? [`/blog/${slug}`, `/en/blog/${slug}`] : [`/blog/${slug}`]
  );
  return ['/', '/rss.xml', '/en', '/en/rss.xml', ...blogPaths];
};
