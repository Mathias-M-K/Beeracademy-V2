import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import {App} from './app/app';

fetch('/config.json')
  .then(response => response.json())
  .then(config => {
    (window as any).APP_CONFIG = config;
    return bootstrapApplication(App, appConfig);
  })
  .catch(err => console.error('Failed to load config', err));
