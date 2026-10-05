import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/welcome-page/welcome-page').then((m) => m.WelcomePage),
  },
  {
    path: 'start',
    loadComponent: () => import('./pages/welcome-page/welcome-page').then((m) => m.WelcomePage),
  },
  {
    path: 'join/:party-id',
    loadChildren: () => import('./pages/join-page/join.routes').then((m) => m.joinRoutes),
  },
  {
    path: 'serial',
    loadComponent: () =>
      import('./pages/serial-playground/serial-playground').then((m) => m.SerialPlayground),
  },
  {
    path: '',
    loadChildren: () => import('./pages/party/party.routes').then((m) => m.partyRoutes),
  },

  { path: '**', redirectTo: 'start' },
];
