import { Routes } from '@angular/router';
import { JoinPage } from './join-page';
import { partyStateResolver } from '../../resolvers/party-state.resolver';

export const joinRoutes: Routes = [
  {
    path: '',
    component: JoinPage,
    resolve: { partyInfo: partyStateResolver },
  },
];
