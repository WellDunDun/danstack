import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { PublicUser } from '../lib/auth-boundaries';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
export type AuthView = 'setup' | 'loading' | 'signed-out' | 'expired' | 'auth-failed' | 'signed-in';
export function AuthPanel({ state, user, onSignOut }: { state: AuthView; user?: PublicUser | null; onSignOut?: () => void }) {
  const [draft, setDraft] = useState('My next app');
  const [label, setLabel] = useState('My next app');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <main className="shell">
    <header className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span className="rounded-md border px-3 py-2 text-xs font-semibold tracking-widest">GENERATED APP PREVIEW</span><span>TanStack Start · Convex · WorkOS · shadcn/ui</span></header>
    <section className="mb-9 mt-12 max-w-3xl"><p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 size={18} aria-hidden="true" /> Local scaffold ready</p><h1 className="mb-5 text-4xl font-semibold tracking-tight sm:text-5xl">Scaffolding is complete.</h1><p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">Your generated app includes server rendering, a reactive backend adapter and shadcn/ui. Start building locally; configure services when you want to test sign-in.</p></section>
    <div className="grid items-start gap-6 md:grid-cols-[1.2fr_1fr]">
      <Card className="ring-border" aria-labelledby="session-title"><CardHeader><CardTitle><h2 id="session-title" className="text-lg font-semibold">{state === 'setup' ? 'Optional: test app sign-in' : 'App session'}</h2></CardTitle><CardDescription>Authentication belongs to the generated app.</CardDescription></CardHeader><CardContent className="space-y-5">
        {state === 'setup' ? <><p className="leading-relaxed">Scaffolding is complete. Add WorkOS settings and an existing Convex URL only when you want to test sign-in.</p><p className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-muted-foreground">This preview does not authenticate users or connect to a deployed backend.</p><div className="flex flex-wrap gap-3"><Button disabled>Sign in requires setup</Button><a className={buttonVariants({ variant: 'outline' })} href="/authenticated">Check protected route</a></div></> :
         state === 'loading' ? <p role="status">Checking your session…</p> :
         state === 'signed-in' ? <><h3 className="text-xl font-medium">Welcome, {user?.firstName || 'there'}.</h3><p>{user?.email}</p><div className="flex flex-wrap gap-3"><a className={buttonVariants()} href="/authenticated">Open protected page</a><Button variant="outline" onClick={onSignOut}>Sign out</Button></div></> :
         <><h3 className="text-xl font-medium">{state === 'expired' ? 'Your session expired' : state === 'auth-failed' ? 'Sign-in could not be completed' : 'You’re signed out'}</h3><p>{state === 'expired' ? 'Sign in again to continue securely.' : state === 'auth-failed' ? 'Try signing in again. No authentication details are shown here.' : 'Sign in with WorkOS AuthKit to access the protected Convex greeting.'}</p><a className={buttonVariants()} href="/api/auth/sign-in">Sign in</a></>}
      </CardContent></Card>
      <Card className="ring-border" aria-labelledby="ui-title"><CardHeader><CardTitle><h2 id="ui-title" className="text-lg font-semibold">Try the components</h2></CardTitle><CardDescription>Real shadcn Button, Card and Input.</CardDescription></CardHeader><CardContent>
        <form className="space-y-3" onSubmit={event => { event.preventDefault(); const value = draft.trim(); if (!value || value.length > 40) { setError('Enter a project label between 1 and 40 characters.'); return; } setError(''); setLabel(value); }}>
          <label htmlFor="project-label" className="block text-sm font-medium">Project label</label><Input id="project-label" disabled={!ready} value={draft} maxLength={80} onChange={event => setDraft(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'project-label-error project-label-help' : 'project-label-help'} />
          <p id="project-label-help" className="text-xs leading-relaxed text-muted-foreground">Local UI example only. Nothing is saved or sent.</p>{error && <p id="project-label-error" role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={!ready}>Preview label</Button><p role="status" className="pt-2 text-sm">Preview label: {label}</p>
        </form>
      </CardContent></Card>
    </div>
    <footer className="mt-8 text-xs leading-relaxed text-muted-foreground">Protected data requires backend authorization on every query. Creating and installing this scaffold never signs you in or provisions services.</footer>
  </main>;
}
