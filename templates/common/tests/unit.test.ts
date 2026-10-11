import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Effect } from 'effect';
import { defineTestApp } from 'convex-test';
import { makeFunctionReference } from 'convex/server';
import schema from '../convex/schema';
import { greeting } from '../src/domain';

import * as demo from '../convex/demo';
const { createTest } = defineTestApp({ schema }).defineModules({ demo });
const hello = makeFunctionReference<'query', { name: string }, string>('demo:hello');
test('Effect greeting handles trimmed and empty names', () => {
  assert.equal(Effect.runSync(greeting(' Daniel ')), 'Hello, Daniel!');
  assert.equal(Effect.runSync(greeting('  ')), 'Hello, friend!');
});
test('real registered Convex query validates arguments and returns', async () => {
  const backend = createTest();
  assert.equal(await backend.query(hello, { name: ' Ada ' }), 'Hello, Ada!');
  await assert.rejects(backend.query(hello, { name: 12 } as never));
});
