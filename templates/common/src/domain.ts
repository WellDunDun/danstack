import { Effect } from 'effect';
export const greeting = (name: string) => Effect.succeed(`Hello, ${name.trim() || 'friend'}!`);
