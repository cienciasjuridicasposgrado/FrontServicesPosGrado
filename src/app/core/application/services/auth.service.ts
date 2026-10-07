import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError
} from 'rxjs';
import { LoginRequest, LoginResponse, UserModel } from '../../domain/models/user.model';
import { AUTH_TOKEN_STORAGE_KEY } from '../auth.constants';
import { LoginUseCase } from '../usecase/auth/login.usecase';
import { LogoutUseCase } from '../usecase/auth/logout.usecase';
import { GetProfileUseCase } from '../usecase/auth/profile.usecase';

export type SessionState = 'loading' | 'authenticated' | 'anonymous' | 'error';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<UserModel | null>(null);
  private readonly sessionStateSubject = new BehaviorSubject<SessionState>('loading');
  private initialization$?: Observable<SessionState>;
  private redirectingToLogin = false;

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly sessionState$ = this.sessionStateSubject.asObservable();

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly profileUseCase: GetProfileUseCase,
    private readonly router: Router
  ) {}

  initializeSession(): Observable<SessionState> {
    if (this.sessionStateSubject.value !== 'loading') {
      return of(this.sessionStateSubject.value);
    }

    if (!this.initialization$) {
      if (!this.getStoredAccessToken()) {
        this.setAnonymous();
        this.initialization$ = of('anonymous');
      } else {
        this.initialization$ = this.profileUseCase.execute().pipe(
          tap((user) => this.setAuthenticated(user)),
          map((): SessionState => 'authenticated'),
          catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.clearSession();
              return of<SessionState>('anonymous');
            }

            // A transient backend/network failure must not invalidate the credential.
            this.currentUserSubject.next(null);
            this.sessionStateSubject.next('error');
            return of<SessionState>('error');
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      }
    }

    return this.initialization$;
  }

  login(credentials: LoginRequest): Observable<UserModel> {
    return this.loginUseCase.execute(credentials).pipe(
      map((response) => this.requireAccessToken(response)),
      switchMap((accessToken) => {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
        this.currentUserSubject.next(null);
        this.sessionStateSubject.next('loading');

        return this.profileUseCase.execute().pipe(
          tap((user) => this.setAuthenticated(user)),
          catchError((error: unknown) => {
            this.clearSession();
            return throwError(() => error);
          })
        );
      })
    );
  }

  logout(): void {
    this.logoutUseCase.execute().pipe(
      finalize(() => this.clearSessionAndRedirect())
    ).subscribe({
      error: () => undefined
    });
  }

  handleUnauthorized(returnUrl?: string): void {
    const wasInitializing = this.sessionStateSubject.value === 'loading';
    const hadSession = this.hasStoredCredential() ||
      this.currentUserSubject.value !== null ||
      this.sessionStateSubject.value === 'authenticated';

    this.clearSession();

    // During bootstrap/login hydration, the active guard or login screen owns navigation.
    if (hadSession && !wasInitializing) {
      this.redirectToLogin(returnUrl);
    }
  }

  isAuthenticated(): boolean {
    return this.sessionStateSubject.value === 'authenticated';
  }

  hasStoredCredential(): boolean {
    return this.getStoredAccessToken() !== null;
  }

  getCurrentUser(): UserModel | null {
    return this.currentUserSubject.value;
  }

  private requireAccessToken(response: LoginResponse): string {
    const accessToken = response?.access_token;

    if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
      throw new Error('La respuesta de autenticación no contiene un access_token válido.');
    }

    return accessToken.trim();
  }

  private getStoredAccessToken(): string | null {
    const accessToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return accessToken?.trim() ? accessToken : null;
  }

  private setAuthenticated(user: UserModel): void {
    this.currentUserSubject.next(user);
    this.sessionStateSubject.next('authenticated');
  }

  private setAnonymous(): void {
    this.currentUserSubject.next(null);
    this.sessionStateSubject.next('anonymous');
  }

  private clearSession(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    this.setAnonymous();
  }

  private clearSessionAndRedirect(): void {
    this.clearSession();
    this.redirectToLogin();
  }

  private redirectToLogin(returnUrl?: string): void {
    if (this.redirectingToLogin || this.router.url.startsWith('/auth/login')) {
      return;
    }

    this.redirectingToLogin = true;
    const queryParams = returnUrl && returnUrl !== '/auth/login' ? { returnUrl } : undefined;
    void this.router.navigate(['/auth/login'], { queryParams }).finally(() => {
      this.redirectingToLogin = false;
    });
  }
}
