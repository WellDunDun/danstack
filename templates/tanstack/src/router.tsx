import { createRouter } from '@tanstack/react-router';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient } from '@tanstack/react-query';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { ConvexReactClient } from 'convex/react';
import { SessionProviders } from './components/SessionProviders';
import { routeTree } from './routeTree.gen';
// Never move these clients to a module singleton: SSR auth is request-bound.
export function getRouter() {
  const url = import.meta.env.VITE_CONVEX_URL;
  const convexClient = url ? new ConvexReactClient(url) : undefined;
  const convexQueryClient = convexClient ? new ConvexQueryClient(convexClient) : undefined;
  const queryClient = new QueryClient({ defaultOptions: { queries: {
    ...(convexQueryClient ? { queryKeyHashFn: convexQueryClient.hashFn(), queryFn: convexQueryClient.queryFn() } : {}), gcTime: 5000,
  } } });
  convexQueryClient?.connect(queryClient);
  const router = createRouter({
    routeTree, defaultPreload: 'intent', defaultPreloadStaleTime: 0, scrollRestoration: true,
    context: { queryClient, convexClient, convexQueryClient },
    defaultErrorComponent: () => <main className="shell"><h1>Unable to load this page</h1><p>Please retry or sign in again.</p><a href="/">Return home</a></main>,
    defaultNotFoundComponent: () => <main className="shell"><h1>Page not found</h1><a href="/">Return home</a></main>,
    InnerWrap: ({ children }) => <SessionProviders client={convexClient}>{children}</SessionProviders>,
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
