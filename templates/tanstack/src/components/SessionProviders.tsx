import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouteContext } from '@tanstack/react-router';
import { AuthKitProvider, useAccessToken, useAuth } from '@workos/authkit-tanstack-react-start/client';
import { ConvexProviderWithAuth } from 'convex/react';
import type { ConvexReactClient } from 'convex/react';
import { SessionRevalidator } from './SessionRevalidator';
import { fetchConvexToken } from '../lib/auth-boundaries';
export function useAuthFromWorkOS() {
  const { loading, user } = useAuth();
  const { loading: tokenLoading, error, getAccessToken, refresh } = useAccessToken();
  const fetchAccessToken = useCallback(({ forceRefreshToken }: { forceRefreshToken: boolean }) => fetchConvexToken(user, forceRefreshToken, { getAccessToken, refresh }), [user, getAccessToken, refresh]);
  return useMemo(() => ({ isLoading: loading || tokenLoading, isAuthenticated: !!user && !error, fetchAccessToken }), [loading, tokenLoading, user, error, fetchAccessToken]);
}
export function SessionProviders({ client, children }: { client: ConvexReactClient | undefined; children: ReactNode }) {
  const { configured } = useRouteContext({ from: '__root__' });
  if (!configured || !client) return <>{children}</>;
  return <AuthKitProvider onSessionExpired={() => { void client.clearAuth(); window.location.assign('/?session=expired'); }}>
    <SessionRevalidator client={client} />
    <ConvexProviderWithAuth client={client} useAuth={useAuthFromWorkOS}>{children}</ConvexProviderWithAuth>
  </AuthKitProvider>;
}
