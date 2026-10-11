export type Environment = Record<string, string | undefined>;
export function inspectEnvironment(env: Environment) {
  const issues: string[] = [];
  if (!/^client_[A-Za-z0-9]+$/.test(env.WORKOS_CLIENT_ID ?? '')) issues.push('WORKOS_CLIENT_ID');
  if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(env.WORKOS_API_KEY ?? '')) issues.push('WORKOS_API_KEY');
  if ((env.WORKOS_COOKIE_PASSWORD ?? '').length < 32) issues.push('WORKOS_COOKIE_PASSWORD (at least 32 characters)');
  try {
    const uri = new URL(env.WORKOS_REDIRECT_URI ?? '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(uri.hostname);
    if (uri.username || uri.password || uri.search || uri.hash || uri.pathname !== '/api/auth/callback' || !(uri.protocol === 'https:' || (uri.protocol === 'http:' && local))) throw new Error();
  } catch { issues.push('WORKOS_REDIRECT_URI (HTTPS or loopback; exact /api/auth/callback)'); }
  try {
    const uri = new URL(env.VITE_CONVEX_URL ?? '');
    if (uri.username || uri.password || uri.search || uri.hash || uri.pathname !== '/' || !(uri.protocol === 'https:' || (uri.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(uri.hostname)))) throw new Error();
  } catch { issues.push('VITE_CONVEX_URL (existing deployment URL)'); }
  if (Object.keys(env).some(k => /^VITE_.*(?:WORKOS|COOKIE|SECRET|API_KEY)/i.test(k))) issues.push('server secrets must not use a VITE_ prefix');
  return { ready: issues.length === 0, issues };
}
