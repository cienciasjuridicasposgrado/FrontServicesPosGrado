import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, Subject, firstValueFrom, of } from 'rxjs';
import { AuthService, SessionState } from '../services/auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
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

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      guestGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/auth/login' } as RouterStateSnapshot
      ) as Observable<boolean | UrlTree>
    );
  }

  it('waits for session initialization before deciding', () => {
    const state = new Subject<SessionState>();
    initializeSession.and.returnValue(state);
    let result: boolean | UrlTree | undefined;

    runGuard().subscribe((value) => result = value);
    expect(result).toBeUndefined();

    state.next('anonymous');
    expect(result).toBeTrue();
  });

  it('redirects an authenticated user to dashboard', async () => {
    initializeSession.and.returnValue(of('authenticated'));
    const result = await firstValueFrom(runGuard());

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('allows an anonymous user to open login', async () => {
    initializeSession.and.returnValue(of('anonymous'));

    expect(await firstValueFrom(runGuard())).toBeTrue();
  });

  it('allows login after an initialization error to avoid a redirect loop', async () => {
    initializeSession.and.returnValue(of('error'));

    expect(await firstValueFrom(runGuard())).toBeTrue();
  });
});
