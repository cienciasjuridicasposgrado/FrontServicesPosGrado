import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment, UrlTree, provideRouter } from '@angular/router';
import { Observable, Subject, firstValueFrom, of } from 'rxjs';
import { AuthService, SessionState } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;
  let initializeSession: jasmine.Spy<() => Observable<SessionState>>;

  beforeEach(() => {
    initializeSession = jasmine.createSpy('initializeSession');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { initializeSession } }
      ]
    });
    router = TestBed.inject(Router);
  });

  function runGuard(segments = [new UrlSegment('dashboard', {})]) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as Route, segments) as Observable<boolean | UrlTree>
    );
  }

  it('waits for session initialization before deciding', () => {
    const state = new Subject<SessionState>();
    initializeSession.and.returnValue(state);
    let result: boolean | UrlTree | undefined;

    runGuard().subscribe((value) => result = value);
    expect(result).toBeUndefined();

    state.next('authenticated');
    expect(result).toBeTrue();
  });

  it('allows an authenticated session', async () => {
    initializeSession.and.returnValue(of('authenticated'));

    expect(await firstValueFrom(runGuard())).toBeTrue();
  });

  it('redirects an anonymous session to login and preserves returnUrl', async () => {
    initializeSession.and.returnValue(of('anonymous'));
    const result = await firstValueFrom(runGuard([
      new UrlSegment('dashboard', {}),
      new UrlSegment('users', {})
    ]));

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/auth/login?returnUrl=%2Fdashboard%2Fusers'
    );
  });

  it('redirects an initialization error to login without waiting indefinitely', async () => {
    initializeSession.and.returnValue(of('error'));
    const result = await firstValueFrom(runGuard());

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/auth/login?returnUrl=%2Fdashboard'
    );
  });
});
