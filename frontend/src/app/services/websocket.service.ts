import {inject, Injectable, signal} from '@angular/core';
import {ConfigService} from '../../config.service';
import {ConnectionStatus} from './models/connection-status';
import {webSocket} from 'rxjs/webSocket';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {Subject} from 'rxjs';
import {WebSocketSubject} from 'rxjs/internal/observable/dom/WebSocketSubject';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private readonly applicationConfig = inject(ConfigService)
  private readonly lobbyWebsocketUrl = this.applicationConfig.apiUrl + "/ws/lobby"
  private readonly gameWebsocketUrl = this.applicationConfig.apiUrl + "/ws/game"

  private readonly _connectionStatus = signal<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  public readonly connectionStatus = this._connectionStatus.asReadonly();

  private readonly _messages = new Subject<WebsocketEnvelope>();
  public readonly messages$ = this._messages.asObservable();

  private readonly _lobbyLeaderStartedTheGame = new Subject<void>();
  public readonly lobbyLeaderStartedTheGame = this._lobbyLeaderStartedTheGame.asObservable();

  private websocket?: WebSocketSubject<WebsocketEnvelope>;

  private handleOpen(): void {
    this._connectionStatus.set(ConnectionStatus.CONNECTED);
  }

  private handleClose(closeEvent: CloseEvent): void {
    this.disconnect();

    if (closeEvent.code === 4030) {
      this._lobbyLeaderStartedTheGame.next();
    }
  }

  public connectToLobbyWebsocket(){
    this.connectToWebsocket(this.lobbyWebsocketUrl);
  }
  public connectToGameWebsocket(){
    this.connectToWebsocket(this.gameWebsocketUrl);
  }

  private connectToWebsocket(url: string) {
    console.debug("Connecting to Websocket", url);
    this.disconnect();
    this._connectionStatus.set(ConnectionStatus.CONNECTING)

      this.websocket = webSocket<WebsocketEnvelope>({
      url: url,
      openObserver: {
        next: () => this.handleOpen(),
      },
      closeObserver: {
        next: (closeEvent: CloseEvent) => this.handleClose(closeEvent),
      },
    });

    this.websocket.subscribe({
      next: message => this._messages.next(message),
      error: error => {
        this._connectionStatus.set(ConnectionStatus.DISCONNECTED)
        console.error("Error when attempting to connect to websocket", error, "url", url);
      }
    });
  }

  public send(envelope: WebsocketEnvelope): void {
    console.debug("Sending envelope", envelope);
    this.websocket?.next(envelope);
  }

  public disconnect(): void {
    this.websocket?.complete()
    this.websocket = undefined;
    this._connectionStatus.set(ConnectionStatus.DISCONNECTED);
  }

}

