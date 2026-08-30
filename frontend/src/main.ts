import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import {App} from './app/app';

// Replaced at build time by the `define` entry in angular.json. Only the `mock`
// configuration sets it to true; everywhere else the import below is dead code and
// msw never reaches the bundle.
declare const USE_MOCKS: boolean;

const mocksReady = USE_MOCKS
  ? import('./mocks/browser').then(({ startMockServiceWorker }) => startMockServiceWorker())
  : Promise.resolve();

mocksReady
  .then(() => fetch('/config.json'))
  .then(response => response.json())
  .then(config => {
    (window as any).APP_CONFIG = config;
    return bootstrapApplication(App, appConfig);
  })
  .catch(err => console.error('Failed to load config', err));
