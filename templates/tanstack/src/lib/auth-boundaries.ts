export type PublicUser = { id: string; email: string; firstName: string | null; lastName: string | null };
export function projectUser(user: PublicUser | null): PublicUser | null {
  return user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } : null;
}
// Explicit allowlist avoids scheme-relative, encoded and backslash redirects.
export function safeReturnPath(value: unknown): '/' | '/authenticated' {
  return value === '/authenticated' ? '/authenticated' : '/';
}
export function matchesApplicationOrigin(requestUrl: string, configuredOrigin: string) {
  try { return new URL(requestUrl).origin === configuredOrigin; } catch { return false; }
}
export function applyServerAuth(client: { setAuth(token: string): void; clearAuth(): void } | undefined, auth: { user: PublicUser | null; accessToken?: string }) {
  if (auth.user && auth.accessToken) client?.setAuth(auth.accessToken);
  else client?.clearAuth();
  return projectUser(auth.user && auth.accessToken ? auth.user : null);
}
export async function fetchConvexToken(user: PublicUser | null, forceRefreshToken: boolean, sdk: { getAccessToken(): Promise<string | undefined>; refresh(): Promise<string | undefined> }) {
  if (!user) return null;
  try { return (await (forceRefreshToken ? sdk.refresh() : sdk.getAccessToken())) ?? null; }
  catch { return null; } // Expired/failed sessions never keep a stale token.
}
export function shouldExpireSession(previouslyAuthenticated: boolean, loading: boolean, user: PublicUser | null) {
  return previouslyAuthenticated && !loading && !user;
}
