import { TestBed } from '@angular/core/testing';
import { EventApi } from './event.api';
import { ConfigService } from '../../../config.service';
import { silenceConsole } from '../../../testing/console';
import { PARTY_ID, PLAYER_1, PLAYER_2 } from '../../../testing/game-builders';
import { ConnectionEvent } from '../../../api-models/model/connectionEvent';
import { PlayerConnectionEvent } from '../../../api-models/model/playerConnectionEvent';

class FakeEventSource {
  public static readonly instances: FakeEventSource[] = [];

  public readonly listeners = new Map<string, ((event: MessageEvent<string>) => void)[]>();
  public readonly close = vi.fn();

  constructor(
    public readonly url: string,
    public readonly options?: EventSourceInit,
  ) {
    FakeEventSource.instances.push(this);
  }

  public addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  public dispatch(type: string, payload: PlayerConnectionEvent): void {
    const event = { data: JSON.stringify(payload) } as MessageEvent<string>;
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

describe('EventApi', () => {
  let api: EventApi;

  beforeEach(() => {
    silenceConsole();
    FakeEventSource.instances.length = 0;
    vi.stubGlobal('EventSource', FakeEventSource);

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: { apiUrl: 'http://api.test', environment: 'TEST' } },
      ],
    });

    api = TestBed.inject(EventApi);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function eventSource(): FakeEventSource {
    expect(FakeEventSource.instances).toHaveLength(1);
    return FakeEventSource.instances[0];
  }

  describe('opening the stream', () => {
    it('does not connect until subscribed', () => {
      // Arrange
      const partyId = PARTY_ID;

      // Act
      api.getPlayerConnectionEventStream(partyId);

      // Assert
      expect(FakeEventSource.instances).toHaveLength(0);
    });

    it('connects to the party event stream with credentials', () => {
      // Arrange
      const stream = api.getPlayerConnectionEventStream(PARTY_ID);

      // Act
      stream.subscribe();

      // Assert
      expect(eventSource().url).toBe(
        `http://api.test/api/events/player-connection-events/${PARTY_ID}`,
      );
      expect(eventSource().options).toEqual({ withCredentials: true });
    });

    it('listens for connected, disconnected and released events', () => {
      // Arrange
      const stream = api.getPlayerConnectionEventStream(PARTY_ID);

      // Act
      stream.subscribe();

      // Assert
      expect([...eventSource().listeners.keys()]).toEqual([
        ConnectionEvent.Connected,
        ConnectionEvent.Disconnected,
        ConnectionEvent.Released,
      ]);
    });
  });

  describe('receiving events', () => {
    it.each([ConnectionEvent.Connected, ConnectionEvent.Disconnected, ConnectionEvent.Released])(
      'emits the parsed payload of a %s event',
      (type) => {
        // Arrange
        const received = vi.fn();
        api.getPlayerConnectionEventStream(PARTY_ID).subscribe(received);
        const payload: PlayerConnectionEvent = {
          partyId: PARTY_ID,
          playerId: PLAYER_1,
          connectionEvent: type,
        };

        // Act
        eventSource().dispatch(type, payload);

        // Assert
        expect(received).toHaveBeenCalledExactlyOnceWith(payload);
      },
    );

    it('emits events in the order they arrive', () => {
      // Arrange
      const received = vi.fn();
      api.getPlayerConnectionEventStream(PARTY_ID).subscribe(received);

      // Act
      eventSource().dispatch(ConnectionEvent.Disconnected, {
        playerId: PLAYER_1,
        connectionEvent: ConnectionEvent.Disconnected,
      });
      eventSource().dispatch(ConnectionEvent.Connected, {
        playerId: PLAYER_2,
        connectionEvent: ConnectionEvent.Connected,
      });

      // Assert
      expect(received.mock.calls.map(([event]) => event.playerId)).toEqual([PLAYER_1, PLAYER_2]);
    });
  });

  describe('closing the stream', () => {
    it('keeps the event source open while subscribed', () => {
      // Arrange
      const stream = api.getPlayerConnectionEventStream(PARTY_ID);

      // Act
      stream.subscribe();

      // Assert
      expect(eventSource().close).not.toHaveBeenCalled();
    });

    it('closes the event source on unsubscribe', () => {
      // Arrange
      const subscription = api.getPlayerConnectionEventStream(PARTY_ID).subscribe();

      // Act
      subscription.unsubscribe();

      // Assert
      expect(eventSource().close).toHaveBeenCalledOnce();
    });
  });
});
