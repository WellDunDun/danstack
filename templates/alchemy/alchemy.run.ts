import { Stack, localState } from 'alchemy';
import { providers } from 'alchemy/Cloudflare';
import { resources } from './infra/resources';

// Explicit cloud commands only. Cloud state is separate from local emulation.
export default Stack('fresh-stack-cloud', { providers: providers(), state: localState() }, resources);
