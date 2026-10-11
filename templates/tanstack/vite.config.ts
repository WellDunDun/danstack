// Reviewed adapter of the official Convex Start template. Remote config code is
// recorded as source data, never copied for execution during dev/build.
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { config } from 'dotenv';
import tailwindcss from '@tailwindcss/vite';
config({ path: '.env.local', quiet: true }); config({ quiet: true });
export default defineConfig({ server: { host: '127.0.0.1', port: 3000, strictPort: true }, plugins: [tailwindcss(), tsConfigPaths({ projects: ['./tsconfig.json'] }), tanstackStart(), viteReact()] });
