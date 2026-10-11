import { createIsomorphicFn, createServerFn } from '@tanstack/react-start';
import { getAuth } from '@workos/authkit-tanstack-react-start';
import type { ConvexQueryClient } from '@convex-dev/react-query';
import { applyServerAuth, projectUser } from './auth-boundaries';
import { getConfiguration } from './env.server';
export const getPublicSession = createServerFn({ method: 'GET' }).handler(async () => {
  const configured = getConfiguration().ready;
  if (!configured) return { configured, user: null };
  const auth = await getAuth();
  return { configured, user: projectUser(auth.user) };
});
// SSR gets a fresh router context; tokens never become serialized loader data.
export const readRouterSession = createIsomorphicFn()
  .server(async (client: ConvexQueryClient | undefined) => {
    const configured = getConfiguration().ready;
    if (!configured || !client) { client?.serverHttpClient?.clearAuth(); return { configured: false, user: null }; }
    const auth = await getAuth();
    return { configured, user: applyServerAuth(client?.serverHttpClient, auth) };
  })
  .client(async (client: ConvexQueryClient | undefined) => client ? getPublicSession() : { configured: false, user: null });
