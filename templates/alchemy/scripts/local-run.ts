import assert from 'node:assert/strict';
import { Effect } from 'effect';
import { AlchemyContext } from 'alchemy/AlchemyContext';
import { evalStack } from 'alchemy/Stack';
import { make as makePlan } from 'alchemy/Plan';
import { apply } from 'alchemy/Apply';
import { LocalStack, providers, state } from '../infra/local';
import { toEffect } from 'alchemy/Test/Core';
import { runMain } from 'alchemy/Util/PlatformServices';

const mode = process.argv[2];
if (!process.env.FRESH_LOCAL_STATE || !['dev', 'plan', 'test'].includes(mode)) throw new Error('Use npm run local:dev|local:plan|test:local');
const program = evalStack(LocalStack, compiled => Effect.gen(function* () {
  const plan = yield* makePlan(compiled);
  if (mode === 'plan') { console.log('Local-only plan constructed; no apply, no remote state.'); return; }
  const output = yield* apply(plan);
  assert.ok(output.namespaceId.startsWith('dev:'), 'Expected a local namespace');
  if (mode === 'test') {
    const url = new URL(output.url!);
    assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Expected loopback URL');
    const put = yield* Effect.promise(() => fetch(new URL('/value', url), { method: 'PUT', body: 'synthetic-local-proof' }));
    assert.equal(put.status, 204);
    const value = yield* Effect.promise(async () => (await fetch(new URL('/value', url))).text());
    assert.equal(value, 'synthetic-local-proof');
    const hello = yield* Effect.promise(async () => (await fetch(new URL('/hello?name=Ada', url))).json());
    assert.deepEqual(hello, { message: 'Hello, Ada!' });
    console.log('PASS actual Alchemy local Worker + KV PUT/GET + Effect handler');
  } else {
    console.log(`Local-only API: ${output.url}; ephemeral session state: ${process.env.FRESH_LOCAL_STATE}`);
    yield* Effect.never;
  }
}), { stage: 'local', dev: true }).pipe(Effect.provideService(AlchemyContext, {
  dotAlchemy: process.env.FRESH_LOCAL_STATE!, dev: true, adopt: false, updateStateStore: false,
}));
runMain(toEffect(program, { providers, state, dev: true, sidecar: false }));
