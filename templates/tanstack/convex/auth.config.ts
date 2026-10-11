import type { AuthConfig } from 'convex/server';
// This is the existing deployment's server environment, not frontend .env.local.
const clientId = process.env.WORKOS_CLIENT_ID;
if (!/^client_[A-Za-z0-9]+$/.test(clientId ?? '')) throw new Error('Set WORKOS_CLIENT_ID on the Convex deployment before deploying auth configuration.');
export default { providers: [
  { type: 'customJwt', issuer: 'https://api.workos.com/', algorithm: 'RS256', jwks: `https://api.workos.com/sso/jwks/${clientId}`, applicationID: clientId },
  { type: 'customJwt', issuer: `https://api.workos.com/user_management/${clientId}`, algorithm: 'RS256', jwks: `https://api.workos.com/sso/jwks/${clientId}` },
] } satisfies AuthConfig;
