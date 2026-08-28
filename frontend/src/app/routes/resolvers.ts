import {ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {catchError, map, Observable, of, timeout} from 'rxjs';
import {PartyApiService} from '../services/apis/party-api.service';
import {ToastService} from '../services/toast/toast.service';
import {ToastState} from '../overlay/toast/models/toast-data';
import {OverlayService} from '../services/overlay/overlay.service';
import {PartyDto} from '../../api-models/model/partyDto';


export const partyStateResolver: ResolveFn<PartyDto> = (route: ActivatedRouteSnapshot) => {
  const partyApi = inject(PartyApiService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  const overlayService = inject(OverlayService);

  const PARTY_LOOKUP_TIMEOUT = 8000;

  const partyId: string = route.params['party-id'];

  const bail = (title: string, text: string): Observable<RedirectCommand> => {
    toastService.showToast(title, text, 'error', ToastState.error);
    return of(new RedirectCommand(router.parseUrl('/start')));
  };

  // const overlayHandle = overlayService.openOverlay<void>({component: BeerLoaderOverlay});
  return partyApi.getParty(partyId).pipe(
    map(partyInfo => partyInfo),
    timeout({
      each: PARTY_LOOKUP_TIMEOUT,
      with: () => bail('Timeout', 'Måske tager serveren en pause')
    }),
    catchError(() => bail('Miv :(', 'Den søgte fest kunne ikke findes')),
  );
};
