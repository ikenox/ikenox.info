import type { Config } from '@react-router/dev/config';
import { getPrerenderPaths } from './app/prerender';

export default { ssr: true, prerender: getPrerenderPaths } satisfies Config;
