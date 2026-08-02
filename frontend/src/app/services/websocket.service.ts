import {inject, Injectable} from '@angular/core';
import {ConfigService} from '../../config.service';
import {webSocket} from 'rxjs/webSocket';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {Observable, Subject} from 'rxjs';
import {WebSocketSubject} from 'rxjs/internal/observable/dom/WebSocketSubject';
import {GameEventEnvelope} from './models/categories/events/game/game-event-envelope';
import {ExceptionResponse} from '../../api-models/model/exceptionResponse';
import {ExceptionEvent} from './models/categories/events/common/exception-event';
import {WebsocketCodes} from '../../api-models/model/websocketCodes';


export const LocalWebsocketCodes = {
  Unknown: 0,
  Exception: 1
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {

  private readonly applicationConfig = inject(ConfigService)
  private readonly lobbyWebsocketUrl = this.applicationConfig.apiUrl + "/ws/lobby"
  private readonly gameWebsocketUrl = this.applicationConfig.apiUrl + "/ws/game"


  private websocket?: WebSocketSubject<WebsocketEnvelope>;

  public isConnected(): boolean {
    return !!this.websocket;
  }

  public connectToLobbyWebsocket() {
    return this.connectToWebsocket(this.lobbyWebsocketUrl);
  }

  public connectToGameWebsocket(timeoutMs?: number) {
    return this.connectToWebsocket(this.gameWebsocketUrl, timeoutMs);
  }

  private connectToWebsocket(url: string, timeoutMs?: number): Promise<Observable<WebsocketEnvelope>> {
    console.debug("Connecting to Websocket", url);
    this.disconnect();

    const messages = new Subject<WebsocketEnvelope>();

    let resolveConnection!: (messages$: Observable<WebsocketEnvelope>) => void;
    let rejectConnection!: (reason: Error) => void;
    const connection = new Promise<Observable<WebsocketEnvelope>>((resolve, reject): void => {
      resolveConnection = resolve;
      rejectConnection = reject;
    });

    const timeoutHandle = setTimeout(() => {
      rejectConnection(new Error("Did not receive handshake", {cause: 0}));
      this.disconnect();
    }, timeoutMs ?? 6000);

    const socket = this.websocket = webSocket<WebsocketEnvelope>({
      url: url,
      openObserver: {
        next: () => console.log("🟨 Connected! Waiting for handshake.")
      },
      closeObserver: {
        next: (closeEvent: CloseEvent) => {
          console.log("⚠️ Websocket disconnected. Code:", closeEvent.code, ', clean:', closeEvent.wasClean);
          clearTimeout(timeoutHandle);

          const error = new Error('Websocket was closed', {cause: closeEvent.code});
          rejectConnection(error);

          const isNormalClose = closeEvent.code === 1000 || closeEvent.code === 1005;

          if (isNormalClose) {
            messages.complete();
          } else {
            messages.error(error);
          }

          if (this.websocket === socket) {
            this.disconnect();
          }

        }
      },
    });

    this.websocket.subscribe({
      next: message => {

        console.debug("Websocket message received:", message);

        if (this.isHandshake(message)) {
          console.log("✅ Websocket handshake received");
          clearTimeout(timeoutHandle);
          resolveConnection(messages);
        } else if (this.isException(message)) {
          const exception: ExceptionResponse = ((message as GameEventEnvelope).payload as ExceptionEvent).response;
          let cause = LocalWebsocketCodes.Exception;
          switch (exception.exception) {
            case 'GameNotFoundException': {
              cause = WebsocketCodes.GameNotFound
              break;
            }
          }
          console.debug("⚠️ Exception thrown from websocket", exception);
          rejectConnection(new Error("Exception thrown from websocket", {cause: cause}));
          return;
        }

        messages.next(message);
      },
      error: (error: Event) => {
        clearTimeout(timeoutHandle);
        rejectConnection(new Error('Websocket disconnected', {cause: LocalWebsocketCodes.Unknown}));
        console.debug("⚠️ Error when attempting to connect to websocket.", error, "url:", url);
      }
    });

    return connection;
  }

  private isHandshake(message: WebsocketEnvelope): boolean {
    return (message as Partial<GameEventEnvelope>).payload?.type === 'HANDSHAKE';
  }

  private isException(message: WebsocketEnvelope) {
    return (message as Partial<GameEventEnvelope>).payload?.type === 'EXCEPTION_RESPONSE'
  }

  public send(envelope: WebsocketEnvelope): void {
    console.debug("Sending envelope", envelope);
    this.websocket?.next(envelope);
  }

  public disconnect(): void {
    this.websocket?.complete()
    this.websocket = undefined;
  }

}

