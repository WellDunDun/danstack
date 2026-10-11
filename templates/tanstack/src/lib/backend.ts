import { makeFunctionReference } from 'convex/server';
export const privateGreeting = makeFunctionReference<'query', Record<string, never>, { subject: string; greeting: string }>('demo:privateGreeting');
