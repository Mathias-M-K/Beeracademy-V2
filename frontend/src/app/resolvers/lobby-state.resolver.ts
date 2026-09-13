import {RedirectCommand, ResolveFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {LobbyService} from '../services/lobby/lobby.service';
import {WebsocketCode} from '../../api-models/model/websocketCode';
import {ToastService} from '../services/toast/toast.service';

export const lobbyStateResolver: ResolveFn<void> = async () => {
  const router = inject(Router);

  const lobbyService = inject(LobbyService);
  const toastService = inject(ToastService);

  const handleError = (cause: number) => {

    switch (cause) {
      case WebsocketCode.SessionOccupied:
        return onSessionOccupied();
      case WebsocketCode.SessionNotFound:
        return onSessionNotFound();
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
    await lobbyService.connectToWebsocket();
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
