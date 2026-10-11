import { createFileRoute } from '@tanstack/react-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { privateGreeting } from '../../lib/backend';
export const Route = createFileRoute('/_authenticated/authenticated')({ component: ProtectedPage });
function ProtectedPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const result = useQuery(privateGreeting, isAuthenticated ? {} : 'skip');
  return <main className="shell"><span className="badge">PROTECTED PAGE</span><h1>A backend-authenticated greeting.</h1>
    {isLoading ? <p role="status">Verifying backend authentication…</p> : !isAuthenticated ? <p>Your backend session is unavailable or expired. <a href="/api/auth/sign-in">Sign in again</a>.</p> : !result ? <p role="status">Loading your greeting…</p> : <section className="card"><h2>{result.greeting}</h2><p>Convex independently authorized this query.</p></section>}
    <a href="/">Return home</a></main>;
}
