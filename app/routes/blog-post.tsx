import { getPostBySlug } from '../repository/posts';
import type { Route } from './+types/blog-post';
import { data, redirect, useLocation } from 'react-router';
import React from 'react';
import { TweetButton } from '../components/TweetButton';

export function meta({ data: { post } }: Route.MetaArgs) {
  return [
    { title: post.title },
    { property: 'og:title', content: post.title },
    { property: 'twitter:title', content: post.title },
  ];
}

const redirects: Record<string, string> = {
  'made-corne-keyboard': 'corne-keyboard',
  'getting-started-ideavim': 'ideavim-getting-started-en',
  'ideavim-introduction': 'ideavim-getting-started',
  'inheritance-and-delegation-and-interface':
    'inheritance-delegation-interface',
  'database-is-like-global-variable': 'repository-pattern',
  'where-to-put-validation-in-clean-architecture':
    'validation-in-clean-architecture',
  'validation-in-clean-arch': 'validation-in-clean-architecture',
};

export async function loader({ params }: Route.LoaderArgs) {
  const newPath = redirects[params.slug];
  if (newPath) {
    return redirect(`/blog/${newPath}`);
  }

  const post = await getPostBySlug(params.slug);
  if (!post) {
    throw data('Post not found', { status: 404 });
  }
  return { post };
}

export default function Post({ loaderData: { post } }: Route.ComponentProps) {
  const location = useLocation();
  const url = new URL(location.pathname, 'https://ikenox.info').toString();
  return (
    <article>
      <h1>{post.title}</h1>
      <p>
        <time dateTime={post.date}>{post.date}</time>
      </p>
      <p>
        <TweetButton url={url} text={post.title}></TweetButton>
      </p>

      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
