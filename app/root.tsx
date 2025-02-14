import {
  isRouteErrorResponse,
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
  const isTopPage = location.pathname === '/';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
      </head>
      <body>
        <header>
          <span className="logo">
            {isTopPage ? 'ikenox.info' : <a href="/">ikenox.info</a>}
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
            <a href="">RSS</a>
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
