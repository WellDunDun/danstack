import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@workos/authkit-tanstack-react-start/client';
import { AuthPanel } from '../components/AuthPanel';
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { session?: 'expired' | 'auth_failed' } => ({ session: search.session === 'expired' || search.session === 'auth_failed' ? search.session : undefined }),
  component: Home,
});
function Home() {
  const { configured } = Route.useRouteContext();
  const { session } = Route.useSearch();
  if (!configured) return <AuthPanel state="setup" />;
  return <ConfiguredHome reason={session} />;
}
function ConfiguredHome({ reason }: { reason?: 'expired' | 'auth_failed' }) {
  const { user, loading, signOut } = useAuth();
  return <AuthPanel state={loading ? 'loading' : user ? 'signed-in' : reason === 'expired' ? 'expired' : reason === 'auth_failed' ? 'auth-failed' : 'signed-out'} user={user} onSignOut={() => { void signOut({ returnTo: '/' }); }} />;
}
