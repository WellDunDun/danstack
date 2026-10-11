import './style.css';
import { Effect } from 'effect';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { greeting } from './domain';

const url = import.meta.env.VITE_CONVEX_URL;
const mode = url ? 'Convex backend configured' : 'Local Effect demo · backend not connected';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main>
    <p class="eyebrow">FRESH STACK / YOUR STARTING POINT</p>
    <h1>Small app.<br>Fresh foundations.</h1>
    <p class="intro">A tiny TypeScript interface, a typed Effect, and a Convex function ready for your next idea.</p>
    <section aria-label="Greeting demo">
      <p class="badge">${mode}</p>
      <form>
        <label for="name">Your name</label>
        <div class="controls"><input id="name" name="name" value="Daniel" maxlength="100" autocomplete="off"><button type="submit">Say hello <span aria-hidden="true">↗</span></button></div>
      </form>
      <p role="status" aria-live="polite">Ready when you are.</p>
    </section>
    <footer>Resolved at generation. Locked at install. Yours to build.</footer>
  </main>`;
const output = app.querySelector<HTMLElement>('[role="status"]')!;
const button = app.querySelector<HTMLButtonElement>('button')!;
const client = url ? new ConvexHttpClient(url) : undefined;
const remote = makeFunctionReference<'query', { name: string }, string>('demo:hello');
app.querySelector('form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  const name = app.querySelector<HTMLInputElement>('input')!.value;
  const program = client ? Effect.tryPromise({ try: () => client.query(remote, { name }), catch: (cause) => new Error(`Backend request failed: ${String(cause)}`) }) : greeting(name);
  try { output.textContent = await Effect.runPromise(program); }
  catch (error) { output.textContent = String(error); }
  finally { button.disabled = false; }
});
