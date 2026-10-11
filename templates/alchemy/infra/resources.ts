import { Effect } from 'effect';
import { Namespace } from 'alchemy/Cloudflare/KV';
import { Worker } from 'alchemy/Cloudflare/Workers';

export const resources = Effect.gen(function* () {
  const store = yield* Namespace('Store');
  const worker = yield* Worker('Api', {
    main: './worker/main.ts', env: { STORE: store },
    dev: { host: '127.0.0.1', port: 0 },
    compatibility: { date: '2026-09-18' },
  });
  return { url: worker.url, namespaceId: store.namespaceId };
});
