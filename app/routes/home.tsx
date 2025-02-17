import type { Route } from './+types/home';
import { getAllPosts } from '../repository/posts';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'ikenox.info' }];
}

export async function loader() {
  return { posts: await getAllPosts() };
}

export default function Home({ loaderData: { posts } }: Route.ComponentProps) {
  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.date}>{post.date}</time>{' '}
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
