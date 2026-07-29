import {inject, Injectable} from '@angular/core';
import {ConfigService} from '../../config.service';
import {webSocket} from 'rxjs/webSocket';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {Observable, Subject} from 'rxjs';
import {WebSocketSubject} from 'rxjs/internal/observable/dom/WebSocketSubject';
import {GameEventEnvelope} from './models/categories/events/game/game-event-envelope';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private readonly applicationConfig = inject(ConfigService)
  private readonly lobbyWebsocketUrl = this.applicationConfig.apiUrl + "/ws/lobby"
  private readonly gameWebsocketUrl = this.applicationConfig.apiUrl + "/ws/game"


  private websocket?: WebSocketSubject<WebsocketEnvelope>;

  public connectToLobbyWebsocket() {
    return this.connectToWebsocket(this.lobbyWebsocketUrl);
  }

  public connectToGameWebsocket() {
    return this.connectToWebsocket(this.gameWebsocketUrl);
  }

  private connectToWebsocket(url: string): Promise<Observable<WebsocketEnvelope>> {
    console.debug("Connecting to Websocket", url);
    this.disconnect();

    const messages = new Subject<WebsocketEnvelope>();

    let resolveConnection!: (messages$: Observable<WebsocketEnvelope>) => void;
    let rejectConnection!: (reason: Error) => void;
    const connection = new Promise<Observable<WebsocketEnvelope>>((resolve, reject): void => {
      resolveConnection = resolve;
      rejectConnection = reject;
    });

    const timeout = setTimeout(() => {
      rejectConnection(new Error("Did not receive handshake", {cause: 0}));
      this.disconnect();
    }, 6000);

    const socket = this.websocket = webSocket<WebsocketEnvelope>({
      url: url,
      openObserver: {
        next: ()=> console.log("🟨 Connected! Waiting for handshake.")
      },
      closeObserver: {
        next: (closeEvent: CloseEvent) => {
          console.log("⚠️ Websocket disconnected");
          clearTimeout(timeout);

          const error = new Error('Websocket was closed', {cause: closeEvent.code});
          rejectConnection(error);

          const isNormalClose = closeEvent.code === 1000 || closeEvent.code === 1005;

          if (isNormalClose) {
            messages.complete();
          } else {
            messages.error(error);
          }

          if(this.websocket === socket){
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
          clearTimeout(timeout);
          resolveConnection(messages);
          return;
        }

        messages.next(message);
      },
      error: (error: Event) => {
        clearTimeout(timeout);
        rejectConnection(new Error('Websocket disconnected', {cause: 1}));
        console.error("Error when attempting to connect to websocket:", error, ", url:", url);
      }
    });

    return connection;
  }

  private isHandshake(message: WebsocketEnvelope): boolean {
    return (message as Partial<GameEventEnvelope>).payload?.type === 'HANDSHAKE';
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

