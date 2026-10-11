import { createStart, createCsrfMiddleware, createMiddleware, createIsomorphicFn } from '@tanstack/react-start';
import { authkitMiddleware } from '@workos/authkit-tanstack-react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { getConfiguration } from './lib/env.server';
const csrf = createCsrfMiddleware({ filter: ctx => ctx.handlerType === 'serverFn' });
const privateResponses = createMiddleware().server(async ({ next }) => {
  setResponseHeader('Cache-Control', 'private, no-store');
  setResponseHeader('Vary', 'Cookie');
  return next();
});
const authConfigured = createIsomorphicFn().server(() => getConfiguration().ready).client(() => false);
export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, privateResponses, ...(authConfigured() ? [authkitMiddleware()] : [])],
}));
