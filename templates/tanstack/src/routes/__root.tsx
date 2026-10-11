import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { ConvexReactClient } from 'convex/react';
import type { ConvexQueryClient } from '@convex-dev/react-query';
import { readRouterSession } from '../lib/session';
import appCssUrl from '../app.css?url';
export const Route = createRootRouteWithContext<{ queryClient: QueryClient; convexClient: ConvexReactClient | undefined; convexQueryClient: ConvexQueryClient | undefined }>()({
  head: () => ({ meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'TanStack + Convex + WorkOS' }], links: [{ rel: 'stylesheet', href: appCssUrl }, { rel: 'icon', href: '/convex.svg' }] }),
  beforeLoad: ({ context }) => readRouterSession(context.convexQueryClient),
  component: () => <html lang="en"><head><HeadContent /></head><body><Outlet /><Scripts /></body></html>,
  notFoundComponent: () => <main className="shell"><h1>Page not found</h1><a href="/">Return home</a></main>,
});
