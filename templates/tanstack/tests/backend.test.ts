import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defineTestApp } from 'convex-test';
import * as demo from '../convex/demo';
import schema from '../convex/schema';
import { privateGreeting } from '../src/lib/backend';
const { createTest } = defineTestApp({ schema }).defineModules({ demo });
test('actual registered private query refuses anonymous direct calls', async () => {
  const t = createTest(); await assert.rejects(t.query(privateGreeting, {}), /AUTH_REQUIRED/);
});
test('actual backend authorizes each synthetic identity independently', async () => {
  const t = createTest();
  const a = await t.withIdentity({ subject: 'synthetic-a', issuer: 'https://api.workos.com/' }).query(privateGreeting, {});
  const b = await t.withIdentity({ subject: 'synthetic-b', issuer: 'https://api.workos.com/' }).query(privateGreeting, {});
  assert.equal(a.subject, 'synthetic-a'); assert.equal(b.subject, 'synthetic-b'); assert.equal(a.greeting, 'Hello from your protected Convex query.');
});
