import {RedirectCommand, ResolveFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {WebsocketCode} from '../../api-models/model/websocketCode';
import {ToastService} from '../services/toast/toast.service';
import {GameService} from '../services/game/game.service';
import {ToastState} from '../overlay/toast/models/toast-data';

export const gameStateResolver: ResolveFn<void> = async () => {
  const router = inject(Router);

  const gameService = inject(GameService);
  const toastService = inject(ToastService);

  const handleError = (cause: number) => {
    switch (cause) {
      case WebsocketCode.SessionOccupied:
        return onSessionOccupied();
      case WebsocketCode.SessionNotFound:
        return onSessionNotFound();
      case WebsocketCode.GameNotFound: {
        toastService.showToast("Der skete en fejl", "Spillet findes ikke længere", 'error', ToastState.error);
        return navigateToWelcomeScreen();
      }
      default:
        return navigateToWelcomeScreen();
    }
  }

  const onSessionOccupied = () => {
    toastService.showToast("Plads optaget","Nogen andre er allerede logget ind med dit ID","close");
    return navigateToWelcomeScreen();
  }
  const onSessionNotFound = () => {
    toastService.showToast("Ikke fundet","Kunne ikke finde lobby","close");
    return navigateToWelcomeScreen();
  }

  const navigateToWelcomeScreen = () => {
    return new RedirectCommand(router.parseUrl('/start'));
  }

  try {
    await gameService.connectToWebsocket();
    return;
  } catch (error: unknown) {
    const cause = error instanceof Error ? error.cause as number : undefined;
    if (cause) {
      return handleError(cause);
    }else {
      return new RedirectCommand(router.parseUrl('/start'));
    }
  }
}
