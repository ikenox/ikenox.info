import { getPostBySlug } from '~/repository/posts';
import type { Route } from './+types/blog-post';

export async function loader({ params }: Route.LoaderArgs) {
  return { post: await getPostBySlug(params.slug) };
}

export default async function Post({
  loaderData: { post },
}: Route.ComponentProps) {
  return (
    <article>
      <h1>{post.title}</h1>
      <time dateTime={post.date}>{post.date}</time>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
