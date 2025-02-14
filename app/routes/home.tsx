import type { Route } from './+types/home';
import { getAllPosts } from '~/repository/posts';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'ikenox.info' }];
}

export async function loader() {
  return { posts: await getAllPosts() };
}

export default function Home({ loaderData: { posts } }: Route.ComponentProps) {
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
