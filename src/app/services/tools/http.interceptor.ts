import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FacadeService } from '../facade.service';
import { Router } from '@angular/router';

@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {
  constructor(
    private facadeService: FacadeService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // No agregar token a la solicitud de login
    if (request.url.includes('/token/')) {
      return next.handle(request).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.facadeService.destroyUser();
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    }

    // Obtener el token
    const token = this.facadeService.getSessionToken();

    // Si hay token, agregarlo al header
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si hay un error 401 (Unauthorized), redirigir al login
        if (error.status === 401) {
          this.facadeService.destroyUser();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
