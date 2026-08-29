import {HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {Observable, tap} from 'rxjs';

export function loggingInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    tap({
      error: (error) => {
        if (error instanceof HttpErrorResponse) {
          console.error(req.url, 'failed with status', error.status, error.error);
        } else {
          console.error(req.url, 'failed', error);
        }
      },
    }),
  );
}
