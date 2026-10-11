import { createFileRoute } from '@tanstack/react-router';
import { signIn } from '../../../lib/auth-routes.server';
export const Route = createFileRoute('/api/auth/sign-in')({ server: { handlers: { GET: ({ request }) => signIn(request) } } });
