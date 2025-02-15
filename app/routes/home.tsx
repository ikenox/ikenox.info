import type { Route } from './+types/home';
import { getAllPosts } from '../repository/posts';

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
            <a href={`/blog/${post.slug}`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
