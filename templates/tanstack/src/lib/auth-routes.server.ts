import { getSignInUrl, handleCallbackRoute } from '@workos/authkit-tanstack-react-start';
import { getConfiguration, getApplicationOrigin } from './env.server';
import { safeReturnPath, matchesApplicationOrigin } from './auth-boundaries';
const unavailable = () => new Response('Authentication setup is required.', { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
export async function signIn(request: Request) {
  if (!getConfiguration().ready) return unavailable();
  if (!matchesApplicationOrigin(request.url, getApplicationOrigin())) return new Response('Use the configured application origin for sign-in.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
  const returnPathname = safeReturnPath(new URL(request.url).searchParams.get('returnPathname'));
  const url = await getSignInUrl({ data: { returnPathname } });
  return new Response(null, { status: 307, headers: { Location: url, 'Cache-Control': 'no-store' } });
}
const callback = handleCallbackRoute({ returnPathname: '/authenticated', errorRedirectUrl: '/?session=auth_failed' });
export async function authCallback({ request }: { request: Request }) {
  if (!getConfiguration().ready) return unavailable();
  if (!matchesApplicationOrigin(request.url, getApplicationOrigin())) return new Response('Callback origin does not match configuration.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
  const response = await callback({ request });
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store'); headers.set('Vary', 'Cookie');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
