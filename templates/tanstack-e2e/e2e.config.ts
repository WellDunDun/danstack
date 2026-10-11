import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
export default {
  targets: [{ name: 'local-web', engine: web({ browser: 'chromium', viewport: { width: 1280, height: 900 } }), app: {
    url: 'http://127.0.0.1:0', command: { executable: process.execPath, args: ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '{port}', '--strictPort'], env: { VITE_CONVEX_URL: '', WORKOS_CLIENT_ID: '', WORKOS_API_KEY: '', WORKOS_COOKIE_PASSWORD: '', WORKOS_REDIRECT_URI: '' } },
  } }], tests: ['tests/*.e2e.ts'], workers: 1, retries: 0,
} satisfies E2EConfig;
