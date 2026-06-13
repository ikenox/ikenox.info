import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  // Japanese (default, no prefix)
  index('routes/home.tsx'),
  route('blog/:slug', 'routes/blog-post.tsx'),
  route('rss.xml', 'routes/rss.xml.tsx'),
  // English (/en prefix). Same modules, distinguished by route id.
  route('en', 'routes/home.tsx', { id: 'home-en' }),
  route('en/blog/:slug', 'routes/blog-post.tsx', { id: 'blog-post-en' }),
  route('en/rss.xml', 'routes/rss.xml.tsx', { id: 'rss-en' }),
] satisfies RouteConfig;
