import { queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { Effect } from 'effect';
import { greeting } from '../src/domain';

// This stateless query uses the upstream generic builder; no counterfeit _generated files.
// After backend setup, use query from ./_generated/server when adding typed database access.
export const hello = queryGeneric({
  args: { name: v.string() },
  returns: v.string(),
  handler: (_ctx, { name }) => Effect.runSync(greeting(name)),
});
