import { Routes } from '@angular/router';
import { PartyShellComponent } from './party-shell/party-shell.component';
import { lobbyStateResolver } from '../../resolvers/lobby-state.resolver';
import { gameStateResolver } from '../../resolvers/game-state.resolver';

export const partyRoutes: Routes = [
  {
    path: '',
    component: PartyShellComponent,
    children: [
      {
        path: 'lobby',
        loadComponent: () => import('../lobby-page/lobby-page').then((m) => m.LobbyPage),
        data: { phase: 'lobby' },
        resolve: { lobbyInfo: lobbyStateResolver },
      },
      {
        path: 'game',
        loadComponent: () => import('../game-page/game-page').then((m) => m.GamePage),
        data: { phase: 'game' },
        resolve: { gameInfo: gameStateResolver },
      },
    ],
  },
];
