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
export class LobbyWebsocketService {
  private readonly applicationConfig = inject(ConfigService)
  private readonly websocketUrl = this.applicationConfig.apiUrl + "/ws/lobby"

  private readonly _connectionStatus = signal<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  public readonly connectionStatus = this._connectionStatus.asReadonly();

  private readonly _messages = new Subject<WebsocketEnvelope>();
  public readonly messages$ = this._messages.asObservable();

  private readonly _gameStarted = new Subject<void>();
  public readonly gameStarted = this._gameStarted.asObservable();

  private websocket?: WebSocketSubject<WebsocketEnvelope>;

  private handleOpen(): void {
    this._connectionStatus.set(ConnectionStatus.CONNECTED);
  }

  private handleClose(closeEvent: CloseEvent): void {
    this._connectionStatus.set(ConnectionStatus.DISCONNECTED);

    if (closeEvent.code === 4030) {
      this._gameStarted.next();
    }
  }

  public connectToWebsocket() {
    this.disconnect();
    this._connectionStatus.set(ConnectionStatus.CONNECTING)

      this.websocket = webSocket<WebsocketEnvelope>({
      url: this.websocketUrl,
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
        console.error("Error when attempting to connect to websocket", error)
      }
    });
  }

  public send(envelope: WebsocketEnvelope): void {
    this.websocket?.next(envelope);
  }

  public disconnect(): void {
    this.websocket?.complete();
    this.websocket = undefined;
    this._connectionStatus.set(ConnectionStatus.DISCONNECTED);
  }

}

