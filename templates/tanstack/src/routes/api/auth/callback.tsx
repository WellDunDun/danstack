import { createFileRoute } from '@tanstack/react-router';
import { authCallback } from '../../../lib/auth-routes.server';
export const Route = createFileRoute('/api/auth/callback')({ server: { handlers: { GET: authCallback } } });
