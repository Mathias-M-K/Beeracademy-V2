import { Routes } from '@angular/router';
import { WelcomePage } from './pages/welcome-page/welcome-page';
import { GamePage } from './pages/game-page/game-page';
import { SerialPlayground } from './pages/serial-playground/serial-playground';
import { LobbyPage } from './pages/lobby-page/lobby-page';
import { JoinPage } from './pages/join-page/join-page';
import { partyStateResolver } from './resolvers/party-state.resolver';
import { lobbyStateResolver } from './resolvers/lobby-state.resolver';
import { gameStateResolver } from './resolvers/game-state.resolver';
import {PartyShellComponent} from './pages/party/party-shell/party-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: WelcomePage
  },
  {
    path: 'start',
    component: WelcomePage
  },
  {
    path: 'join/:party-id',
    component: JoinPage,
    resolve: { partyInfo: partyStateResolver }
  },
  {
    path: 'serial',
    component: SerialPlayground
  },
  {
    path: '',
    component: PartyShellComponent,
    children: [
      {
        path: 'lobby',
        component: LobbyPage,
        resolve: { lobbyInfo: lobbyStateResolver }
      },
      {
        path: 'game',
        component: GamePage,
        resolve: { gameInfo: gameStateResolver }
      },
    ]
  },

  { path: '**', redirectTo: 'start' }
];

//{ path: 'lobby', component: LobbyPage, resolve: { lobbyInfo: lobbyStateResolver } },
