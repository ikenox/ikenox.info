import type { Route } from './+types/home';
import { getAllPosts } from '~/utils/posts';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export default function Home() {
  const posts = getAllPosts();

  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <a href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
              <time dateTime={post.date}>{post.date}</time>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
