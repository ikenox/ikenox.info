import { getPostBySlug } from '~/utils/posts';
import type { Route } from './+types/blog.$slug';

export default function Post({ params }: Route.LoaderArgs) {
  const post = getPostBySlug(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <time dateTime={post.date}>{post.date}</time>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
