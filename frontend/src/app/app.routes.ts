import {Routes} from '@angular/router';
import {WelcomePage} from './pages/welcome-page/welcome-page';
import {GamePage} from './pages/game-page/game-page';
import {SerialPlayground} from './pages/serial-playground/serial-playground';
import {CreateGamePage} from './pages/create-game-page/create-game-page';

export const routes: Routes = [
  {
    path: 'start',
    component: WelcomePage
  },
  {
    path: 'game',
    component: GamePage
  },
  {
    path: 'create',
    component: CreateGamePage
  },
  {
    path: 'serial',
    component: SerialPlayground
  },

  {path: '**', redirectTo: 'start'}
];
