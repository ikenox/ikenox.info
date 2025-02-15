import { getPostBySlug } from '../repository/posts';
import type { Route } from './+types/blog-post';
import { data } from 'react-router';

export function meta({ data: { post } }: Route.MetaArgs) {
  return [
    { title: post.title },
    { property: 'og:title', content: post.title },
    { property: 'twitter:title', content: post.title },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    throw data('Post not found', { status: 404 });
  }
  return { post };
}

export default async function Post({
  loaderData: { post },
}: Route.ComponentProps) {
  return (
    <article>
      <h1>{post.title}</h1>
      <p>
        <time dateTime={post.date}>{post.date}</time>
      </p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
