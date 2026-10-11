import { queryGeneric } from 'convex/server';
import { ConvexError, v } from 'convex/values';
export const privateGreeting = queryGeneric({
  args: {}, returns: v.object({ subject: v.string(), greeting: v.string() }),
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('AUTH_REQUIRED');
    return { subject: identity.subject, greeting: 'Hello from your protected Convex query.' };
  },
});
