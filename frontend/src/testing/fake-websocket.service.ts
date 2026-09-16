import { Observable, Subject } from 'rxjs';
import { WebsocketEnvelope } from '../app/services/models/websocket-envelope';
import { WebsocketService } from '../app/services/websocket.service';
import { Deferred, deferred, flushMicrotasks } from './async';

/**
 * Stand-in for {@link WebsocketService} that lets a test drive the connection lifecycle by hand:
 * every `connect*` call stays pending until the test accepts or rejects it.
 */
export class FakeWebsocketService implements Pick<
  WebsocketService,
  'isConnected' | 'send' | 'disconnect' | 'connectToGameWebsocket' | 'connectToLobbyWebsocket'
> {
  public connected = false;
  public readonly sent: WebsocketEnvelope[] = [];

  private messages = new Subject<WebsocketEnvelope>();
  private readonly pending: Deferred<Observable<WebsocketEnvelope>>[] = [];

  public readonly isConnected = vi.fn(() => this.connected);
  public readonly send = vi.fn((envelope: WebsocketEnvelope) => {
    this.sent.push(envelope);
  });
  public readonly disconnect = vi.fn(() => {
    this.connected = false;
  });
  public readonly connectToGameWebsocket = vi.fn((_timeoutMs?: number) => this.openConnection());
  public readonly connectToLobbyWebsocket = vi.fn(() => this.openConnection());

  public get connectionAttempts(): number {
    return (
      this.connectToGameWebsocket.mock.calls.length + this.connectToLobbyWebsocket.mock.calls.length
    );
  }

  public get hasPendingConnection(): boolean {
    return this.pending.length > 0;
  }

  /** Completes the handshake of the most recent connection attempt. */
  public async acceptConnection(): Promise<void> {
    this.messages = new Subject<WebsocketEnvelope>();
    this.connected = true;
    this.takePending().resolve(this.messages.asObservable());
    await flushMicrotasks();
  }

  /** Fails the most recent connection attempt the way the real service does: an Error with a close code as cause. */
  public async rejectConnection(cause: number): Promise<void> {
    this.connected = false;
    this.takePending().reject(new Error('Websocket was closed', { cause }));
    await flushMicrotasks();
  }

  public async emit(envelope: WebsocketEnvelope): Promise<void> {
    this.messages.next(envelope);
    await flushMicrotasks();
  }

  /** Drops an established connection with a close code, erroring the message stream. */
  public async dropConnection(cause: number): Promise<void> {
    this.connected = false;
    this.messages.error(new Error('Websocket was closed', { cause }));
    await flushMicrotasks();
  }

  /** Closes an established connection normally, completing the message stream. */
  public async closeConnection(): Promise<void> {
    this.connected = false;
    this.messages.complete();
    await flushMicrotasks();
  }

  public lastSent(): WebsocketEnvelope | undefined {
    return this.sent.at(-1);
  }

  private openConnection(): Promise<Observable<WebsocketEnvelope>> {
    const connection = deferred<Observable<WebsocketEnvelope>>();
    this.pending.push(connection);
    return connection.promise;
  }

  private takePending(): Deferred<Observable<WebsocketEnvelope>> {
    const connection = this.pending.pop();
    if (!connection) {
      throw new Error('FakeWebsocketService: no pending connection attempt');
    }
    return connection;
  }
}
