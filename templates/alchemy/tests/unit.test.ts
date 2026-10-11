import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Effect } from 'effect';
import { greeting } from '../src/domain';
test('Effect greeting handles trimmed and empty names', () => {
  assert.equal(Effect.runSync(greeting(' Ada ')), 'Hello, Ada!');
  assert.equal(Effect.runSync(greeting(' ')), 'Hello, friend!');
});
