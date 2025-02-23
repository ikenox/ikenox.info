import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const canonicalUrl = new URL(
    location.pathname,
    'https://ikenox.info'
  ).toString();
  const isTopPage = location.pathname === '/';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <title>ikenox.info</title>

        <link rel="canonical" href={canonicalUrl} />

        <meta
          name="description"
          content={
            'A tech blog and portfolio site sharing software engineering insights, experiences, and thoughts.'
          }
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={'ikenox.info'} />
        <meta property="og:image" content={'/icon.png'} />
        <meta property="og:site_name" content={'ikenox.info'} />

        <meta property="twitter:card" content="summary" />

        <Meta />
        <Links />
      </head>
      <body>
        <header>
          <span className="logo">
            {isTopPage ? 'ikenox.info' : <Link to="/">ikenox.info</Link>}
          </span>
          {' | '}
          <span>
            <a href="https://x.com/ikenox_" target="_blank" rel="noreferrer">
              X
            </a>
          </span>
          {' | '}
          <span>
            <a
              href="https://github.com/ikenox"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </span>
          {' | '}
          <span>
            <a href="/rss.xml" target="_blank" rel="noreferrer">
              RSS
            </a>
          </span>
        </header>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
