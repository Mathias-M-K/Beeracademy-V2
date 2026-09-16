import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { ConfigService } from '../../config.service';
import { WebsocketEnvelope } from './models/websocket-envelope';
import { WebsocketCode } from '../../api-models/model/websocketCode';
import { silenceConsole } from '../../testing/console';
import { flushMicrotasks } from '../../testing/async';

/** Minimal stand-in for the browser WebSocket, driven by the test the way a server would. */
class FakeSocket {
  public static readonly instances: FakeSocket[] = [];

  public readyState = 0;
  public binaryType = 'blob';
  public readonly sent: string[] = [];
  public readonly closeCalls: { code?: number; reason?: string }[] = [];

  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: ((event: { code: number; wasClean: boolean }) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public readonly url: string) {
    FakeSocket.instances.push(this);
  }

  public send(data: string): void {
    this.sent.push(data);
  }

  /** Like a browser, a client-initiated close reports its close event in a later task. */
  public close(code?: number, reason?: string): void {
    this.closeCalls.push({ code, reason });
    if (this.readyState >= 2) {
      return;
    }
    this.readyState = 2;
    setTimeout(() => this.serverClose(code ?? 1005, true), 0);
  }

  public open(): void {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  public receive(envelope: WebsocketEnvelope): void {
    this.onmessage?.({ data: JSON.stringify(envelope) });
  }

  public serverClose(code: number, wasClean = code === 1000): void {
    this.readyState = 3;
    this.onclose?.({ code, wasClean });
  }

  public fail(): void {
    this.onerror?.(new Event('error'));
  }

  public sentEnvelopes(): unknown[] {
    return this.sent.map((data) => JSON.parse(data));
  }
}

interface Settled<T> {
  status: 'pending' | 'resolved' | 'rejected';
  value?: T;
  reason?: Error;
}

describe('WebsocketService', () => {
  let service: WebsocketService;

  const handshake: WebsocketEnvelope = {
    category: 'LOBBY_CLIENT_EVENT',
    payload: { type: 'HANDSHAKE' },
  } as WebsocketEnvelope;

  beforeEach(() => {
    silenceConsole();
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    FakeSocket.instances.length = 0;
    vi.stubGlobal('WebSocket', FakeSocket);

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: { apiUrl: 'http://api.test', environment: 'TEST' } },
      ],
    });

    service = TestBed.inject(WebsocketService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function track<T>(promise: Promise<T>): Settled<T> {
    const settled: Settled<T> = { status: 'pending' };
    promise.then(
      (value) => Object.assign(settled, { status: 'resolved', value }),
      (reason: Error) => Object.assign(settled, { status: 'rejected', reason }),
    );
    return settled;
  }

  function latestSocket(): FakeSocket {
    const socket = FakeSocket.instances.at(-1);
    if (!socket) {
      throw new Error('No socket was created');
    }
    return socket;
  }

  function exception(name: string): WebsocketEnvelope {
    return {
      category: 'GAME_CLIENT_EVENT',
      payload: { type: 'EXCEPTION_RESPONSE', response: { exception: name, message: 'nope' } },
    } as WebsocketEnvelope;
  }

  function record(stream: Observable<WebsocketEnvelope>) {
    const log = {
      messages: [] as WebsocketEnvelope[],
      completed: false,
      error: undefined as Error | undefined,
    };
    stream.subscribe({
      next: (message) => log.messages.push(message),
      complete: () => (log.completed = true),
      error: (error: Error) => (log.error = error),
    });
    return log;
  }

  async function connectLobby(): Promise<{
    socket: FakeSocket;
    stream: Observable<WebsocketEnvelope>;
  }> {
    const connection = service.connectToLobbyWebsocket();
    const socket = latestSocket();
    socket.open();
    socket.receive(handshake);
    const stream = await connection;
    return { socket, stream };
  }

  describe('connecting', () => {
    it('opens the lobby websocket on the configured api url', () => {
      // Arrange
      const expectedUrl = 'http://api.test/ws/lobby';

      // Act
      track(service.connectToLobbyWebsocket());

      // Assert
      expect(latestSocket().url).toBe(expectedUrl);
    });

    it('opens the game websocket on the configured api url', () => {
      // Arrange
      const expectedUrl = 'http://api.test/ws/game';

      // Act
      track(service.connectToGameWebsocket());

      // Assert
      expect(latestSocket().url).toBe(expectedUrl);
    });

    it('stays pending while the socket is open but no handshake has arrived', async () => {
      // Arrange
      const connection = track(service.connectToLobbyWebsocket());

      // Act
      latestSocket().open();
      await flushMicrotasks();

      // Assert
      expect(connection.status).toBe('pending');
    });

    it('resolves with a message stream once the handshake arrives', async () => {
      // Arrange
      const snapshot = {
        category: 'LOBBY_CLIENT_EVENT',
        payload: { type: 'HELLO_LOBBY_SNAPSHOT' },
      };
      const { socket, stream } = await connectLobby();
      const log = record(stream);

      // Act
      socket.receive(snapshot);

      // Assert
      expect(log.messages).toEqual([snapshot]);
    });

    it('does not forward the handshake itself to the message stream', async () => {
      // Arrange
      const connection = service.connectToLobbyWebsocket();
      const socket = latestSocket();
      socket.open();

      // Act
      socket.receive(handshake);
      const log = record(await connection);

      // Assert
      expect(log.messages).toEqual([]);
    });

    it('delivers messages the server sends in the frames right after the handshake', async () => {
      // Arrange
      const identity = { category: 'LOBBY_CLIENT_EVENT', payload: { type: 'HELLO_IDENTITY' } };
      const snapshot = {
        category: 'LOBBY_CLIENT_EVENT',
        payload: { type: 'HELLO_LOBBY_SNAPSHOT' },
      };
      const connection = service.connectToLobbyWebsocket();
      let log: ReturnType<typeof record> | undefined;
      connection.then((stream) => (log = record(stream)));
      const socket = latestSocket();
      socket.open();

      // Act
      socket.receive(handshake);
      await flushMicrotasks();
      socket.receive(snapshot);
      await flushMicrotasks();
      socket.receive(identity);

      // Assert
      expect(log?.messages).toEqual([snapshot, identity]);
    });

    it('forwards exceptions that arrive after the handshake to the message stream', async () => {
      // Arrange
      const { socket, stream } = await connectLobby();
      const log = record(stream);

      // Act
      socket.receive(exception('NotEnoughPlayersException'));

      // Assert
      expect(log.messages).toEqual([exception('NotEnoughPlayersException')]);
      expect(log.error).toBeUndefined();
    });

    it('reports itself connected once a connection is started', () => {
      // Arrange
      const before = service.isConnected();

      // Act
      track(service.connectToLobbyWebsocket());

      // Assert
      expect(before).toBe(false);
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('rejected handshakes', () => {
    it.each([
      ['GameNotFoundException', WebsocketCode.GameNotFound],
      ['SessionConnectedException', WebsocketCode.SessionOccupied],
      ['SomethingElseException', WebsocketCode.Unknown],
    ])('rejects with the close code for a %s', async (name, code) => {
      // Arrange
      const connection = track(service.connectToGameWebsocket());
      const socket = latestSocket();
      socket.open();

      // Act
      socket.receive(exception(name));
      await flushMicrotasks();

      // Assert
      expect(connection.status).toBe('rejected');
      expect(connection.reason?.cause).toBe(code);
    });

    it('rejects with the close code when the socket closes before the handshake', async () => {
      // Arrange
      const connection = track(service.connectToLobbyWebsocket());
      const socket = latestSocket();
      socket.open();

      // Act
      socket.serverClose(WebsocketCode.LobbyNotFound, false);
      await flushMicrotasks();

      // Assert
      expect(connection.status).toBe('rejected');
      expect(connection.reason?.cause).toBe(WebsocketCode.LobbyNotFound);
      expect(service.isConnected()).toBe(false);
    });

    it('rejects when the socket errors before the handshake', async () => {
      // Arrange
      const connection = track(service.connectToLobbyWebsocket());

      // Act
      latestSocket().fail();
      await flushMicrotasks();

      // Assert
      expect(connection.status).toBe('rejected');
      expect(connection.reason?.message).toBe('Websocket disconnected');
    });

    it('keeps a retry alive after an exception-rejected connection', async () => {
      // Arrange
      const failed = track(service.connectToLobbyWebsocket());
      const first = latestSocket();
      first.open();
      first.receive(exception('SessionConnectedException'));
      await flushMicrotasks();

      // Act
      const { socket: retry } = await connectLobby();
      await vi.advanceTimersByTimeAsync(10_000);

      // Assert
      expect(failed.status).toBe('rejected');
      expect(service.isConnected()).toBe(true);
      expect(retry.closeCalls).toEqual([]);
    });
  });

  describe('handshake timeout', () => {
    it('waits six seconds for the handshake by default', async () => {
      // Arrange
      const connection = track(service.connectToLobbyWebsocket());
      latestSocket().open();

      // Act
      await vi.advanceTimersByTimeAsync(5999);

      // Assert
      expect(connection.status).toBe('pending');
    });

    it('rejects and disconnects when no handshake arrives within six seconds', async () => {
      // Arrange
      const connection = track(service.connectToLobbyWebsocket());
      const socket = latestSocket();
      socket.open();

      // Act
      await vi.advanceTimersByTimeAsync(6000);

      // Assert
      expect(connection.status).toBe('rejected');
      expect(connection.reason?.cause).toBe(0);
      expect(service.isConnected()).toBe(false);
      expect(socket.closeCalls).toHaveLength(1);
    });

    it('honours a custom handshake timeout', async () => {
      // Arrange
      const connection = track(service.connectToGameWebsocket(1000));
      latestSocket().open();

      // Act
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(connection.status).toBe('rejected');
      expect(connection.reason?.cause).toBe(0);
    });

    it('does not time out once the handshake has arrived', async () => {
      // Arrange
      const { socket } = await connectLobby();

      // Act
      await vi.advanceTimersByTimeAsync(10_000);

      // Assert
      expect(service.isConnected()).toBe(true);
      expect(socket.closeCalls).toEqual([]);
    });
  });

  describe('closing', () => {
    it.each([1000, 1005])('completes the message stream on normal close code %i', async (code) => {
      // Arrange
      const { socket, stream } = await connectLobby();
      const log = record(stream);

      // Act
      socket.serverClose(code, true);

      // Assert
      expect(log.completed).toBe(true);
      expect(log.error).toBeUndefined();
      expect(service.isConnected()).toBe(false);
    });

    it.each([WebsocketCode.Kicked, WebsocketCode.Transitioning, WebsocketCode.AbnormalClosure])(
      'errors the message stream with close code %i as cause',
      async (code) => {
        // Arrange
        const { socket, stream } = await connectLobby();
        const log = record(stream);

        // Act
        socket.serverClose(code, false);

        // Assert
        expect(log.completed).toBe(false);
        expect(log.error?.cause).toBe(code);
        expect(service.isConnected()).toBe(false);
      },
    );

    it('closes the socket and reports disconnected on disconnect', async () => {
      // Arrange
      const { socket, stream } = await connectLobby();
      const log = record(stream);

      // Act
      service.disconnect();
      await vi.advanceTimersByTimeAsync(0);

      // Assert
      expect(service.isConnected()).toBe(false);
      expect(socket.closeCalls).toHaveLength(1);
      expect(log.completed).toBe(true);
    });

    it('disconnects the previous socket when connecting again', async () => {
      // Arrange
      const { socket: first, stream: firstStream } = await connectLobby();
      const firstLog = record(firstStream);

      // Act
      const { socket: second } = await connectLobby();
      await vi.advanceTimersByTimeAsync(0);

      // Assert
      expect(first.closeCalls).toHaveLength(1);
      expect(firstLog.completed).toBe(true);
      expect(second).not.toBe(first);
      expect(second.closeCalls).toEqual([]);
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('sending', () => {
    it('sends envelopes as json', async () => {
      // Arrange
      const { socket } = await connectLobby();
      const envelope = { category: 'LOBBY_CLIENT_ACTION', payload: { type: 'LOBBY_START_GAME' } };

      // Act
      service.send(envelope);

      // Assert
      expect(socket.sentEnvelopes()).toEqual([envelope]);
    });

    it('sends envelopes queued before the socket opened once it opens', () => {
      // Arrange
      track(service.connectToLobbyWebsocket());
      const socket = latestSocket();
      const envelope = { category: 'LOBBY_PARTICIPANT_ACTION', payload: { type: 'SEND_MESSAGE' } };
      service.send(envelope);

      // Act
      socket.open();

      // Assert
      expect(socket.sentEnvelopes()).toEqual([envelope]);
    });

    it('does nothing when sending without a connection', () => {
      // Arrange
      const envelope = { category: 'LOBBY_CLIENT_ACTION', payload: { type: 'LOBBY_START_GAME' } };

      // Act & Assert
      expect(() => service.send(envelope)).not.toThrow();
    });
  });
});
