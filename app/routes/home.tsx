import type { Route } from './+types/home';
import { getAllPosts } from '../repository/posts';
import { Link } from 'react-router';
import { localeFromPathname, pathForLocale } from '../i18n';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'ikenox.info' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const uiLocale = localeFromPathname(new URL(request.url).pathname);
  return { posts: await getAllPosts(uiLocale), uiLocale };
}

export default function Home({
  loaderData: { posts, uiLocale },
}: Route.ComponentProps) {
  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.createdAt}>{post.createdAt}</time>{' '}
            <Link
              // Posts without an English variant link straight to the Japanese URL.
              to={
                uiLocale === 'en' && !post.hasEn
                  ? `/blog/${post.slug}`
                  : pathForLocale(`/blog/${post.slug}`, uiLocale)
              }
              lang={post.contentLocale}
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
