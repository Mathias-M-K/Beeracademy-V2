import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideCheckNoChangesConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withHashLocation,
  withPreloading,
} from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loggingInterceptor } from './interceptors/http-response.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Components rely on the OnPush default, so a view only re-renders when something
    // marks it dirty. This re-checks every view as if it were eager and throws when a
    // binding changed without notifying Angular. Dev only — and still developer preview.
    ...(isDevMode() ? [provideCheckNoChangesConfig({ exhaustive: true, interval: 100 })] : []),
    provideRouter(routes, withHashLocation(), withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([loggingInterceptor])),
  ],
};
