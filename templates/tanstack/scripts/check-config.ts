import { config } from 'dotenv';
import { inspectEnvironment } from '../src/lib/env';
config({ path: '.env.local', quiet: true }); config({ quiet: true });
const result = inspectEnvironment(process.env);
if (!result.ready) { console.error('AUTH_PREREQUISITE: Set ' + result.issues.join(', ') + '. Values were not printed.'); process.exitCode = 2; }
else console.log('Configuration format passed. No credentials were authenticated and no cloud operation ran.');
