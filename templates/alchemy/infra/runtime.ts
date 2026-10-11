import { Effect, Layer, MutableHashMap } from 'effect';
import { RuntimeLive, layerLocalBindings, layerRemoteBindings, layerProxy, layerLoopback, layerStorage, layerRegistry } from '@alchemy.run/cloudflare-runtime/core';
import { Globals, Internet } from '@alchemy.run/cloudflare-runtime/core/globals';
import { Docker } from '@alchemy.run/cloudflare-runtime/core/Docker';
import { WorkerdLive } from '@alchemy.run/cloudflare-runtime/core/workerd/Workerd';
import { PathsLive } from '../node_modules/@alchemy.run/cloudflare-runtime/dist/core/node/internal/Paths.mjs';
import { LocalRuntimeState } from '../node_modules/alchemy/lib/Cloudflare/LocalRuntime.js';
import { AlchemyContext } from 'alchemy/AlchemyContext';

// beta.81's default runtime eagerly starts a Docker proxy and pulls an image.
// This Worker/KV adapter composes the real upstream runtime with containers denied.
const denied = () => Effect.die('Containers are outside this local-only preset');
const docker = Layer.succeed(Docker, {
  getWorkerdDockerConfiguration: denied(), generateImageTag: () => { throw new Error('Containers disabled'); },
  registerImageEnv: denied, build: denied, pull: denied, validate: denied, removeImageTag: denied, removeContainer: denied,
});
export const runtime = Layer.unwrap(Effect.map(AlchemyContext, ({ dotAlchemy }) => Layer.merge(
  Layer.sync(LocalRuntimeState, () => LocalRuntimeState.of({ queues: MutableHashMap.empty(), queueConsumers: MutableHashMap.empty(), workerRestarts: MutableHashMap.empty() })),
  RuntimeLive.pipe(
    Layer.provideMerge(layerLocalBindings()),
    Layer.provideMerge(layerRemoteBindings({ accountId: Effect.die('Remote bindings disabled') })),
    Layer.provideMerge(layerProxy()), Layer.provide(Globals.GlobalsLive),
    Layer.provideMerge(layerLoopback()), Layer.provide(layerStorage({ directory: `${dotAlchemy}/local` })),
    Layer.provide(Internet.InternetLive), Layer.provideMerge(layerRegistry()),
    Layer.provide(PathsLive), Layer.provide(docker), Layer.provide(WorkerdLive),
  ),
)));
