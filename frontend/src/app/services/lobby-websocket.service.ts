import {inject, Injectable, signal} from '@angular/core';
import {ConfigService} from '../../config.service';
import {ConnectionStatus} from './models/connection-status';
import {webSocket} from 'rxjs/webSocket';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {Subject} from 'rxjs';

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

  private readonly subject = webSocket<WebsocketEnvelope>({
    url: this.websocketUrl,
    openObserver: {
      next: () => this.handleOpen(),
    },
    closeObserver: {
      next: (closeEvent: CloseEvent) => this.handleClose(closeEvent),
    },
  });

  private handleOpen(): void {
    this._connectionStatus.set(ConnectionStatus.CONNECTED);
  }

  private handleClose(closeEvent: CloseEvent): void {
    this._connectionStatus.set(ConnectionStatus.DISCONNECTED);
    console.log('Websocket closed', closeEvent.code, closeEvent.reason);
  }

  public send(envelope: WebsocketEnvelope): void {
    console.log("Sending", envelope);
    this.subject.next(envelope);
  }

  public connectToWebsocket(){
    this._connectionStatus.set(ConnectionStatus.CONNECTING)
    this.subject.subscribe({
      next: message => this._messages.next(message),
      error: error => {
        this._connectionStatus.set(ConnectionStatus.DISCONNECTED)
        console.error("Error when attempting to connect to websocket", error)
      }
    });
  }

}

