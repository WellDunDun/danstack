import { Effect } from 'effect';
import { greeting } from '../src/domain';

interface Store { get(key: string): Promise<string | null>; put(key: string, value: string): Promise<void> }
export default {
  async fetch(request: Request, env: { STORE: Store }) {
    const url = new URL(request.url);
    if (url.pathname === '/hello') return Response.json({ message: Effect.runSync(greeting(url.searchParams.get('name') ?? '')) });
    if (url.pathname !== '/value') return new Response('Not found', { status: 404 });
    if (request.method === 'PUT') {
      const value = await request.text();
      if (value.length > 1000) return new Response('Value too large', { status: 413 });
      await env.STORE.put('synthetic-demo', value);
      return new Response(null, { status: 204 });
    }
    if (request.method === 'GET') return new Response(await env.STORE.get('synthetic-demo') ?? '', { status: 200 });
    return new Response('Method not allowed', { status: 405 });
  },
};
