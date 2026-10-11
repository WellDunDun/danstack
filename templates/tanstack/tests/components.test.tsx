import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthPanel } from '../src/components/AuthPanel';
const render = (state: Parameters<typeof AuthPanel>[0]['state']) => renderToStaticMarkup(<AuthPanel state={state} user={{ id: 'fixture', email: '<script>@example.invalid', firstName: 'Ada', lastName: null }} />);
test('setup and loading are honest; signed-out/expired/auth errors contain safe actions', () => {
  assert.match(render('setup'), /Scaffolding is complete/); assert.match(render('setup'), /only when you want to test sign-in/); assert.match(render('setup'), /disabled=""/);
  assert.match(render('setup'), /GENERATED APP PREVIEW/); assert.match(render('setup'), /data-slot="card"/); assert.match(render('setup'), /data-slot="button"/); assert.match(render('setup'), /data-slot="input"/);
  assert.match(render('setup'), /for="project-label"/); assert.match(render('setup'), /aria-invalid="false"/);
  assert.match(render('loading'), /role="status"/); assert.match(render('loading'), /Checking your session/);
  assert.match(render('signed-out'), /href="\/api\/auth\/sign-in"/);
  assert.match(render('expired'), /Your session expired/); assert.match(render('auth-failed'), /Sign-in could not be completed/);
  assert.match(render('signed-in'), /Welcome, Ada/); assert.match(render('signed-in'), /&lt;script&gt;@example.invalid/); assert.doesNotMatch(render('signed-in'), /<script>/);
});
