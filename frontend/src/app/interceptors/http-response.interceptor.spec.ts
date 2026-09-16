import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpEvent,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import { loggingInterceptor } from './http-response.interceptor';
import { silenceConsole } from '../../testing/console';

describe('loggingInterceptor', () => {
  const url = 'http://api.test/api/parties/current';

  let httpClient: HttpClient;
  let http: HttpTestingController;
  let consoleSpies: ReturnType<typeof silenceConsole>;

  beforeEach(() => {
    consoleSpies = silenceConsole();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loggingInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('successful responses', () => {
    it('passes the response through without logging', () => {
      // Arrange
      const received = vi.fn();

      // Act
      httpClient.get(url).subscribe(received);
      http.expectOne(url).flush({ ok: true });

      // Assert
      expect(received).toHaveBeenCalledExactlyOnceWith({ ok: true });
      expect(consoleSpies.error).not.toHaveBeenCalled();
    });
  });

  describe('failed responses', () => {
    it('logs the url, status and error body of an http error', () => {
      // Arrange
      const failed = vi.fn();

      // Act
      httpClient.get(url).subscribe({ error: failed });
      http.expectOne(url).flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });

      // Assert
      expect(consoleSpies.error).toHaveBeenCalledExactlyOnceWith(url, 'failed with status', 500, {
        message: 'nope',
      });
    });

    it('still delivers the error to the subscriber', () => {
      // Arrange
      const failed = vi.fn();

      // Act
      httpClient.get(url).subscribe({ error: failed });
      http.expectOne(url).flush(null, { status: 404, statusText: 'Not Found' });

      // Assert
      expect(failed).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ status: 404 }));
    });

    it('logs non-http errors raised further down the chain', async () => {
      // Arrange
      const failure = new Error('boom');
      const request = new HttpRequest('GET', url);
      const next = (): Observable<HttpEvent<unknown>> => throwError(() => failure);

      // Act
      const result = firstValueFrom(loggingInterceptor(request, next));

      // Assert
      await expect(result).rejects.toBe(failure);
      expect(consoleSpies.error).toHaveBeenCalledExactlyOnceWith(url, 'failed', failure);
    });
  });
});
