import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// All pages fetch live data from msuiit-cqi-api on every request
// (`export const dynamic = 'force-dynamic'`), so no ISR/tag caching is
// needed here — this is the minimal, no-caching config.
export default defineCloudflareConfig();
