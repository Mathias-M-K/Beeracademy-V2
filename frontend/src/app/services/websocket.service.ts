import {inject, Injectable, signal} from '@angular/core';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {catchError, EMPTY, Observable, Subject, tap} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';
import {WebSocketSubject} from 'rxjs/internal/observable/dom/WebSocketSubject';
import {ConfigService} from '../../config.service';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private applicationConfig = inject(ConfigService);
  private websocketUrl = this.applicationConfig.apiUrl + "/ws"

  public connectionStatus = signal<string>("Connecting...");
  private messageSubject = new Subject<WebsocketEnvelope>();
  public messages$: Observable<WebsocketEnvelope> = this.messageSubject.asObservable();

  private socket!: WebSocketSubject<any>;


  public sendMessage(envelope: WebsocketEnvelope) {
    this.socket.next(envelope);
  }

  public connectToWebSocket(): void {
    this.connectionStatus.set("Connecting...");
    this.connect().subscribe({
      next: (message: WebsocketEnvelope) => {
        this.messageSubject.next(message);
      },
      error: error => {
        console.error(error);
      }
    });
  }

  public closeConnection(): void {
    this.connectionStatus.set("Disconnected");
    this.socket.complete();
  }

  private connect(): Observable<any> {
    if (!this.socket || this.socket.closed) {
      this.socket = webSocket({
        url: this.websocketUrl + '/game',
        openObserver: {
          next: () => {
            this.connectionStatus.set("Connected!");
          }
        }
      });
    }

    return this.socket.asObservable().pipe(
      tap({
        error: () => this.connectionStatus.set("Connection dropped"),
        complete: () => this.connectionStatus.set("Disconnected")
      }),
      catchError(_ => EMPTY)
    );
  }
}
