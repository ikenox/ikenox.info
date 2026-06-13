import { getPostBySlug } from '../repository/posts';
import type { Route } from './+types/blog-post';
import { data, redirect, Link, useLocation } from 'react-router';
import { TweetButton } from '../components/TweetButton';
import { isBuildPhase } from '../env';
import { localeFromPathname, t } from '../i18n';

export const meta: Route.MetaFunction = ({
  data: { post },
}: Route.MetaArgs) => {
  const base = 'https://ikenox.info';
  return [
    { title: post.title },
    { property: 'og:title', content: post.title },
    ...(post.description
      ? [
          { name: 'description', content: post.description },
          { property: 'og:description', content: post.description },
        ]
      : []),
    // Cross-link language variants for search engines, only when an English
    // version genuinely exists.
    ...(post.hasEn
      ? [
          {
            tagName: 'link',
            rel: 'alternate',
            hrefLang: 'ja',
            href: `${base}/blog/${post.slug}`,
          },
          {
            tagName: 'link',
            rel: 'alternate',
            hrefLang: 'en',
            href: `${base}/en/blog/${post.slug}`,
          },
          {
            tagName: 'link',
            rel: 'alternate',
            hrefLang: 'x-default',
            href: `${base}/blog/${post.slug}`,
          },
        ]
      : []),
  ];
};

/** Old URLs -> current full paths. */
const redirects: Record<string, string> = {
  'made-corne-keyboard': '/blog/corne-keyboard',
  'getting-started-ideavim': '/en/blog/ideavim-getting-started',
  'ideavim-introduction': '/blog/ideavim-getting-started',
  'inheritance-and-delegation-and-interface':
    '/blog/inheritance-delegation-interface',
  'database-is-like-global-variable': '/blog/repository-pattern',
  'where-to-put-validation-in-clean-architecture':
    '/blog/validation-in-clean-architecture',
  'validation-in-clean-arch': '/blog/validation-in-clean-architecture',
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const newPath = redirects[params.slug];
  if (newPath) {
    return redirect(newPath);
  }

  if (import.meta.env.PROD && !isBuildPhase()) {
    throw data('Post not found', { status: 404 });
  }

  const uiLocale = localeFromPathname(new URL(request.url).pathname);
  const post = await getPostBySlug(params.slug, uiLocale);
  if (!post) {
    throw data('Post not found', { status: 404 });
  }
  return { post };
};

export default function Post({ loaderData: { post } }: Route.ComponentProps) {
  const location = useLocation();
  const url = new URL(location.pathname, 'https://ikenox.info').toString();
  const labels = t(post.uiLocale);
  return (
    <article lang={post.contentLocale}>
      <h1>{post.title}</h1>
      {post.contentLocale === 'en' && (
        <aside className="translation-notice">
          This is a machine translation (by an LLM) of the author&apos;s
          original Japanese article. You can read the{' '}
          <Link to={`/blog/${post.slug}`}>original article here</Link>.
        </aside>
      )}
      <p>
        <time dateTime={post.createdAt}>{post.createdAt}</time>
        {post.updatedAt && (
          <span>
            {' '}
            ({labels.updated}:{' '}
            <time dateTime={post.updatedAt}>{post.updatedAt}</time>)
          </span>
        )}
      </p>
      <p>
        <TweetButton url={url} text={post.title}></TweetButton>
      </p>

      <div
        className={'blog-post-content'}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
