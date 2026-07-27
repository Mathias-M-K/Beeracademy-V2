import {Routes} from '@angular/router';
import {WelcomePage} from './pages/welcome-page/welcome-page';
import {GamePage} from './pages/game-page/game-page';
import {SerialPlayground} from './pages/serial-playground/serial-playground';
import {LobbyPage} from './pages/lobby-page/lobby-page';
import {JoinPage} from './pages/join-page/join-page';

export const routes: Routes = [
  {
    path: 'start',
    component: WelcomePage
  },
  {
    path: 'join/:lobby-id',
    component: JoinPage
  },
  {
    path: 'lobby',
    component: LobbyPage
  },
  {
    path: 'game',
    component: GamePage
  },
  {
    path: 'serial',
    component: SerialPlayground
  },

  {path: '**', redirectTo: 'start'}
];
