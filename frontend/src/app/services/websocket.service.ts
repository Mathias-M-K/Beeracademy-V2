import { Injectable } from '@angular/core';
import {WebsocketEnvelope} from './models/websocket-envelope';
import {GameClientEvenEnvelope} from './models/categories/game-client-event/game-client-even-envelope';
import {GameClientConnectedEvent} from './models/categories/game-client-event/game-client-connected.event';
import {catchError, EMPTY, Observable, tap} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';
import {WebSocketSubject} from 'rxjs/internal/observable/dom/WebSocketSubject';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {

  private socket!: WebSocketSubject<any>;

  public connectToWebSocket(): void {

    this.connect().subscribe({
      next: (message: WebsocketEnvelope) => {
        console.log("Message!", message);

        switch (message.category) {
          case 'GAME_CLIENT_EVENT':
            const gameClientEvent = message as GameClientEvenEnvelope;

            switch (gameClientEvent.payload.type) {
              case 'CLIENT_CONNECTED':
                console.log("Client connected!");
                const payload: GameClientConnectedEvent = gameClientEvent.payload as GameClientConnectedEvent;
                console.log("Payload", payload.game);
            }
        }

      },
      error: error => {
        console.error(error);
      }
    });
  }

  private connect(): Observable<any> {
    if (!this.socket || this.socket.closed) {
      this.socket = webSocket({url: 'http://localhost:8080/game'});
    }

    return this.socket.asObservable().pipe(
      tap({
        next: (message: WebsocketEnvelope) => {
          console.log("Obs:", message)
        },
        error: error => console.error('WebSocket Error:', error),
        complete: () => console.log('WebSocket Connection Closed')
      }),
      catchError(_ => EMPTY)
    );
  }

}
