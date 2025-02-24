import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('blog/:slug', 'routes/blog-post.tsx'),
  route('rss.xml', 'routes/rss.xml.tsx'),
] satisfies RouteConfig;
