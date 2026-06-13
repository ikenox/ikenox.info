import { Feed } from 'feed';
import { getAllPosts } from '../repository/posts';
import { localeFromPathname } from '../i18n';
import type { Route } from './+types/rss.xml';

export async function loader({ request }: Route.LoaderArgs) {
  const uiLocale = localeFromPathname(new URL(request.url).pathname);
  const posts = await getAllPosts(uiLocale);
  const linkPrefix =
    uiLocale === 'ja' ? 'https://ikenox.info' : 'https://ikenox.info/en';

  const feed = new Feed({
    title: 'ikenox.info',
    id: 'http://ikenox.info/',
    link: 'http://ikenox.info/',
    favicon: 'http://ikenox.info/favicon.ico',
    copyright: 'All rights reserved 2025, Naoto Ikeno',
    author: { name: 'Naoto Ikeno', email: 'ikenox@gmail.com' },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      link: `${linkPrefix}/blog/${post.slug}`,
      ...(post.description ? { description: post.description } : {}),
      date: new Date(`${post.createdAt}T00:00:00+0900`),
    });
  }

  return new Response(feed.rss2(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
