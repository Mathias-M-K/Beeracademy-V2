import { Routes } from '@angular/router';
import { WelcomePage } from './pages/welcome-page/welcome-page';
import { GamePage } from './pages/game-page/game-page';
import { SerialPlayground } from './pages/serial-playground/serial-playground';
import { LobbyPage } from './pages/lobby-page/lobby-page';
import { JoinPage } from './pages/join-page/join-page';
import { partyStateResolver } from './resolvers/party-state.resolver';
import { lobbyStateResolver } from './resolvers/lobby-state.resolver';
import { gameStateResolver } from './resolvers/game-state.resolver';

export const routes: Routes = [
  {
    path: 'start',
    component: WelcomePage,
  },
  {
    path: 'join/:party-id',
    component: JoinPage,
    resolve: { partyInfo: partyStateResolver },
  },
  {
    path: 'lobby',
    component: LobbyPage,
    resolve: { lobbyInfo: lobbyStateResolver },
  },
  {
    path: 'game',
    component: GamePage,
    resolve: { gameInfo: gameStateResolver },
  },
  {
    path: 'serial',
    component: SerialPlayground,
  },

  { path: '**', redirectTo: 'start' },
];
