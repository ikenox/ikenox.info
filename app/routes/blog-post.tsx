import { getPostBySlug } from '~/repository/posts';
import type { Route } from './+types/blog-post';

export function meta({ data: { post } }: Route.MetaArgs) {
  return [
    { title: post.title },
    { property: 'og:title', content: post.title },
    { property: 'twitter:title', content: post.title },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  return { post: await getPostBySlug(params.slug) };
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
