import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyServerAuth, fetchConvexToken, projectUser, safeReturnPath, matchesApplicationOrigin, shouldExpireSession } from '../src/lib/auth-boundaries';
import { inspectEnvironment } from '../src/lib/env';
const user = { id: 'synthetic-user', email: 'ada@example.invalid', firstName: 'Ada', lastName: null };
test('redirects are constrained to known local pages', () => {
  assert.equal(safeReturnPath('/authenticated'), '/authenticated');
  for (const v of ['/', '//evil.invalid', 'https://evil.invalid', '\\evil.invalid', '/%2f%2fevil.invalid', '%2Fauthenticated', '/authenticated?next=https://evil.invalid', '/authenticated/../evil', '/api/auth/sign-in', null, 42]) assert.equal(safeReturnPath(v), '/');
});
test('server clients are isolated and stale auth is cleared; no token/session serialization', () => {
  const make = () => ({ token: undefined as string | undefined, setAuth(value: string) { this.token = value; }, clearAuth() { this.token = undefined; } });
  const a = make(), b = make();
  const publicAuth = applyServerAuth(a, { user, accessToken: 'synthetic-token-A' });
  applyServerAuth(b, { user: { ...user, id: 'second' }, accessToken: 'synthetic-token-B' });
  assert.equal(a.token, 'synthetic-token-A'); assert.equal(b.token, 'synthetic-token-B');
  assert.equal(JSON.stringify(publicAuth).includes('token'), false);
  applyServerAuth(a, { user: null }); assert.equal(a.token, undefined); assert.equal(b.token, 'synthetic-token-B');
  assert.equal(applyServerAuth(b, { user }), null); assert.equal(b.token, undefined);
  assert.deepEqual(Object.keys(projectUser({ ...user, accessToken: 'secret', sessionId: 'secret' } as typeof user)!), ['id', 'email', 'firstName', 'lastName']);
});
test('Convex token bridge respects force refresh, unauthenticated and expired states', async () => {
  const calls: string[] = []; const sdk = { getAccessToken: async () => { calls.push('get'); return 'current'; }, refresh: async () => { calls.push('refresh'); return 'fresh'; } };
  assert.equal(await fetchConvexToken(null, false, sdk), null); assert.deepEqual(calls, []);
  assert.equal(await fetchConvexToken(user, false, sdk), 'current'); assert.equal(await fetchConvexToken(user, true, sdk), 'fresh'); assert.deepEqual(calls, ['get', 'refresh']);
  assert.equal(await fetchConvexToken(user, true, { ...sdk, refresh: async () => { throw Error('expired'); } }), null);
});
test('configuration rejects unsafe redirect/secret exposure and reports names only', () => {
  const valid = { WORKOS_CLIENT_ID: 'client_synthetic', WORKOS_API_KEY: 'sk_test_synthetic', WORKOS_COOKIE_PASSWORD: 'synthetic-cookie-password-32-characters', WORKOS_REDIRECT_URI: 'http://localhost:3000/api/auth/callback', VITE_CONVEX_URL: 'https://synthetic.convex.cloud' };
  assert.equal(inspectEnvironment(valid).ready, true);
  assert.equal(inspectEnvironment({ ...valid, WORKOS_REDIRECT_URI: 'http://evil.invalid/api/auth/callback' }).ready, false);
  assert.equal(inspectEnvironment({ ...valid, WORKOS_REDIRECT_URI: 'https://safe.invalid/api/auth/callback?next=evil' }).ready, false);
  assert.equal(inspectEnvironment({ ...valid, VITE_WORKOS_API_KEY: 'secret' }).ready, false);
  const invalid = inspectEnvironment({ ...valid, WORKOS_COOKIE_PASSWORD: 'SECRET' }); assert.equal(invalid.ready, false); assert.equal(JSON.stringify(invalid).includes('SECRET'), false);
});

test('origin aliases fail safely and expiry requires a completed formerly authenticated session', () => {
  assert.equal(matchesApplicationOrigin('http://127.0.0.1:3000/api/auth/sign-in', 'http://127.0.0.1:3000'), true);
  assert.equal(matchesApplicationOrigin('http://localhost:3000/api/auth/sign-in', 'http://127.0.0.1:3000'), false);
  assert.equal(shouldExpireSession(false, false, null), false); assert.equal(shouldExpireSession(true, true, null), false); assert.equal(shouldExpireSession(true, false, user), false); assert.equal(shouldExpireSession(true, false, null), true);
});
