import {ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {catchError, finalize, Observable, of, timeout} from 'rxjs';
import {PartyApiService} from '../services/apis/party-api.service';
import {ToastService} from '../services/toast/toast.service';
import {ToastState} from '../overlay/toast/models/toast-data';
import {OverlayService} from '../services/overlay/overlay.service';
import {PartyDto} from '../../api-models/model/partyDto';
import {BeerLoaderOverlay} from '../overlay/beer-loader-overlay/beer-loader-overlay';
import {OverlayHandle} from '../services/overlay/models/overlay-handle';


export const partyStateResolver: ResolveFn<PartyDto> = (route: ActivatedRouteSnapshot) => {
  const partyApi = inject(PartyApiService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  const overlayService = inject(OverlayService);

  const PARTY_LOOKUP_TIMEOUT = 8000;
  const TIME_BEFORE_SHOWING_LOADER = 150;

  const partyId: string = route.params['party-id'];

  const bail = (title: string, text: string): Observable<RedirectCommand> => {
    toastService.showToast(title, text, 'error', ToastState.error);
    return of(new RedirectCommand(router.parseUrl('/start')));
  };

  const beerLoaderMessages: string[] = ['Tjekker om der er plads','Henter øl','Blander kort','Tjekker ting']
  let overlayHandle: OverlayHandle<void>;
  const loadingScreenTimer = setTimeout(() => {
    overlayHandle = overlayService.openOverlay<void, string[]>({component: BeerLoaderOverlay, data: beerLoaderMessages});
  }, TIME_BEFORE_SHOWING_LOADER);


  return partyApi.getParty(partyId).pipe(
    finalize(() => {
      clearTimeout(loadingScreenTimer);

      if (overlayHandle) {
        overlayHandle.dismiss()
      }
    }),
    timeout({
      each: PARTY_LOOKUP_TIMEOUT,
      with: () => bail('Timeout', 'Måske tager serveren en pause')
    }),
    catchError(() => bail('Miv :(', 'Kunne ikke forbinde')),
  );
};
