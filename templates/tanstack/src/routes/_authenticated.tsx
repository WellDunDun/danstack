import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { getPublicSession } from '../lib/session';
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Read current request again; serialized/context user is not an auth grant.
    const auth = await getPublicSession();
    if (!auth.configured) throw redirect({ href: '/?session=auth_failed', headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
    if (!auth.user) throw redirect({ href: '/api/auth/sign-in?returnPathname=/authenticated', headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
  },
  component: () => <Outlet />,
});
