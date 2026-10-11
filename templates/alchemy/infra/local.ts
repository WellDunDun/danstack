import { Effect, Layer } from 'effect';
import { Stack, localState } from 'alchemy';
import { ProviderLocal } from 'alchemy/Cloudflare/KV';
import { LocalWorkerProvider } from 'alchemy/Cloudflare/Workers';
import { runtime } from './runtime';
import { collection } from 'alchemy/Provider';
import { Namespace } from 'alchemy/Cloudflare/KV';
import { Worker } from 'alchemy/Cloudflare/Workers';
import { Providers, CloudflareEnvironment } from 'alchemy/Cloudflare';
import { Credentials } from '../node_modules/alchemy/lib/Cloudflare/Credentials.js';
import { AlchemyContext } from 'alchemy/AlchemyContext';
import { resources } from './resources';

if (!process.env.FRESH_LOCAL_STATE) throw new Error('Use the local command wrapper');
const context = Layer.succeed(AlchemyContext, { dotAlchemy: process.env.FRESH_LOCAL_STATE, dev: true, adopt: false, updateStateStore: false });
export const state = localState().pipe(Layer.provide(context));
// No live or dual provider, remote binding or RPC sidecar is registered here.
const environment = Layer.succeed(CloudflareEnvironment, Effect.die('Cloud environment is unavailable in local-only mode'));
const local = Layer.merge(ProviderLocal(), LocalWorkerProvider().pipe(
  Layer.provide(runtime.pipe(Layer.provide(context))), Layer.provide(environment), Layer.provide(Layer.succeed(Credentials, Effect.die('Cloud credentials unavailable locally'))),
));
export const providers = Layer.effect(Providers, collection([Namespace, Worker])).pipe(Layer.provideMerge(local), Layer.orDie);
export const LocalStack = Stack('fresh-stack-local', { providers, state }, resources);
