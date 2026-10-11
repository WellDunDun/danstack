import { createServerOnlyFn } from '@tanstack/react-start';
import { inspectEnvironment } from './env';
export const getConfiguration = createServerOnlyFn(() => inspectEnvironment(process.env));
export const getApplicationOrigin = createServerOnlyFn(() => new URL(process.env.WORKOS_REDIRECT_URI!).origin);
