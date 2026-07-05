import {Routes} from '@angular/router';
import {WelcomePage} from './pages/welcome-page/welcome-page';
import {GamePage} from './pages/game-page/game-page';
import {SerialPlayground} from './pages/serial-playground/serial-playground';
import {LobbyPage} from './pages/lobby-page/lobby-page';

export const routes: Routes = [
  {
    path: 'start',
    component: WelcomePage
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
