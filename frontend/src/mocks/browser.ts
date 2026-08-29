import { setupWorker } from 'msw/browser';
import { db } from './db';
import { handlers } from './handlers';
import { wsHandlers } from './ws-handlers';

export const worker = setupWorker(...handlers, ...wsHandlers);

/**
 * Registers the service worker and seeds the in-memory backend. The worker script is
 * generated into `public/` (see the `msw.workerDirectory` field in package.json),
 * which Angular serves from the web root — hence the explicit url.
 */
export async function startMockServiceWorker(): Promise<void> {
  db.seed();

  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    // The app also fetches /config.json and its own assets; only warn about API calls we forgot to mock.
    onUnhandledRequest: 'bypass',
  });

  console.info('🔶 Mock Service Worker running. Seeded lobby: MOCK12345');
}
