import { Feed } from 'feed';
import { getAllPosts } from '../repository/posts';

export async function loader() {
  const posts = await getAllPosts();

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
      link: `https://ikenox.info/blog/${post.slug}`,
      ...(post.description ? { description: post.description } : {}),
      date: new Date(`${post.date}T00:00:00+0900`),
    });
  }

  return new Response(feed.rss2(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
