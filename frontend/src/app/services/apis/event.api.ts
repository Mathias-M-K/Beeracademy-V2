import {inject, Service} from '@angular/core';
import {Observable} from 'rxjs';
import {PlayerConnectionEvent} from '../../../api-models/model/playerConnectionEvent';
import {ConfigService} from '../../../config.service';
import {ConnectionEvent} from '../../../api-models/model/connectionEvent';

@Service()
export class EventApi {

  private readonly configService = inject(ConfigService);

  private readonly apiUrl = this.configService.apiUrl + '/api';

  public getPlayerConnectionEventStream(partyId: string): Observable<PlayerConnectionEvent> {


    return new Observable(subscriber => {

      const onEvent = (event: MessageEvent<string>)=> {
        const playerConnectionEvent = JSON.parse(event.data) as PlayerConnectionEvent;
        console.debug("SSE Event", playerConnectionEvent);
        subscriber.next(playerConnectionEvent);
      }

      const sseEventStream = new EventSource(`${this.apiUrl}/events/player-connection-events/${partyId}`, {withCredentials: true});
      sseEventStream.addEventListener(ConnectionEvent.Connected, event => onEvent(event));
      sseEventStream.addEventListener(ConnectionEvent.Disconnected, event => onEvent(event));
      sseEventStream.addEventListener(ConnectionEvent.Released, event => onEvent(event));
      return () => sseEventStream.close()
    })

  }
}
